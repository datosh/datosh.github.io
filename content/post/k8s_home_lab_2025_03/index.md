---
title: "Kubernetes Home Lab in 2025: Part 3 - Ingress"
date: 2025-02-26
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_03.png"
Tags: ["k8s", "home lab", "kubernetes", "ingress"]
Draft: false
---

[Last time](/post/k8s_home_lab_2025_02/), we added automated dependency updates
to our cluster. In this post, we will get traffic into our cluster, by setting
up an Ingress controller and a load balancer.

## Networking Options

To get traffic into our cluster, we can pick from a few options:
+ [Node Ports](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)
    are built into K8s, but annoying for end-users as they run on high port numbers
+ [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
    enables us to route HTTP traffic based on the request's host and path
+ [Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/)
    is the new way to make network services available by using an extensible,
    role-oriented, protocol-aware configuration mechanism

Even though Gateway is the most powerful option, we will start with an
Ingress-based solution, as we only require basic HTTP routing for now.

## K8s Ingress

As with many features in the Kubernetes ecosystem, Ingress consists of two parts:

1. The **Ingress resource**, which is an abstraction that describes a collection
    of rules for routing external HTTP traffic to internal services. You can
    think of it as a snippet of our proxy configuration.
1. The **Ingress controller**, which is the actual routing implementation. It watches
    for new or changed **Ingress resources** and dynamically updates its own
    routing configuration.

K8s maintains a list of available
[Ingress controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers).

### ingress-nginx

We will go with the nginx-based solution, which is maintained by the k8s project.

{{< info warn >}}
Both [ingress-nginx](https://kubernetes.github.io/ingress-nginx/) and
[nginx ingress](https://docs.nginx.com/nginx-ingress-controller/) exist as
**different projects**. We are using the former!
{{< /info >}}

## Installation

Let's follow the official [quick start](https://kubernetes.github.io/ingress-nginx/deploy/#quick-start),
and see where it takes us.

It asks us to install the ingress-nginx helm chart. Just like last time, we can
manually write out or use `flux create` to generate the required definitions:

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: ingress-nginx
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
spec:
  interval: 5m0s
  url: https://kubernetes.github.io/ingress-nginx
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
spec:
  chart:
    spec:
      chart: ingress-nginx
      reconcileStrategy: ChartVersion
      sourceRef:
        kind: HelmRepository
        name: ingress-nginx
      version: 4.12.0
  interval: 5m0s
```

Once committed and pushed, we see that resources appear in the `ingress-nginx` namespace:

```console
$ kubectl get all -n ingress-nginx
NAME                                           READY   STATUS    RESTARTS   AGE
pod/ingress-nginx-controller-cd9d6bbd7-n2rgb   1/1     Running   0          19m

NAME                                         TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
service/ingress-nginx-controller             LoadBalancer   10.111.36.214    <pending>     80:30795/TCP,443:30240/TCP   19m
service/ingress-nginx-controller-admission   ClusterIP      10.106.207.160   <none>        443/TCP                      19m

NAME                                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/ingress-nginx-controller   1/1     1            1           19m

NAME                                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/ingress-nginx-controller-cd9d6bbd7   1         1         1       19m
```

We see that the pod is running fine, but the service for `ingress-nginx-controller`
still shows `<pending>` for the `EXTERNAL-IP`. In a cloud environment, the
`EXTERNAL-IP` would be populated with the public IP of a load balancer,
assigned by the cloud provider.

So who provides this IP in our home lab?

## MetalLB

Kubernetes does not offer an implementation of network load balancers for
bare-metal clusters. Luckily, the community rose to the occasion!

MetalLB is a load-balancer implementation for bare metal Kubernetes clusters,
using standard routing protocols, and consists of
[two components](https://metallb.universe.tf/troubleshooting/#components-responsibility):

+ The **controller** is in charge of assigning IPs to the services
+ The **speakers** are in charge of announcing the services via layer 2 or BGP

We will make use of the layer 2 mode, as it is the simplest to set up.
Keep in mind though, in layer 2 mode,
[all traffic for a service IP goes to one node](https://metallb.universe.tf/concepts/layer2/#load-balancing-behavior),
and kube-proxy spreads the traffic to the respective
service's pods. This means the total throughput is limited to the bandwidth of
the node that receives the traffic! As we only have a single node, this is not
a big deal right now.

### Installation

Again, the [quick start](https://metallb.universe.tf/installation/#installation-with-helm)
asks us to install the metallb helm chart, so we create the corresponding Flux
definitions:

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: metallb
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: metallb
  namespace: metallb
spec:
  interval: 5m0s
  url: https://metallb.github.io/metallb
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: metallb
  namespace: metallb
spec:
  chart:
    spec:
      chart: metallb
      reconcileStrategy: ChartVersion
      sourceRef:
        kind: HelmRepository
        name: metallb
      version: 0.14.9
  interval: 5m0s
  values:
    controller:
      logLevel: info
    speaker:
      logLevel: info
```

Once committed and pushed, we see the metallb controller and speakers are running:

```console
$ kubectl get pods -n metallb
NAME                                  READY   STATUS    RESTARTS   AGE
metallb-controller-8474b54bc4-gh78x   1/1     Running   0          56s
metallb-speaker-fz75d                 4/4     Running   0          56s
metallb-speaker-ghgp5                 4/4     Running   0          56s
```

As the documentation points out,
[MetalLB remains idle until configured](https://metallb.universe.tf/configuration/),
so we need to tell MetalLB which IP addresses it is allowed to assign. Let's
add the required definitions to our repository:

```yaml
---
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: first-pool
  namespace: metallb
spec:
  addresses:
  - 192.168.1.18-192.168.1.19
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: advert
  namespace: metallb
spec:
  ipAddressPools:
  - first-pool
```

{{< info "note" >}}
Make sure to reserve the IP range in your DHCP server, so it does not assign
the same IPs to other devices on your network!
{{< /info >}}

Once we apply these configurations, MetalLB assigns an external IP to our pending
load balancer service:

```console
$ kubectl get svc -n ingress-nginx
NAME                                 TYPE           CLUSTER-IP       EXTERNAL-IP    PORT(S)                      AGE
ingress-nginx-controller             LoadBalancer   10.111.36.214    192.168.1.18   80:30795/TCP,443:30240/TCP   33m
ingress-nginx-controller-admission   ClusterIP      10.106.207.160   <none>         443/TCP                      33m
```

## Verifying the Setup

Even though everything looks in order, it doesn't hurt to double check everything
is working as expected. Let's add the following resources to our git repository,
for a quick sanity check:

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: ingress-test
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kuard
  namespace: ingress-test
spec:
  selector:
    matchLabels:
      app: kuard
  replicas: 1
  template:
    metadata:
      labels:
        app: kuard
    spec:
      containers:
      - image: gcr.io/kuar-demo/kuard-amd64:1
        imagePullPolicy: Always
        name: kuard
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: 100m
            memory: 100Mi
          requests:
            cpu: 100m
            memory: 100Mi
---
apiVersion: v1
kind: Service
metadata:
  name: kuard
  namespace: ingress-test
spec:
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  selector:
    app: kuard
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kuard
  namespace: ingress-test
spec:
  ingressClassName: nginx
  rules:
  - host: test.kammel.dev
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kuard
            port:
              number: 80
```

Simply visiting [http://test.kammel.dev](http://test.kammel.dev)
in your browser will do nothing, as you probably don't happen to have that
particular DNS record configured. Let's use `curl` instead, so we can mock the
DNS resolution:

```console
$ curl -H 'Host: test.kammel.dev' 'http://192.168.1.18'
<!doctype html>

<html lang="en">
<head>
...
```

{{< info "note" >}}
Ensure you replace `192.168.1.18` with the external IP address assigned to the
load balancer service used by ingress-nginx.
{{< /info >}}

Cool, we have a working Ingress controller!

## Conclusion

This part implements just one way to set up an Ingress controller and a Load Balancer
for a home lab environment. There are many other options available, and both the
[metal considerations](https://kubernetes.github.io/ingress-nginx/deploy/baremetal/#using-a-self-provisioned-edge)
in the ingress-nginx docs, as well as the
[Kubernetes Networking Guide](https://www.tkng.io) are worth a read!

Also, a big shoutout to
[Brendan Smith's](https://www.bsmithio.com/post/baremetal-k8s/) guide, which
I used as an introduction to this topic!

Next time, we will add automatic TLS certificates to our setup and graduate our
test app to HTTPS.
