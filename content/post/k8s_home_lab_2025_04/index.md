---
title: "Kubernetes Home Lab in 2025: Part 4 - Cert-Manager"
date: 2025-03-05
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_04.png"
Tags: ["k8s", "home lab", "kubernetes", "ingress"]
Draft: true
---

Having a `*.dev` domain comes with the blessing (or curse?) of having
HSTS preloaded in most modern browsers. This means that you can't just
create a self-signed certificate and expect it to work. You need a valid
certificate from a trusted CA.

https://security.googleblog.com/2017/09/broadening-hsts-to-secure-more-of-web.html



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
