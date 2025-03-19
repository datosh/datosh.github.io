---
title: "Kubernetes Home Lab in 2025: Part 5 - Persistent Storage"
date: 2025-03-19
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_05.png"
Tags: ["k8s", "home lab", "kubernetes", "storage"]
Draft: false
---

Up until this point, we have only persisted data in K8s' `etcd` database.
Stateless workloads are nice, but at some point we want some of our data to
survive a pod restart. In this part we will setup a basic NFS server to provide
persistent storage and then make it available to our workloads using the
[NFS Subdirectory External Provisioner](https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/).

We could have used
[Longhorn](https://longhorn.io/),
[OpenEBS](https://github.com/openebs/openebs), or
[Rook](https://github.com/rook/rook)
for this, but I wanted to keep it simple, for now.
Also, there is the [NFS CSI driver](https://github.com/kubernetes-csi/csi-driver-nfs),
in case [you want to go that route](https://serverfault.com/questions/1159882/why-the-nfs-csi-driver-is-recommended-over-the-nfs-in-tree-driver).

{{< info warn >}}
Even though this is a home lab series, and it should go without saying that none
of this is ready for production, I feel compelled to point out that this
part in particular is not. There are very little security guarantees around the
storage we set up, so make sure you trust everyone on your homelab's network.
{{< /info >}}

## NFS Server - Disks

Before we get started with the actual NFS server setup, let's have a look at the
disks we have available.

```bash
$ lsblk
NAME             MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
sda                8:0   0  931.5G  0 disk
sdb                8:16  0  931.5G  0 disk
[...]
```

These are two 1 TB HDD disks, `WDC WD10EZRZ-00H` to be precise.

Let's do some basic tests to see how our disks perform. Why? Because we can!
But also, it is helpful to have a rough idea of the performance characteristics of your system,
in case you need to debug some performance issues later on. Who is slow? The database? My disks? Or the NFS?

For the test we will use
[fio](https://fio.readthedocs.io/en/latest/fio_doc.html),
and carry out 4 tests:
+ **sequential** read & write
+ **random** read & write

Here is the fio configuration file `fio.conf`:

```ini
[global]
ioengine=libaio
direct=1
bs=1M
size=1G
runtime=60
time_based
group_reporting

[seq-write]
rw=write
filename=/mnt/sda1/seq-write

[seq-read]
rw=read
filename=/mnt/sda1/seq-write

[rand-write]
rw=randwrite
filename=/mnt/sda1/rand-write

[rand-read]
rw=randread
filename=/mnt/sda1/rand-write
```

{{< info note >}}
Ensure `filename` matches the mount point of your particlar disk and system.
{{< /info >}}

Then run the tests with:

```bash
fio fio.conf
```

### Test 1: Single XFS Disk

Let's format and mount our first disk, and run the test:

```bash
sudo mkfs.xfs /dev/sda
sudo mount /dev/sda /mnt/sda1
fio fio.conf
```

Which yields the following results:

```bash
Run status group 0 (all jobs):
   READ: bw=90.7MiB/s (95.1MB/s), 90.7MiB/s-90.7MiB/s (95.1MB/s-95.1MB/s), io=5445MiB (5709MB), run=60036-60036msec
  WRITE: bw=68.4MiB/s (71.7MB/s), 68.4MiB/s-68.4MiB/s (71.7MB/s-71.7MB/s), io=4105MiB (4304MB), run=60023-60023msec
```

### Test 2: RAID0 with 2 XFS Disks

Now, let's create a RAID0 array with both disks and run the test again:

```sh
sudo mdadm --create /dev/md0 --level=0 --raid-devices=2 /dev/sda /dev/sdb
# Persist the RAID configuration
sudo mdadm --detail --scan | sudo tee /etc/mdadm/mdadm.conf
sudo mkfs.xfs /dev/md0
sudo mount /dev/md0 /mnt/sda1
fio fio.conf
```

Which yields the following results:

```bash
Run status group 0 (all jobs):
   READ: bw=103MiB/s (108MB/s), 103MiB/s-103MiB/s (108MB/s-108MB/s), io=6205MiB (6506MB), run=60005-60005msec
  WRITE: bw=114MiB/s (120MB/s), 114MiB/s-114MiB/s (120MB/s-120MB/s), io=6845MiB (7178MB), run=60005-60005msec
```

As RAID0 is a striping configuration, we would expect the write performance to improve,
and this is what we get! This should be good enough as the base for our NFS server.

Let's persist the configuration so that it survives a reboot:

```bash
UUID=$(blkid -s UUID -o value /dev/md0)
echo "UUID=$UUID /mnt/nfs-server xfs defaults 0 2" | sudo tee -a /etc/fstab
sudo update-initramfs -u
```

## NFS Server - Configuration

Now that we have our disks ready, let's
[install the NFS server](https://documentation.ubuntu.com/server/how-to/networking/install-nfs/index.html):

```bash
sudo apt install nfs-kernel-server
sudo systemctl start nfs-kernel-server.service
sudo mkdir /mnt/nfs-server
sudo mount /dev/md0 /mnt/nfs-server
sudo chmod 777 /mnt/nfs-server
# This ensures that any Kubernetes pod, regardless of its user ID,
# can access the directory without permission issues.
# nobody:nogroup is a standard unprivileged user/group for NFS exports.
sudo chown nobody:nogroup /mnt/nfs-server
echo "/mnt/nfs-server *(rw,sync,no_subtree_check,no_root_squash)" | sudo tee -a /etc/exports
sudo exportfs -a
sudo systemctl restart nfs-kernel-server
```

Make note of the IP address of the NFS server, in my case `192.168.1.5`, and
the mount path `/mnt/nfs-server`, as we will need it later.

## NFS Subdirectory External Provisioner

First, we need to install the required packages on **all** our nodes:

```bash
sudo apt update
sudo apt install nfs-common
```

As a quick sanity check, we can mount & unmount the NFS share on each node in turn:

```bash
sudo mkdir /mnt/nfs
sudo mount -t nfs 192.168.1.5:/mnt/nfs-server /mnt/nfs
sudo umount /mnt/nfs
```

Now, let's install the NFS Subdirectory External Provisioner, by adding the
following definitions:

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: nfs
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: nfs-subdir-external-provisioner
  namespace: nfs
spec:
  interval: 5m0s
  url: https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: nfs-provisioner
  namespace: nfs
spec:
  chart:
    spec:
      chart: nfs-subdir-external-provisioner
      reconcileStrategy: ChartVersion
      sourceRef:
        kind: HelmRepository
        name: nfs-subdir-external-provisioner
      version: 4.0.18
  interval: 5m0s
  values:
    nfs:
      server: 192.168.1.5
      path: /mnt/nfs-server
    storageClass:
      defaultClass: true
```

## Test Deployment

Finally, let's test our setup with a simple deployment:

`pvc.yaml`
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-dynamic-pvc
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

`pod.yaml`
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nfs-dynamic-test-pod
spec:
  containers:
  - name: test-container
    image: ubuntu
    command: ["sleep", "3600"]
    volumeMounts:
    - mountPath: "/mnt/test"
      name: nfs-storage
  volumes:
  - name: nfs-storage
    persistentVolumeClaim:
      claimName: nfs-dynamic-pvc
```

This also allows us to `kubectl exec` into the pod and re-run the fio test!

```bash
apt update
apt install fio
fio /mnt/test/fio.conf
```

Which yields the following results:

```bash
Run status group 0 (all jobs):
   READ: bw=1312MiB/s (1375MB/s), 1312MiB/s-1312MiB/s (1375MB/s-1375MB/s), io=76.9GiB (82.5GB), run=60002-60002msec
  WRITE: bw=19.7MiB/s (20.7MB/s), 19.7MiB/s-19.7MiB/s (20.7MB/s-20.7MB/s), io=1185MiB (1243MB), run=60014-60014msec
```

## Results & Conclusion

I have no idea what magic the NFS Subdirectory External Provisioner is working
here, but we have a 10x spead-up in read performance, and a 5x degradation in
write performance.

| Test            | Read      | Write    |
|-----------------|-----------|----------|
| 1TB XFS         | 90   MB/s | 68  MB/s |
| 2X1TB RAID0 XFS | 103  MB/s | 114 MB/s |
| K8s NFS PV      | 1375 MB/s | 20  MB/s |

I guess we take this as input for yet another blog post ¯\\_(ツ)_/¯
If you have any insights, please [let me know](https://www.linkedin.com/in/fabian-kammel-7781b7173/).

## Troubleshooting

Remember that I said we need to install the NFS client on all nodes... well in
case you forgot to do that, you might see the following error:

```sh
Events:
  Type     Reason       Age               From               Message
  ----     ------       ----              ----               -------
  Normal   Scheduled    21s               default-scheduler  Successfully assigned default/nfs-provisioner-nfs-subdir-external-provisioner-5b97f88d88z7gm7 to worker
  Warning  FailedMount  5s (x6 over 21s)  kubelet            MountVolume.SetUp failed for volume "pv-nfs-provisioner-nfs-subdir-external-provisioner" : mount failed: exit status 32
Mounting command: mount
Mounting arguments: -t nfs -o nfsvers=4.1 192.168.1.5:/mnt/nfs-server /var/lib/kubelet/pods/70a8024a-b2d2-4330-852f-83a15d0005ee/volumes/kubernetes.io~nfs/pv-nfs-provisioner-nfs-subdir-external-provisioner
Output: mount: /var/lib/kubelet/pods/70a8024a-b2d2-4330-852f-83a15d0005ee/volumes/kubernetes.io~nfs/pv-nfs-provisioner-nfs-subdir-external-provisioner: bad option; for several filesystems (e.g. nfs, cifs) you might need a /sbin/mount.<type> helper program.
       dmesg(1) may have more information after failed mount system call.
```

Don't ask me how I know this...
