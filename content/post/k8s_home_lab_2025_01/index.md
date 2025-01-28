---
title: "Kubernetes Home Lab in 2025: Part 1 - CNI & GitOps"
date: 2025-02-12
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_01.png"
Tags: ["k8s", "home lab", "kubernetes", "libvirt", "kubeadm", "terraform"]
Draft: true
---

[Last time](/post/k8s_home_lab_2025_00), we left our Cluster in a semi-happy state: The nodes were up,
the control plane was available, but we had no cluster network.
Today, we will fix that, and a bit more.

## Local Access

First, let's make sure we can access the cluster from our local machine.
I like to keep my SSH configs modular so simply add this file:

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

Then, we copy the kubeconfig file from the control plane node to our local machine.

```bash
scp control-plane-01:~/.kube/config ~/.kube/config
```

## Cillium

Cilium is one of the many [CNI plugins](https://kubernetes.io/docs/concepts/cluster-administration/addons/#networking-and-network-policy) available for Kubernetes. Besides adding networking
capabilties to our cluster it comes with many security and observability features.
We will keep the installation and configuration basic for now, but we will revisit this
later to explore and add more features!

```bash
helm repo add cilium https://helm.cilium.io/
helm install cilium cilium/cilium --version 1.16.5 --namespace kube-system
```

Cilium also provides a CLI tool that we can use to verify the installation.

```bash
# Install Cilium CLI
curl -LO https://github.com/cilium/cilium-cli/releases/download/v0.16.23/cilium-linux-amd64.tar.gz
tar xzf cilium-linux-amd64.tar.gz
sudo install cilium /usr/local/bin/cilium
rm cilium cilium-linux-amd64.tar.gz

# Verify
cilium status --wait
# This actually runs for a couple of minutes
cilium connectivity test
# All happy pods
kubectl get pods -A
```

Cool that was easy! The thing is, we said we wanted everything tracked as code
and imperatively installing Helm charts is not it. Let's fix that!

## Flux
