---
title: "Kubernetes Home Lab in 2025: Part 2 - Automated Dependency Updates"
date: 2025-02-19
Description: ""
thumbnail: "images/thumbnails/k8s_home_lab_2025_02.png"
Tags: ["k8s", "home lab", "kubernetes", "renovate", "flux", "helm", "GitHub"]
Draft: false
---

[Last time](/post/k8s_home_lab_2025_01/), we set up Cilium and Flux to enable
networking and GitOps for our Kubernetes cluster. In this post, we will add
automated dependency updates to it.

## Dependency Management

Notice, in our Cilium configuration, we referenced the desired version of the
Cilium Helm chart using a specific tag.

```yaml
sourceRef:
    kind: HelmRepository
    name: cilium
version: 1.16.5
```

Many ecosystems allow you to express version constraints, relying on some
sort of structured versioning schema, such as [semantic versioning](https://semver.org/).
For example, `npm`
[supports](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#dependencies)
`~1.2.3` to allow patch updates, i.e., all updates `<1.3.0`, or even `^1.2.3` to
allow minor updates, i.e., all updates `<2.0.0`.

This seems like a great quality-of-life improvement, until you debug one issue,
then realize a simultaneous dependency update introduced a regression.
Therefore, **always pin your dependencies to a specific version and introduce
upgrades intentionally**. This is not only true for
[reproducible builds](https://reproducible-builds.org/),
but also for our infrastructure configuration.

### Tangent: Branches, Tags and Commit Hashes

Everyone knows that a branch name is a mutable reference, meaning its content
changes as the branch is updated. The contract is pretty clear: the branch is
expected to change over time, but I get the updates as soon as they are available.

**A lesser known fact is that a tag is also a mutable reference.** The maintainer
of a repository (or a malicious attacker) can delete a tag and create a new one
with the same name, effectively changing the content of the release. This mechanism
is used a lot in the
[GitHub Actions](https://docs.github.com/en/actions)
ecosystem to enable automatic patch and minor version upgrades, e.g., implemented in the
[checkout action](https://github.com/actions/checkout/blob/v4/.github/workflows/update-main-version.yml).

The only way to avoid this is to reference a specific commit or content hash, a
true immutable reference. This guarantees that the content will always be the
same, even if the tag is deleted. Sadly, this is not fully supported in all ecosystems.
An [open issue](https://github.com/fluxcd/image-automation-controller/issues/165)
exists in the Flux project to support this, so we have to make do using tags.

## Renovate

So stability is great, but I'm not a fan of creating daily pull requests to
update dependencies. Thankfully, lots of folks agree and wrote tools that can help
us with this.

One such tool is [Renovate](https://github.com/renovatebot/renovate). It
automatically creates pull requests to update the dependencies of a project, and
supports a lot of different package managers. Actually, over nine thousa...,
okay [over ninety](https://docs.renovatebot.com/modules/manager/), still impressive!
Including
[Flux](https://docs.renovatebot.com/modules/manager/flux/) and
[Helm](https://docs.renovatebot.com/modules/manager/helm-values/).

### Installation

Renovate is available as a
[GitHub App](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps)
and can be [installed directly from the GitHub UI](https://github.com/apps/renovate).

After hitting the install button, we need to allow Renovate access to the
repositories we want to receive updates for:

{{< figure
    src="add_home_repo.png"
    alt="Renovate repository access."
    caption="Renovate repository access."
    width="75%"
>}}

### Configuration

Renovate is configured using a `renovate.json` file, checked into the same repository.
Let's take a look at the configuration:

```json
{
    "$schema": "https://docs.renovatebot.com/renovate-schema.json",
    "extends": [
      "config:base",
      ":preserveSemverRanges"
    ],
    "addLabels": [
      "dependencies"
    ],
    "includePaths": [
      "k8s/flux/**"
    ],
    "packageRules": [
      {
        "description": "Automerge patch and minor updates for Helm charts",
        "matchDatasources": ["helm"],
        "groupName": "helm-charts"
      }
    ]
  }
```

[Extends](https://docs.renovatebot.com/config-presets/) enables us to build a
configuration by adopting shared config presets. We also add the `dependencies`
label to all pull requests, to make it easier to find them. We restrict Renovate
to only update dependencies in the `k8s/flux` directory, since I have a lot of
other stuff in the same repository. Lastly, we group all Helm chart updates
together, to reduce the number of pull requests we have to review.

{{< info note >}}
In case Renovate ever fails, e.g., due to a broken configuration, check out
the [developer dashboard](https://developer.mend.io/) for more details. It
includes logs for each backend invocation of Renovate.
{{< /info >}}

### Dashboard

Once configured, Renovate will create a dashboard using a persistent GitHub
issue to track the status of all discovered dependencies and their updates.

{{< figure
    src="dependency_dashboard.png"
    alt="Renovate dashboard."
    caption="Renovate dashboard."
    width="75%"
>}}

Finally, as projects are updated, Renovate will create pull requests to update
the dependencies.

{{< figure
    src="cilium_update.png"
    alt="Renovate pull request."
    caption="Renovate pull request."
    width="75%"
>}}

Once the pull request is merged, Flux will automatically update the dependencies
in the cluster.

```console
$ flux get helmreleases -n kube-system --watch
NAME    REVISION  READY   MESSAGE
cilium  1.16.5    True    Helm upgrade succeeded for release kube-system/cilium.v2 with chart cilium@1.16.5
cilium  1.16.5    False   HelmChart 'kube-system/kube-system-cilium' is not ready: latest generation of object has not been reconciled
cilium  1.16.5    Unknown Running 'upgrade' action with timeout of 5m0s
cilium  1.17.1    True    Helm upgrade succeeded for release kube-system/cilium.v3 with chart cilium@1.17.1
```

## Conclusion

In this post, we added automated dependency updates to our Kubernetes home lab.
We use Renovate to automate pull requests to update the dependencies of our projects,
and Flux to apply the changes to our cluster.

In the next post, we will deploy a Kubernetes Ingress Controller, to enable
external access to our applications.
