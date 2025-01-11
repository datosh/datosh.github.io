---
title: "Bringing first-class support to SBOMs and attestations for Constellation containers"
date: 2022-10-27
Description: ""
thumbnail: "images/thumbnails/ComfyUI_00242_.png"
Tags: ["SBOM", "Software Bill Of Material", "Confidential Computing", "Constellation", "Sigstore"]
toc: false
---

In a [previous post](https://datosh.github.io/post/sboms_for_confidential_kubernetes/), we explored how to generate a Software Bill of Materials (SBOM) and subsequently [scan them for vulnerabilities](https://datosh.github.io/post/zero_vulnerability_posture/). In this post, we show you how SBOMs can be signed and then stored in the same container registry as the scanned image. This improves security & discoverability!

### Why should I sign my SBOM?

Up until now, our generated SBOM is a plain JSON file with some metadata and a list of dependencies. This leaves lots of room for malicious actors to manipulate our SBOM before it gets to our users.

How could a malicious actor benefit?

1. They could inject additional (outdated) dependencies into the SBOM, to claim the software is vulnerable and damage the reputation of a vendor.
1. They could remove dependencies from the SBOM, to destroy the transparency SBOMs enable in the first place. This would prevent a user from patching an existing vulnerability because the critical information is missing.

Signing our SBOMs enables end users to trust the dependency information we publish and make sure it has not been tampered with!

### What is an attestation?

On the other side, the consumer needs more than just the signature. [A valid signature proves that the private key and signed data were in the same place at the same time.](https://www.youtube.com/watch?t=63&v=psTh2xOvVJI&feature=youtu.be) The signed data needs to make a claim (predicate) about a thing (subject).

**Our signature proves that the SBOM was generated for our specific artifact at a given point in time.**

Finally, [in-toto attestations](https://github.com/in-toto/attestation) are a developing standard and define a format to hold exactly this information: a signature and payload, which contains a subject and predicate.

### Where to store the attestation?

In our [v2.1.0 release of Constellation](https://github.com/edgelesssys/constellation/releases/tag/v2.1.0), we stored the SBOMs for our container images in our GitHub release, while our images were stored in the [GitHub Container Registry](https://github.com/orgs/edgelesssys/packages?repo_name=constellation) ([ghcr.io](https://ghcr.io/)). This made it difficult for users to discover our SBOMs.

```sh
$ cosign tree ghcr.io/edgelesssys/constellation/verification-service:v2.1.0
📦 Supply Chain Security Related artifacts for an image: ghcr.io/edgelesssys/constellation/verification-service:v2.1.0
No Supply Chain Security Related Artifacts artifacts found for image ghcr.io/edgelesssys/constellation/verification-service:v2.1.0
```

Since then we learned that `cosign attach` can be used to store this critical meta information directly with the artifact in the same registry!

```sh
$ cosign attach --help
Provides utilities for attaching artifacts to other artifacts in a registry

Usage:
  cosign attach [command]

Available Commands:
  attestation Attach attestation to the supplied container image
  sbom        Attach sbom to the supplied container image
  signature   Attach signatures to the supplied container image
```

### Bringing it all together

The actual implementation is quite easy, once you understand what each step is for. [Syft and sigstore already took care of the integration work](https://anchore.com/sbom/creating-sbom-attestations-using-syft-and-sigstore/), so Syft can directly sign with our `cosign.key`.


```sh
IMAGE_REF=ghcr.io/edgelesssys/constellation/verification-service:v2.2.0
syft attest --key cosign.key -o cyclonedx-json ${IMAGE_REF} > verification-service.att.json
cosign attach attestation --attestation verification-service.att.json ${IMAGE_REF}
cosign verify-attestation ${IMAGE_REF} --type 'https://cyclonedx.org/bom' --key cosign.pub
```

The attached metadata can be discovered and consumed automatically.

```sh
$ cosign tree ghcr.io/edgelesssys/constellation/verification-service@sha256:fe31333a0696e4b044a2e1e7c6d6c88d7c387753350f68e7533383e1c70e6360
📦 Supply Chain Security Related artifacts for an image: ghcr.io/edgelesssys/constellation/verification-service@sha256:fe31333a0696e4b044a2e1e7c6d6c88d7c387753350f68e7533383e1c70e6360
└── 💾 Attestations for an image tag: ghcr.io/edgelesssys/constellation/verification-service:sha256-fe31333a0696e4b044a2e1e7c6d6c88d7c387753350f68e7533383e1c70e6360.att
   └── 🍒 sha256:8a369a8bac7d8d9ea8540e1d90478842b2e79cb4a2ea248636d99daa0b60186b
```

### Additional Info: Finding the predicate type

At the time of writing this, [an open issue exists](https://github.com/sigstore/cosign/issues/2264), which requires the user to manually specify the `--type` parameter when using `cosign verify-attestation`.

It is not trivial to find the value for this parameter because a lot of encoded and nested data structures need to be unpacked to find the actual value. [As commented on the issue](https://github.com/sigstore/cosign/issues/2264#issuecomment-1280669576), `cosign download` can be used to fetch the in-toto attestation. The `payload` field contains the base64 encoded [in-toto statement](https://github.com/in-toto/attestation/blob/main/spec/README.md#statement), which contains the `predicateType` we are looking for.

A handy one-liner can be used to fetch the information easily: `cosign download attestation <image_ref> | jq -r .payload | base64 -d | jq .predicateType`

Follow me & [Edgeless Systems](https://www.edgeless.systems/blog/), to learn how we continue to secure the supply chain of Constellation, and don't forget to [star it](https://github.com/edgelesssys/constellation) on GitHub!

Originally published on [Medium](https://medium.com/@datosh18/bringing-first-class-support-to-sboms-and-attestations-for-constellation-containers-629d7894e25).
