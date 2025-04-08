---
title: "Kubernetes Home Lab in 2025: Part 6 - Identity & Access Management"
date: 2025-04-09
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_06.png"
Tags: ["k8s", "home lab", "kubernetes", "iam", "oidc", "ldap", "kanidm"]
Draft: false
---

A good Identity and Access Management (IAM) system is often
overlooked in smaller environments and homelabs. Why is that?

We know that most enterprise use them, and for good reasons! They provide
a central user directory to efficiently handle on-/offboarding of both human
and technical users, make logging in and out of services easy, and granting
permissions painless. Yeah right... let me know if you find one of these magical places 😅

These systems are usually based on
[Lightweight Directory Access Protocol (LDAP)](https://ldap.com/)
or
[Active Directory (AD)](https://en.wikipedia.org/wiki/Active_Directory),
and integrate services using [Security Assertion Markup Language (SAML)](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language).
Popular implementations (that we can actually self-host) are:
+ [dex](https://github.com/dexidp/dex), which only proxies the authentication to other providers like GitHub, Google, etc.
+ [Keycloak](https://www.keycloak.org/), no one should go through the pain of setting this up in 2025
+ [Rauthy](https://sebadob.github.io/rauthy/intro.html)
+ [kandim](https://kanidm.github.io/kanidm/stable/introduction_to_kanidm.html)

In this post, we will explore kanidm! We deploy and configure it in our Kubernetes
homelab, and then integrate Kubernetes itself using OIDC, for an actually easy
and painless single sign-on experience for our cluster users.

## Installation

There are a few things to consider when installing kanidm. Let's step through
them one by one.

### Domain Name

Kandim will be a very powerful service in our network, managing access to every
other services and system. So we need to make sure that the connection to it is
secure, otherwise authenticatation tokens could be jeopardized.

Kanidm provides great guidance on this, and help us to
[choose a (secure) domain name](https://kanidm.github.io/kanidm/stable/choosing_a_domain_name.html)
for our kanidm server.

They recommend one of two approaches:
1. For **maximum** security a dedicated domain that only hosts the kanidm server.
For me this would be something like `sso.kammel-auth.dev` and would enable us to
setup strict security policies around the dedicated domain.
1. The second option is to use a direct subdomain, e.g., `sso.kammel.dev`.

Since I am the only person with admin access to the domain, and I don't feel like
buying a second domain: Let's go with option 2!

### TLS Connection

Next we need a direct TLS connection between clients and the kanidm server.
This is a
[strict requirement for kanidm](https://kanidm.github.io/kanidm/stable/preparing_for_your_deployment.html#tls),
it does not provide any developer mode or even allows insecure HTTP configuration
(not even if you pinky swear not to use it in production).

By default, any TLS connection would be terminated at our nginx ingress
controller. Luickly, there exists the
[backend-protocol](https://github.com/kubernetes/ingress-nginx/blob/main/docs/user-guide/nginx-configuration/annotations.md#backend-protocol)
annotation, which allows us to configure the ingress controller to
pass the TLS connection through to the kanidm pod. So all the magic we need is
a single annotation:

```yaml
nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
```

### Helm Chart

The biggest hurdle right at the start: There is no official helm chart
available. Luckily, one of the
[kanidm maintainers](https://github.com/yaleman), created an
[example K8s deployment](https://github.com/yaleman/kanidm-k8s/tree/main)
which I have converted into a
[Helm chart](https://github.com/datosh/kanidm), so we are rolling with that.

{{< info note >}}
The Helm chart is pretty early stages, so I am happy to accept
[issues](https://github.com/datosh/kanidm/issues) and PRs alike!
{{< /info >}}


### Deployment

Finally we need our usual trio of K8s `namespace`, `HelmRepository` and
`HelmRelease` to deploy the kanidm server.

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: kanidm
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: kanidm
  namespace: kanidm
spec:
  interval: 1h
  url: https://datosh.github.io/kanidm/
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: kanidm
  namespace: kanidm
spec:
  interval: 1h
  chart:
    spec:
      chart: kanidm
      version: "0.1.2"
      sourceRef:
        kind: HelmRepository
        name: kanidm
        namespace: kanidm
  values:
    domain: sso.kammel.dev
    ingress:
      className: nginx
      clusterIssuer: letsencrypt-prod
      tlsSecretName: idm-kammel-dev-tls
```

Ensure that:
1. The `domain` matches your chosen domain name
1. `ingress.className` references the ingress class we set up in [Part 3](../k8s_home_lab_2025_03/)
1. `ingress.clusterIssuer` references the cluster issuer we set up in [Part 4](../k8s_home_lab_2025_04/)

## Configuration

After the deployment is finished, we can access the kanidm web interface
at `https://sso.kammel.dev`.

{{< figure
    src="kanidm_hello.png"
    alt="Default kanidm web interface"
    caption="Default kanidm web interface"
>}}

### Default Admin Accounts

Now that we know the server is running, we need to
[initialize the two default admin accounts](https://kanidm.github.io/kanidm/stable/server_configuration.html#default-admin-accounts).

`admin` is used to manage the kanidm configuration and `idm_admin` is used
to manage accounts and groups. These two accounts should be considered
"break-glass" accounts, i.e., we only use them to setup our personal user,
grant them enough access, and then lock them away.

Let's exec into the kanidm pod and run the following commands:

```bash
kanidmd recover-account admin
kanidmd recover-account idm_admin
```

This will print the password for both accounts to the console.

### Client Tools

To interact with the kanidm server, we need to
[install the client tools](https://kanidm.github.io/kanidm/stable/installing_client_tools.html).
The client tools are available for most package managers, a container or
build straight from Rust source. Which is actually what I did:

```console
$ sudo apt-get install libudev-dev libssl-dev libsystemd-dev pkg-config libpam0g-dev
$ cargo install kanidm_tools
$ kanidm version
kanidm 1.5.0
```

### Create Personal User

First let's login as the `idm_admin` user:

```console
$ export KANIDM_URL=https://sso.kammel.dev
$ export KANIDM_name=idm_admin
$ kanidm login
Enter password: [hidden]
Login Success for idm_admin@sso.kammel.dev
```

Now we can create our personal user account. This is the account we will use
to get access to the cluster and other services, or login to the kanidm web
interface for self-service account management.

```console
$ kanidm person create datosh "Fabian Kammel"
Successfully created display_name="Fabian Kammel" username=datosh
$ kanidm person update datosh --mail "fabian@kammel.dev"
Success
$ kanidm person get datosh
...
directmemberof: idm_all_persons@sso.kammel.dev
displayname: Fabian Kammel
mail: fabian@kammel.dev
...
name: datosh
spn: datosh@sso.kammel.dev
uuid: 7b89b6ea-1e8b-4aa8-98fb-a70cba498d16
```

Finally we need to create a reset token to finalize our account creation

```console
$ kanidm person credential create-reset-token datosh
The person can use one of the following to allow the credential reset

Scan this QR Code:

█████████████████████████████████████████
█████████████████████████████████████████
████ ▄▄▄▄▄ █ ▄▄▄█▄▀█ ▀▀▄▄▀█ ▀█ ▄▄▄▄▄ ████
████ █   █ █▀▀▄█▀▄█ ▄▀█▄ █  ██ █   █ ████
████ █▄▄▄█ ██ ▄▄█▀ ▄▄ ▀▀██▀▄ █ █▄▄▄█ ████
████▄▄▄▄▄▄▄█ █ █ █▄▀▄▀▄█ █ ▀ █▄▄▄▄▄▄▄████
████▄▀▄ █▄▄ █ ▀▄█▀ █▀▄▀▀▀ █ ██ ▀█ ▀▄ ████
████▀▀▄ █▄▄ ▄██▄▀▄██▄▄▀▀ █  ▀█▀ ▄ █ ▄████
████ █▀▀ ▄▄ ██ ▄ ▀ ▄ ▄█▀▄▀▄▄▄ ▀ ▄▄▀ █████
████ ▄▀▀█▄▄▄█▄▄ ▀▄▄ █▄▄ ▄▀▀▀▀▀ ▄   ██████
█████▄▄ ▀█▄▀▄▀ ▄▄ ▀▀██ █   ▀█▄ █  ▄█▀████
████▀█ ▄ ▀▄▀▄▀ ▀█   █ █▀██▀█▀ █▄ █▄ █████
████  ▀▀▀ ▄▄▄▄▀▀█ ██▀▄▀█ ▄▀ █▀▀ █▄▄█ ████
█████▀▄ ██▄▄█ █▀▄███ ▄ ▀▀█▄ ██ ▀▄▀▄▄ ████
████▄██▄█▄▄▄ ▄██ █▀   █ ▀█▄▀ ▄▄▄ ▀█ █████
████ ▄▄▄▄▄ █ ███▄▀▄█▀█▀▄▀▀▀  █▄█ ▀▀▄█████
████ █   █ █▀▀▀▄█▀▀▄█▀▀▄▄▄   ▄▄ ▄▀▄▄ ████
████ █▄▄▄█ █▄█  █ ▄  ▀ █ ▄ ▀▄▄▄ ▀▄▄█▀████
████▄▄▄▄▄▄▄█▄▄▄▄▄▄██▄▄█▄█▄█▄█▄▄█▄█▄██████
█████████████████████████████████████████
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

This link: https://sso.kammel.dev/ui/reset?token=kWzBj-Zdkua-SxTaf-CKARR
Or run this command: kanidm person credential use-reset-token kWzBj-Zdkua-SxTaf-CKARR
This token will expire at: 2025-04-08T22:41:46+02:00
```

Following the link will take us to the kanidm web interface:

{{< figure
    src="kanidm_update_credentials.png"
    alt="Update credentials"
    caption="Update credentials"
>}}

Where we can **add our passkey**! Hello 2025!

{{< figure
    src="kanidm_yubikey.png"
    alt="Set Yubikey"
    caption="Set Yubikey"
>}}

Once we set the passkey and **saved the changes** we can log in with our passkey:

{{< figure
    src="kanidm_login.gif"
    alt="Set Yubikey"
    caption="Set Yubikey"
>}}

## Kubernetes Integration
