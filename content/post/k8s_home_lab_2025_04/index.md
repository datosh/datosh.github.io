---
title: "Kubernetes Home Lab in 2025: Part 4 - Cert-Manager"
date: 2025-03-05
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_04.png"
Tags: ["k8s", "home lab", "kubernetes", "ingress"]
Draft: true
---

[Last time](/post/k8s_home_lab_2025_03/),
we added ingress-nginx to our cluster, so that external traffic can
hit our services. In this post, we will secure that traffic using TLS.

Since I am using a `*.dev` domain, it comes with the blessing (or curse?)
of having [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security)
preloaded in
[most modern browsers](https://caniuse.com/stricttransportsecurity),
but even without that enforcement we want to protect all communication using TLS.
There is no reason not to do it in 2025. It's free, it's easy, and it's fully automated.

## HTTP Strict Transport Security (HSTS)

HSTS is a security feature that tells browsers to only access your site using HTTPS.
[This mechanism works by sites sending a `Strict-Transport-Security` HTTP response header containing the site's policy](https://hstspreload.org/).
In addition, Chrome maintains a list of domains for which HSTS is enforced.
This means even before the initial response containing the `Strict-Transport-Security`
header is sent, the browser will redirect to the HTTPS version of the site.

Some top level domains (TLDs), such as
[.dev](https://security.googleblog.com/2017/09/broadening-hsts-to-secure-more-of-web.html),
went one step further and added the full TLD to the HSTS preload list, therefore
requiring everyone to use HTTPS when purchasing one of these domains.

{{< info note >}}
This feature is only supported in browsers, i.e., if you are using curl or your
favorite networking library you are still required to properly enforce security
settings.
{{< /info >}}

## Let's Encrypt

Let's Encrypt is a free, automated, and open certificate authority (CA).

So how do we automate this process in Kubernetes?

## Cert-Manager

Cert-Manager is a tool that automatically manages TLS certificates for your cluster.

Let's hook it up to cloudflare!

## Cloudflare

### Cloudflare - Create API Token

In order to create the required API token, login to your Cloudflare account and
follow these steps:

1. Access the **Account API Tokens** page
    ![](cloudflare_account_api_tokens.png)

2. Click on **Create Token**

3. Scroll to the bottom and create a **Custom Token**

4. For permissions, select the following:
    + Zone - DNS - Edit
    + Zone - Zone - Read

    For zone resources, select the zone you want to manage.

    ![](./cloudflare_custom_token.png)

5. Click on **Continue to Summary** and then **Create Token**

## Deployment


## Testing

## Conclusion
