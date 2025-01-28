---
title: "Kubernetes Home Lab in 2025: Introduction"
date: 2025-02-04
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
1. I could run stuff in the cloud, but I have hardware lying around,
    bought with the best intentions, so I might as well use it.
1. Cloud providers, well, provide a lot of stuff, so their customers don't
    have to think about it, and I kinda want to think about it when learning.
    Same goes for the likes of [minikube](https://minikube.sigs.k8s.io/docs/start/),
    [kind](https://kind.sigs.k8s.io/), ... they have plugins for features such as
    ingress, storage, ... and that makes them easy to use, but not the best learning platform.

## Goals

1. Feature parity with a small cloud provider. What do I mean by that?
    I want things to work out of the box: ingress, storage, monitoring & logging,
    identity & access management (IAM), ... let's see how many parts this
    series will have
1. Everything defined as code. I want to be able to tear down and rebuild my
    cluster with a few commands, enabling us to try things without fear of breaking
    stuff. If we do, we just rebuild it.
1. HTTPs everywhere, I want to have a valid certificate and a proper domain for
    every service I deploy, none of that self-signed crap.

## Non-Goals

1. High availability: no users, no SLOs - hurray!
1. Security, as in so far that I don't have to stress about someone taking over
my cloud account, if I mess up. I will follow best practices and tinker with
modern tools, e.g., we'll be authenticating with WebAuthn to our K8s cluster later!
1. **Full** automation is awesome for any real-world scenario,
but it's a huge time investment to work out all the edge-cases and integrations.
I'm happy to copy & paste a few commands or manually wait for a condition to be met,
instead of ironing out every single kink.

## Pre-requisites

If you want to follow along you would need to have or setup the following:

1. A **domain name**, for me that's `kammel.dev`, which is hosted by
    [Cloudflare](https://www.cloudflare.com/).
1. The ability to configure **DHCP & DNS** in your home network, I'm running
    [opnsense](https://opnsense.org/), but really any router with these features
    should do.
1. Some compute & storage. I'm using a single box with an **AMD Ryzen 5 1600**
    and **32GB RAM**, **256GB SSD** for the OS and a **2x1TB HDD** for our
    persistent storage needs.

## Table of Contents

This series will be split into multiple parts, each focusing on a different feature.
I will update this list as I go and link to the respective parts.

+ [Part 0 - Bootstrapping the Cluster](/post/k8s_home_lab_2025_00/)
    will lay the ground work for our cluster. We will use
    [Terraform](https://www.terraform.io/) to
    codify our [libvirt](https://libvirt.org/) provided virtual machines,
    provision them with [cloudinit](https://cloudinit.readthedocs.io/en/latest/),
    and bootstrap Kubernetes with [kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/).
+ [Part 1 - CNI & GitOps](/post/k8s_home_lab_2025_01/)
    will answer the age old question: Which came first? The CNI or GitOps?
    We will install [Cilium](https://cilium.io/) as our CNI, then we install
    [Flux](https://fluxcd.io/) to manage our cluster configuration, and finally
    "put the chicken back into the egg", by transfering the responsibility of
    managing the Cilium deployment back to Flux.
+ [Part 2 - Automated Dependency Updates](/post/k8s_home_lab_2025_02/)
    will dive into the benefits of version pinning, and cover how to install
    and configure [Renovate](https://www.mend.io/renovate/) to automate the boring
    task of staying up date.
+ [Part 3 - Ingress](/post/k8s_home_lab_2025_03/) will cover how to install
    [ingress-nginx](https://kubernetes.github.io/ingress-nginx/) as our ingress
    controller, just to recognize that we also need [MetalLB](https://metallb.universe.tf/)
    in the absence of a cloud provider.
+ [Part 4 - Cert-Manager](/post/k8s_home_lab_2025_04/) will cover how to install
    [cert-manager](https://cert-manager.io/docs/) and hook it up to our Cloudflare
    account to automatically provision certificates for our services.
+ [Part 5 - Persistent Storage](/post/k8s_home_lab_2025_05/) will enable stateful
    applications. We will have some fun with [fio](https://fio.readthedocs.io/en/latest/fio_doc.html)
    and RAID configurations to build a basic
    [NFS server](https://documentation.ubuntu.com/server/how-to/networking/install-nfs/)
    to provide persistent storage for our cluster. Finally, we make it available in our cluster using
    [NFS Subdirectory External Provisioner](https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/).
+ [Part 6 - Identity & Access Management](/post/k8s_home_lab_2025_06/) will install
    [Kanidm](https://kanidm.com/) as our identity provider for password-less authentication.
    Then we configure our kubeapi-server to support OIDC authentication backed by
    Kanidm. This will be a fun one!
+ Part X - TBD

## Conclusion

I hope you are as excited as I am to get started. I will publish one part every week, so stay tuned!

Anything you want to see in this series as a future part? [Let me know](https://www.linkedin.com/in/fabian-kammel-7781b7173/)!
