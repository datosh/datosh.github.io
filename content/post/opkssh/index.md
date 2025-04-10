---
title: OpenPubkey SSH (OPKSSH) With a Custom OpenID Provider
date: 2025-04-20
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_06.png"
Tags: ["ssh", "iam", "oidc", "kanidm"]
Draft: true
---

Cloudflare has
[recently open-sourced](https://blog.cloudflare.com/open-sourcing-openpubkey-ssh-opkssh-integrating-single-sign-on-with-ssh/)
their
[OPKSSH (OpenPubkey SSH) implementation](https://github.com/openpubkey/opkssh).
Since I am big fan of
[Sigstore](https://sigstore.dev/),
and this is very much in the vein of it, I wanted to take it for a spin!

## What is OPKSSH?

OPKSSH removes one more instance where we had to do manual key management: SSH keys.
It uses single sign-on (SSO) technologies like
[OpenID Connect](https://openid.net/connect/) (OIDC) to authenticate a user


### Configure the server

```sh
wget -qO- "https://raw.githubusercontent.com/openpubkey/opkssh/main/scripts/install-linux.sh" | sudo bash
#               user   identity          provider
sudo opkssh add datosh fabian@kammel.dev google
```


### Configure the client

```sh
curl -LO https://github.com/openpubkey/opkssh/releases/download/v0.4.0/opkssh-linux-amd64
sudo install opkssh-linux-amd64 /usr/local/bin/opkssh
opkssh login
```

The beauty of this is that no new SSH client is required.


### Open Question

Can I use this to SSH push to a git repository?
