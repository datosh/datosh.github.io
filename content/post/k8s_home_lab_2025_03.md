---
title: "Kubernetes Home Lab in 2025: Part 3 - Persistent Storage"
date: 2025-01-11
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_03.png"
Tags: ["k8s", "home lab", "kubernetes", "storage"]
Draft: true
---

Stateless applications are nice, but at some point you will probably want
some of your data to survive a pod restart. In this part we will setup a basic
NFS server to provide persistent storage for our cluster. Then, we make it available
in our cluster using
[NFS Subdirectory External Provisioner](https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/).

As mentioned in the [introduction](/post/k8s_home_lab_2025/), we could have used
[Longhorn](https://longhorn.io/) for this, but I wanted to keep it simple for now.
Also, there is the [NFS CSI driver](https://github.com/kubernetes-csi/csi-driver-nfs),
in case [you want to go that route](https://serverfault.com/questions/1159882/why-the-nfs-csi-driver-is-recommended-over-the-nfs-in-tree-driver).

## NFS Server - Disks

Before we get started with the actual NFS server setup, let's have a look at the
disks we have available.

```bash
$ lsblk
NAME             MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
sda                8:0   0  931.5G  0 disk
sdb                8:16  0  931.5G  0 disk
```

These are two 1 TB HDD disks, `WDC WD10EZRZ-00H` to be precise.

Let's do some basic tests to see how our disks perform. Why? Because we can!
But also, it is helpful to have a rough idea of the performance characteristics of your system,
in case you need to debug some performance issues later on. Is it the database? Or my disks? Or the NFS?

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

Note: Make sure to adjust the `filename` to your mount point.

We can run the tests with:

```bash
fio fio.conf
```

### 1 TB XFS

Let's format and mount our first disk and run the test:

```bash
sudo mkfs.xfs /dev/sda
sudo mount /dev/sda /mnt/sda1
fio fio.conf
```

Which presented me with the following results:

```bash
Run status group 0 (all jobs):
   READ: bw=90.7MiB/s (95.1MB/s), 90.7MiB/s-90.7MiB/s (95.1MB/s-95.1MB/s), io=5445MiB (5709MB), run=60036-60036msec
  WRITE: bw=68.4MiB/s (71.7MB/s), 68.4MiB/s-68.4MiB/s (71.7MB/s-71.7MB/s), io=4105MiB (4304MB), run=60023-60023msec
```

### RAID0 2x1 TB XFS

Now, let's create a RAID0 array with both disks and run the test again:

```sh
sudo mdadm --create /dev/md0 --level=0 --raid-devices=2 /dev/sda /dev/sdb
# Persist the RAID configuration
sudo mdadm --detail --scan | sudo tee /etc/mdadm/mdadm.conf
sudo mkfs.xfs /dev/md0
sudo mount /dev/md0 /mnt/sda1
fio fio.conf
```

Which gave me the following results:

```bash
Run status group 0 (all jobs):
   READ: bw=103MiB/s (108MB/s), 103MiB/s-103MiB/s (108MB/s-108MB/s), io=6205MiB (6506MB), run=60005-60005msec
  WRITE: bw=114MiB/s (120MB/s), 114MiB/s-114MiB/s (120MB/s-120MB/s), io=6845MiB (7178MB), run=60005-60005msec
```

As RAID0 is a striping configuration, we would expect the write performance to improve.

This should be good enough for our NFS server.

## NFS Server - Configuration

Now that we have our disks ready, let's install the NFS server:

```bash
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
To do a quick sanity check, we can mount the NFS share on each node in turn:

```bash
sudo mkdir /mnt/nfs
sudo mount -t nfs 192.168.1.5:/mnt/nfs-server /mnt/nfs
sudo umount /mnt/nfs
```

Now, let's install the NFS Subdirectory External Provisioner:

```bash
helm repo add nfs-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
helm repo update
helm upgrade nfs-provisioner nfs-provisioner/nfs-subdir-external-provisioner \
  --install \
  --reuse-values \
  --set nfs.server=192.168.1.5 \
  --set nfs.path=/mnt/nfs-server \
  --set storageClass.defaultClass=true
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

## Results & Conclusion

I have no idea what magic the NFS Subdirectory External Provisioner is working
here, but I did not expect a speed-up. If you have any insights, please [let me know](https://www.linkedin.com/in/fabian-kammel-7781b7173/).

| Test            | Read      | Write    |
|-----------------|-----------|----------|
| 1TB XFS         | 90   MB/s | 68  MB/s |
| 2X1TB RAID0 XFS | 103  MB/s | 114 MB/s |
| K8s NFS PV      | 1424 MB/s | 151 MB/s |

I'm happy with the results, and we can move on to the next part.

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
