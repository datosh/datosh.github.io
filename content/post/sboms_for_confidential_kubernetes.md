---
title: "Generating SBOMs for Confidential Kubernetes is easier than you think!"
date: 2022-10-03
Description: ""
thumbnail: "images/thumbnails/sboms_for_confidential_kubernetes.png"
Tags: [Software Bill Of Material, Confidential Computing, Confidential Kubernetes, SBOM]
toc: false
---

Constellation is an infrastructure product and includes several different components:

- A command-line interface (CLI) manages the life-cycle of the Confidential Kubernetes cluster
- In-cluster services provide features such as key management and secure node administration
- A node operator handles upgrades of cluster nodes

**All of these components could include a dependency with known vulnerabilities!**

How do we get the full picture to keep track of all our dependencies?

### Software Bill of Materials

An SBOM comprises a list of all dependencies for a given software artifact in a standard data format, such as [SPDX](https://spdx.dev/) or [CycloneDX](https://cyclonedx.org/). For more background on SBOMs see [NTIA](https://www.ntia.gov/page/software-bill-materials)'s overview.

Last year, many companies scrambled to determine, whether software they were running in production was [vulnerable to Log4Shell](https://en.wikipedia.org/wiki/Log4Shell). **SBOMs allow organizations to answer these questions easily!**

### Generating SBOMs

[Syft](https://github.com/anchore/syft) allows us to generate an SBOM for several different types of artifacts, using so-called [catalogers](https://github.com/anchore/syft#supported-sources). Supported ecosystems include OS level package managers, programming language build systems, container images, and file systems.

#### Go Modules

Go already keeps track of its dependencies via the [go.mod and go.sum](https://go.dev/ref/mod#go-mod-file) files. Running Syft from our go module’s root directory will produce an SBOM based on these files!

```sh
syft --catalogers go-mod-file --file constellation.spdx.sbom -o spdx-json .
```

#### Container Images

Syft is also able to scan images from container registries. Instead of passing a local file system path, we simply provide the image reference and an SBOM for our container will be generated.

Having minimal container images based on [scratch](https://github.com/edgelesssys/constellation/blob/130c61ffcfcecd7ddfc3d38e8aa5996d833f0d5d/access_manager/Dockerfile#L29) or [distroless](https://github.com/edgelesssys/constellation/blob/130c61ffcfcecd7ddfc3d38e8aa5996d833f0d5d/operators/constellation-node-operator/Dockerfile#L23) helps to keep the attack surface low!

```sh
CONTAINER_VERSION=v2.0.0
syft ghcr.io/edgelesssys/constellation/verification-service:${CONTAINER_VERSION} --file verification-service.spdx.sbom -o spdx-json
syft ghcr.io/edgelesssys/constellation/access-manager:${CONTAINER_VERSION} --file access-manager.spdx.sbom -o spdx-json
syft ghcr.io/edgelesssys/constellation/join-service:${CONTAINER_VERSION} --file join-service.spdx.sbom -o spdx-json
syft ghcr.io/edgelesssys/constellation/kmsserver:${CONTAINER_VERSION} --file kmsserver.spdx.sbom -o spdx-json
syft ghcr.io/edgelesssys/constellation/node-operator:${CONTAINER_VERSION} --file node-operator.spdx.sbom -o spdx-json
```

There is [(experimental) support in docker CLI](https://docs.docker.com/scout/how-tos/view-create-sboms/) to generate an SBOM, which also uses Syft under the hood!

### Conclusion

Syft helped us to easily and continuously generate SBOMs for [our releases](https://github.com/edgelesssys/constellation/releases).

Customers can be assured that they have the full picture of what is included in our product and can import our SBOMs to solutions such as [Dependency Track](https://dependencytrack.org/) or [BlackDuck](https://www.blackduck.com/) to stay on top of vulnerabilities and upgrade Constellation to receive the latest mitigations in time!

Originally published on [Medium](https://medium.com/@datosh18/generating-sboms-for-confidential-kubernetes-is-easier-than-you-think-296bb5a55610)
