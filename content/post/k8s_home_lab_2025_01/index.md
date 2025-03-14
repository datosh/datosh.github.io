---
title: "Kubernetes Home Lab in 2025: Part 1 - CNI & GitOps"
date: 2025-02-12
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_01.png"
Tags: ["k8s", "home lab", "kubernetes", "libvirt", "kubeadm", "terraform"]
Draft: false
---

[Last time](/post/k8s_home_lab_2025_00), we left our Cluster in a semi-happy state:
The nodes were up, the control plane was available, but we had no cluster network.
Today, we will fix that, and a bit more.

## Local Access

First, let's make sure we can access the cluster from our local machine.
I like to keep my SSH configs modular. So we create a new file:

```bash
Host control-plane-01
    HostName 192.168.1.16
    User ubuntu

Host worker-01
    HostName 192.168.1.17
    User ubuntu
```

and then reference it in the `~/.ssh/config` file.

```bash
Include ~/.ssh/k8s_cluster_config
```

Finally, we fetch the kubeconfig file from the control plane node:

```bash
scp control-plane-01:~/.kube/config ~/.kube/config
```

And do a quick sanity check:

```console
$ kubectl get nodes
NAME               STATUS     ROLES           AGE     VERSION
control-plane-01   NotReady   control-plane   5m21s   v1.32.1
worker-01          NotReady   <none>          5m7s    v1.32.1
```

Looks good! Let's move on to the networking part.

## Cilium

