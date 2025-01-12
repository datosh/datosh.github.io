---
title: "Kubernetes Home Lab in 2025: Part 1 - Ingress"
date: 2025-01-11
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_01.png"
Tags: ["k8s", "home lab", "kubernetes", "ingress"]
Draft: true
---

First things first, we need to get traffic into our cluster.

The options we have are:
+ [Node Ports](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)
    are built into K8s, but ugly for end-users as they run on non-default high port numbers
+ [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
    enable us to route HTTP(s) traffic based on the request's host and path
+ [Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/)
    is the new way to make network services available by using an extensible,
    role-oriented, protocol-aware configuration mechanism

Even though Gateway is the most powerful option, we will start with an Ingress
based solution, as we only require basic HTTP(s) routing, for now.

Let's get started! (or skip to the [TL;DR](#tldr) for the full deployment commands)

## K8s Ingress

As with many features in the Kubernetes ecosystem, Ingress consists of two parts:

1. The **Ingress resource**, which is an abstraction that describes a collection
    of rules for routing external HTTP(s) traffic to internal services.
1. The **Ingress controller**, which is the actual implementation that watches
    for new or changed **Ingress resources** and dynamically updates the configuration
    of a network proxy.

K8s maintans a list of available
[ingress controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers).

## ingress-nginx

We will go with the nginx based solution, maintained by the k8s project.

{{< notice warning >}}
Both, [ingress-nginx](https://kubernetes.github.io/ingress-nginx/) and [nginx ingress](https://docs.nginx.com/nginx-ingress-controller/) exist as different projects. We are using the former!
{{< /notice >}}

### Installation

Let's follow the offical [quick start](https://kubernetes.github.io/ingress-nginx/deploy/#quick-start),
and see where it takes us.

```bash
helm upgrade --install \
    ingress-nginx ingress-nginx \
    --repo https://kubernetes.github.io/ingress-nginx \
    --namespace ingress-nginx --create-namespace
```

We should see the pods coming up in the `ingress-nginx` namespace:

```bash
kubectl get pods --namespace=ingress-nginx
```

Next, we will do a quick sanity check to see the controller is working:

```bash
kubectl create deployment demo --image=httpd --port=80
kubectl expose deployment demo
kubectl create ingress demo-localhost --class=nginx \
  --rule="demo.localdev.me/*=demo:80"
kubectl port-forward --namespace=ingress-nginx \
    service/ingress-nginx-controller 8080:80
```

Simply visiting [http://demo.localdev.me:8080](http://demo.localdev.me:8080)
in your browser, will do nothing, as you probably don't happen to have that
particular DNS record configured. Let's use curl instead:

```bash
curl --resolve demo.localdev.me:8080:127.0.0.1 http://demo.localdev.me:8080
```

Cool, we have a working ingress controller! Still this is not very useful, as
we want **external traffic** to hit our services.

### Exposing the Ingress Controller

So without the port forward - where do we direct our traffic to? Let's check
the resources created by the helm chart:

```console
$ kubectl get svc --field-selector spec.type=LoadBalancer -n ingress-nginx

NAME                       TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller   LoadBalancer   10.101.171.70   <pending>     80:32621/TCP,443:30097/TCP   1h
```

In a cloud environment, the `EXTERNAL-IP` would be populated with the public IP of
a load balancer, assigned by the cloud provider. So who provides this IP in a
bare metal setup?

## MetalLB

Kubernetes does not offer an implementation of network load balancers for
bare-metal clusters. Luckily, we can deploy our own!

MetalLB is a load-balancer implementation for bare metal Kubernetes clusters,
using standard routing protocols, and consists of
[two components](https://metallb.universe.tf/troubleshooting/#components-responsibility):

+ The **controller** is in charge of assigning IPs to the services
+ The **speakers** are in charge of announcing the services via layer 2 or BGP

We will make use of the layer 2 mode, as it is the simplest to set up.
Keep in mind though, in layer 2 mode,
[all traffic for a service IP goes to one node](https://metallb.universe.tf/concepts/layer2/#load-balancing-behavior), and kube-proxy spreads the traffic to the respective
service's pods. This means the total throughput is limited to the bandwidth of
the node that receives the traffic! As we only have a single node, this is not
a big deal right now.

### Installation



## Conclusion

Resources:
+ [The Kubernetes Networking Guide](https://www.tkng.io)
+ [Bare Metal K8s Guide](https://www.bsmithio.com/post/baremetal-k8s/)

## TL;DR

Reserve the following IP range in your DHCP server `192.168.1.8-192.168.1.10`,
and run the following:

```bash
TODO: deployment
```

If you want to test this setup point a DNS record, in our case `k8s.kammel.dev`,
to `192.168.1.8` and run:

```bash
TODO: deploy test app

curl -kivL -H 'Host: k8s.kammel.dev' 'https://192.168.1.8'
```
