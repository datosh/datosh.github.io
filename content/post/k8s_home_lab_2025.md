---
title: "Kubernetes Home Lab in 2025: Introduction"
date: 2025-01-11
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025.png"
Tags: ["k8s", "home lab", "kubernetes"]
Draft: true
---

The year was 2024, cyber monday was rolling by and my manager pointed out that
I still have budget for training and certifications available. One purchase of
a [Kubestronaut Certification Bundle](https://training.linuxfoundation.org/cyber-monday-2024-post/)
and a few weeks later, I kinda have to face it: I need a new home lab.

## Motivation

So why a home lab exactly? Well, I have a few reasons:

1. It's fun
2. I could run stuff in the cloud, but I have hardware lying around, bought with the best intentions, so I might as well use it.
3. Cloud providers, well, provide a lot of stuff, so their customers don't have to think about it, and I kinda want to think about it when learning.
4. Same goes for things like [minikube](https://minikube.sigs.k8s.io/docs/start/), [kind](https://kind.sigs.k8s.io/), ... they have plugins for things like ingress, storage, ... and that makes them easy to use, but not the best training platform.

## Goals

+ Feature parity with a small cloud provider, what do I mean by that? I want things to work out of the box:
    + Ingress
    + Storage
    + Monitoring & Logging
    + ... (let's see how many parts this guide will have)
+ HTTPs everywhere, I want to have a valid certificate and a proper domain for every service I deploy, none of that self-signed stuff.

## Non-Goals

+ High availability, no users, no SLOs - hurray!
+ Security, as in so far that I don't have to stress about someone taking over
my cloud account, if I mess up. I still want to follow best practices and
tinker with modern tools (we'll be authenticating with WebAuthn to our K8s cluster later!)
+ **Full** automation, again, automation is awesome for any real-world scenario,
but it's a huge time investment to work out all the edge-cases and integrations.
I'm happy to copy & paste a few commands here and there.

## Pre-requisites

If you want to follow along you would need to have or setup the following:

+ A **domain name**, for me that's `kammel.dev`, which is hosted by [Cloudflare](https://www.cloudflare.com/)
+ The ability to configure a **DHCP & DNS** in your home network
+ A [kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/) cluster, I'm using:
    + 1 control plane node (2GB RAM)
    + 1 worker node (4GB RAM)
    + Ubuntu Server 24.04 LTS
    + [Weave Net](https://www.weave.works/docs/net/latest/overview/) as the CNI, though, you can [choose any](https://kubernetes.io/docs/concepts/cluster-administration/addons/#networking-and-network-policy)
+ A machine to setup our NFS server. I'm using a box with 2x1TB HDDs attached.

These things will be out of scope for this guide. [Let me know](https://www.linkedin.com/in/fabian-kammel-7781b7173/), if you are interested in a part 0 for any of these topics.

## Table of Contents

This guide will be split into multiple parts, each focusing on a different feature.

I will update this list as I go and link to the respective parts.

### Part1: Persistent Storage

First, we will have some fun with [fio](https://fio.readthedocs.io/en/latest/fio_doc.html)
and RAID configurations to build a basic NFS server to provide persistent storage
for our cluster. Then we make it available in our cluster using
[NFS Subdirectory External Provisioner](https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/).

Probably the least 2025 thing to do, but we can upgrade to [Longhorn](https://longhorn.io/), later.

### Part2: Ingress

This setup will cover how to install
[ingress-nginx](https://kubernetes.github.io/ingress-nginx/) as our ingress
controller, just to recognize that we also need [MetalLB](https://metallb.universe.tf/)
in the absence of a cloud provider in order to implement Layer 2 load balancing.

### Part3: Cert-Manager

Next, since we want to have HTTPS everywhere, we will install
[cert-manager](https://cert-manager.io/docs/) and hook it up to our Cloudflare
account to automatically provision certificates for our services.

### Part4: Kanidm

At this point we have a working cluster, so we can start to deploy interesting applications.
We will install [Kanidm](https://kanidm.com/) as our identity provider for password-less authentication.
Then we configure our kubeapi-server to support OIDC authentication backed by Kanidm. This will be a fun one!

### PartX: TBD

...

## Conclusion

I hope you are as excited as I am to get started. I will publish one part every week,
and keep this list running, so stay tuned!