Cilium is one of the many [CNI plugins](https://kubernetes.io/docs/concepts/cluster-administration/addons/#networking-and-network-policy) available for Kubernetes. Besides adding networking
capabilities to our cluster it comes with many security and observability features.
We will keep the installation and configuration basic for now, but we will revisit this
later to explore and add more features!

First, we add the Cilium Helm repository:

```bash
helm repo add cilium https://helm.cilium.io/
```

Then, we install Cilium:

```bash
helm install cilium cilium/cilium --version 1.16.5 --namespace kube-system
```

Cilium also provides a CLI that we can use to verify the installation. Download
the binary and install it:

```bash
curl -LO https://github.com/cilium/cilium-cli/releases/download/v0.16.23/cilium-linux-amd64.tar.gz
tar xzf cilium-linux-amd64.tar.gz
sudo install cilium /usr/local/bin/cilium
rm cilium cilium-linux-amd64.tar.gz
```

Finally, we verify the installation:

```console
$ cilium status --wait

    /¯¯\
 /¯¯\__/¯¯\    Cilium:             OK
 \__/¯¯\__/    Operator:           OK
 /¯¯\__/¯¯\    Envoy DaemonSet:    OK
 \__/¯¯\__/    Hubble Relay:       disabled
    \__/       ClusterMesh:        disabled

$ kubectl get nodes
NAME               STATUS   ROLES           AGE   VERSION
control-plane-01   Ready    control-plane   13m   v1.32.1
worker-01          Ready    <none>          13m   v1.32.1
```

{{< info note >}}
For a more thorough test, you can additionally run `cilium connectivity test`.
This will run for a couple of minutes, but will verify that all features are
working as expected.
{{< /info >}}

Cool that was easy! The problem is, we want everything tracked as code
and imperatively installing Helm charts is... not that. Let's fix that!

## Flux

Flux is a tool for [GitOps](https://www.gitops.tech/) that allows us to
declaratively manage our Kubernetes cluster, by storing the desired state in
a Git repository. Flux will then observe both the repository and the cluster,
and keep the desired and actual state in sync.

### GitHub Prerequisites

As we will be using GitHub to store our desired state, we need both a repository
and an access token that Flux can use to obtain the desired state from the given
repository. We configure Flux to use a specific subdirectory in a repository,
so no dedicated repository is needed. I keep all my home labs in a single monorepo,
but you can also create a dedicated repository for yours!

Then, we create a fine-grained personal access token, the following way:

1. We go to the [Fine-grained personal access tokens](https://github.com/settings/personal-access-tokens) page.
1. We click on "Generate new token", and give it a name.
1. For "Repository Access" we choose "Only select repositories", and select the
repository that we want to use for our home lab.
1. We set the "Repository permissions" as:
    * Administration: Read-only
    * Contents: Read and write
    * Metadata: Read-only
1. Finally, we click on "Generate token", and store the token in a secure location.

Doesn't it feel good to apply least privilege? Just me? Ok.

{{< info note >}}
You can always regenerate the token from the
[fine-grained personal access tokens](https://github.com/settings/personal-access-tokens)
page, if you think it has been compromised or it has expired.
{{< /info >}}


### Install Flux CLI

As with most things these days, Flux comes as a statically linked binary,
so we can easily download and install it. If you prefer using a package manager,
[check out the Flux documentation](https://fluxcd.io/flux/installation/#install-the-flux-cli).

```bash
curl -LO https://github.com/fluxcd/flux2/releases/download/v2.4.0/flux_2.4.0_linux_amd64.tar.gz
tar xzf flux_2.4.0_linux_amd64.tar.gz
sudo install flux /usr/local/bin/flux
rm flux flux_2.4.0_linux_amd64.tar.gz
```

### Bootstrap Flux

Now we can link Flux to our GitHub repository, I will be using the subdirectory
`k8s/flux` in my repository `home`. Adjust the values to your own repository and
preferences, and enter your GitHub personal access token when prompted:

```console
$ flux bootstrap github \
    --token-auth \
    --owner datosh \
    # denotes that owner is a GitHub user, as opposed to GitHub organization
    --personal \
    --repository home \
    --branch main \
    # drop the path if you create a dedicated repository
    --path ./k8s/flux

Please enter your GitHub personal access token (PAT):

► connecting to github.com
► cloning branch "main" from Git repository "https://github.com/datosh/home.git"
✔ cloned repository
► generating component manifests
[...]
► confirming components are healthy
✔ helm-controller: deployment ready
✔ kustomize-controller: deployment ready
✔ notification-controller: deployment ready
✔ source-controller: deployment ready
✔ all components are healthy
```

{{< info warn >}}
The **GitHub PAT is stored in plain text** in the `flux-system` namespace.
Follow the Flux documentation to
[use GitHub deployment keys](https://fluxcd.io/flux/installation/bootstrap/github/#github-deploy-keys)
if you have stricter security requirements.
{{< /info >}}

As we can see from the output, Flux has created a number of controllers in our
cluster.

```console
$ kubectl get pod -n flux-system
NAME                                       READY   STATUS    RESTARTS   AGE
helm-controller-5bb6849c4f-zr4jm           1/1     Running   0          1m13s
kustomize-controller-68597c4488-rp7z7      1/1     Running   0          1m13s
notification-controller-7d6f99878b-bwvvf   1/1     Running   0          1m13s
source-controller-666dc49455-9drcc         1/1     Running   0          1m13s
```

Each [controller](https://fluxcd.io/flux/components/) comes with it's own
custom resource definitions (CRDs), which we will explore in the next sections.

We can also see that Flux has pushed two commits to our repository:

{{< figure
    src="flux_commits.png"
    alt="Flux pushing commits to GitHub"
    caption="Flux pushing commits to GitHub"
>}}

If we inspect the commits, we can see that Flux manages it's own resources in the
the same way it manages all cluster state. Amazing! The inception continues.

### Putting the chicken back in the egg

Now that we have Flux in our cluster, we can rectify our previous shortcut of
installing Cilium manually.

Flux comes with a handy `flux create` command that we can use to create
a lot of the boilerplate for us. Let's starts by defining the source for the
Cilium Helm chart:

```bash
mkdir -p k8s/flux/cilium
flux create source helm cilium \
    --url https://helm.cilium.io/ \
    --export \
    > k8s/flux/cilium/repository.yaml
```

The `--export` flag will export the resource to a YAML file, instead of applying
it to the cluster!

Next, we create a resource that represents the installation of a Helm chart, the
HelmRelease:

```bash
flux create helmrelease cilium \
    --interval 5m \
    --source Helmrepository/cilium \
    --chart cilium \
    --chart-version 1.16.5 \
    --namespace kube-system \
    --export \
    > k8s/flux/cilium/release.yaml
```

If you compare this to the `helm install` command we ran earlier, you can see that
we are using the same chart and arguments. When we apply this resource to the
cluster, Flux will recognize that this is already installed, and assume control
over it, instead of installing it again.

Once we commit the changes to the repository, we should see additional Flux resources
being created:

```console
$ flux get helmreleases -n kube-system --watch
NAME    REVISION   READY   MESSAGE
cilium             False   waiting to be reconciled
cilium             False   HelmChart 'kube-system/kube-system-cilium' is not ready: ...
cilium             False   Unknown Running 'upgrade' action with timeout of 5m0s
cilium  1.16.5     False   Unknown Running 'upgrade' action with timeout of 5m0s
cilium  1.16.5     True    Helm upgrade succeeded for release kube-system/cilium.v2 with chart cilium@1.16.5
```

Let's check that everything is in order:

```console
$ helm history cilium -n kube-system
REVISION        UPDATED                         STATUS          CHART           APP VERSION     DESCRIPTION
1               Thu Jan 30 23:11:54 2025        superseded      cilium-1.16.5   1.16.5          Install complete
2               Mon Jan 30 23:25:43 2025        deployed        cilium-1.16.5   1.16.5          Upgrade complete
```

We can see that Flux correctly picked up on the fact that we already had
Cilium installed and pushed a new version of the Helm chart, instead of installing
it again.

### Bonus: Nudging Flux

As you may have noticed, there are different `interval` values defined for each
resource, which controls how frequently Flux checks remote locations for changes.
For the less patient among us, we can make use of `flux reconcile` to give Flux
a little nudge. Make sure to include the `--with-source` flag, so that Flux knows
to fetch the latest state from the repository as well. For example, if we made changes
to the Cilium Helm chart, we can reconcile the HelmRelease resource like this:

```console
flux reconcile helmrelease cilium --with-source
```

## Conclusion

In this post, we have installed both Cilium and Flux in our cluster, and have
solved a not so trivial dependency between the two.
[In the next post](/post/k8s_home_lab_2025_02/), we will
improve our GitOps story by adding automated dependency upgrades. Stay tuned!
