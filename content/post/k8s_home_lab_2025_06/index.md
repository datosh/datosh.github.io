---
title: "Kubernetes Home Lab in 2025: Part 6 - Identity & Access Management"
date: 2025-03-19
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_06.png"
Tags: ["k8s", "home lab", "kubernetes", "iam"]
Draft: true
---

So how often do you create a users? Why is that?

##

Just how long is this page?
https://kubernetes.io/docs/reference/access-authn-authz/authentication/

## Goals

+ Passkey / WebAuthn support
+ OIDC support
+ LDAP support

Make this a grid? and compare features?

Options:

+ [dex](https://github.com/dexidp/dex), only proxies the authentication to other providers like GitHub, Google, etc.
+ [Keycloak](https://www.keycloak.org/), no one should go through the pain of setting this up in 2025.
+ [Rauthy](https://sebadob.github.io/rauthy/intro.html)
+ [Kandim](https://kanidm.github.io/kanidm/stable/introduction_to_kanidm.html)


## Kanidm
