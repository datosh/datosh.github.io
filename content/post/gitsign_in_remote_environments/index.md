---
title: "Gitsign in Remote Environments"
date: 2022-11-02
Description: ""
thumbnail: "images/thumbnails/gitsign_in_remote_environments.png"
Tags: ["git", "gitsign", "supply-chain-security", "OIDC", "sigstore"]
toc: false
---

After attending SigstoreCon, I got inspired by
[Priya Wadhwa's Keynote: Signing Git Commits with Gitsign](https://www.youtube.com/watch?v=2c70PIFynBg),
to finally set up [gitsign](https://github.com/sigstore/gitsign) for my dev environment. It seemed straightforward enough, right?

### Following the instructions

I am mostly working with [VSCode](https://code.visualstudio.com/) using their amazing [SSH remote extension](https://code.visualstudio.com/docs/remote/ssh). After following Priya's configuration example, the browser opened on my local machine, but the OIDC redirect flow failed and I got greeted with:

{{< figure src="connection_refused.webp" title="Chrome: connection refused." >}}

This makes sense! The browser has no connection to my remote machines to complete the OIDC flow.

Two configurations were necessary to solve this problem:

### Create a static redirect URL
By default, gitsign will use a random port to create the redirect URL. Compare the callback generated for two subsequent calls to gitsign:

+ `http://localhost:39807/auth/callback?code=…`
+ `http://localhost:34275/auth/callback?code=…`

We can force the usage of a static port by setting the redirectURL config parameter:

```sh
git config --local gitsign.redirectURL http://localhost:39807/auth/callback
```

### Create a route from your browser to the remote host

This heavily depends on your setup and where your remote machine is located.

One of my environments uses Virtual Box and there is [build-in support to create NAT port forwarding rules](https://www.virtualbox.org/manual/UserManual.html#natforward).

When working with cloud machines you could use SSH tunnels to create a route.

### Final git config

```ini
commit.gpgsign=true
tag.gpgsign=true
gpg.x509.program=gitsign
gpg.format=x509
gitsign.redirecturl=http://localhost:39807/auth/callback
gitsign.connectorid=https://github.com/login/oauth
```

To shave off another second of the OIDC process I also included the correct `connectorid`, so I do not have to select which OIDC provider to use.

Originally published on [Medium](https://medium.com/@datosh18/gitsign-in-remote-environments-6f40f47d289f).
