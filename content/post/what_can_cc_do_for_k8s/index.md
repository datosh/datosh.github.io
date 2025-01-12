---
title: "What can Confidential Computing do for the Kubernetes community?"
date: 2022-07-12
Description: ""
thumbnail: "images/thumbnails/what_can_cc_do_for_k8s.png"
Tags: ["Kubernetes", "Constellation", "Edgeless Systems"]
toc: false
---

> This is a summary of the talk I gave at the Kubernetes Community Days (KCD) Berlin 2022. Both, the [slides](https://docs.google.com/presentation/d/17xThNh8vCj42s2pYjoe6DN3i2pzwDh4S/edit#slide=id.p1) and a [recording](https://www.youtube.com/watch?v=PhleEbcWkuM) are available.

After working 5 years with cloud native technologies to enable key & certificate management in automotive enterprise security, I was amazed to discover how many Confidential Computing (CC) use cases are possible today. When joining Edgeless Systems, I learned that many problems I have met in the past, could have been solved with CC technologies, but I was not aware of the available solutions.

This piece will present you with an overview, so you know which tools are available to solve your Kubernetes security and data privacy challenges.

### What is Confidential Computing?

The goal of Confidential Computing is to reduce the Trusted Compute Base (**TCB**) by creating a Trusted Execution Environment (**TEE**). This is achieved through a combination of **memory isolation** (encryption & integrity protection) and **remote attestation**, enforced by the CPU and its special instructions available on latest hardware generations. These new features complete the trifecta of **encryption at rest**, **encryption in transit**, and now also **encryption in use**.

{{< figure src="overview.webp" title="CC enables encryption in use and verifiability" >}}

In the past we've used TEEs such as Hardware Security Modules (**HSMs**), Trusted Platform Modules (**TPMs**) or smartcards, but these were expensive, limited in hardware resources, hard to program, or a mix of these.

**Confidential Computing provides us with two new primitives: Confidential Virtual Machines (CVMs) & Enclaves.**

CVMs are as easy to program as a classical virtual machine but are fully isolated from the Cloud Service Provider (**CSP**) and allow us to remotely verify their state.

Enclaves are more secure, but harder to program than CVMs. Enclaves are isolated processes which do not require an operating system, and therefore are also able to remove the OS vendor from the trusted compute base. This increases the complexity when developing apps for Enclaves, but developer friendly SDKs, such as [EGo](https://github.com/edgelesssys/ego), are available.

How can we use these innovative technologies?

### Remote Kubernetes-Node Attestation

Both [Intel TDX](https://www.intel.com/content/www/us/en/developer/tools/trust-domain-extensions/overview.html) & [AMD SEV](https://www.amd.com/en/developer/sev.html) supply means to create confidential virtual machines. Offerings in [Azure](https://azure.microsoft.com/en-us/solutions/confidential-compute/#overview) and [Google Cloud](https://cloud.google.com/security/products/confidential-computing?hl=en) make it as easy as choosing a different machine type or enabling a flag, to start using confidential machines.

Using these allows us to remove both the Hypervisor & Cloud Service Provider from the Trusted Compute Base.

{{< figure src="snp.webp" caption="[**Trusted compute base of an AMD-SEV SNP CVM**](https://www.amd.com/system/files/TechDocs/SEV-SNP-strengthening-vm-isolation-with-integrity-protection-and-more.pdf)" >}}

A Kubernetes cluster built using CVMs protects us from the cloud provider that cannot gain access to our K8s nodes anymore. Additionally, it also protects us from any malware affecting the cloud provider's network or cloud management software!

### Secure & Verifiable Build Systems using Enclaves

[Intel SGX](https://www.intel.com/content/www/us/en/developer/tools/software-guard-extensions/overview.html) enables our application to request the creation of an Enclave directly from the Hardware. Both data & code can be encrypted and are only ever decrypted in the protected Enclave. This allows us to carry out secure computations in a fully isolated environment.

{{< figure src="sgx.webp" title="Creation of Intel SGX Enclave" >}}

[Supply chain attacks](https://en.wikipedia.org/wiki/Supply_chain_attack) have increased over the last couple of years. The most popular attack was on [SolarWind's build system](https://choice.npr.org/index.html?origin=https%3A%2F%2Fwww.npr.org%2F2021%2F04%2F16%2F985439655%2Fa-worst-nightmare-cyberattack-the-untold-story-of-the-solarwinds-hack), but also [crypto miners in NPM packages](https://blog.sonatype.com/newly-found-npm-malware-mines-cryptocurrency-on-windows-linux-macos-devices) have received their fair share of news coverage.

One article by Wired from 2021 details which problems the industry is facing when adopting secure build systems: ["Keeping tabs on proprietary systems […] is challenging because security tools need to foster transparency and validation without exposing competitive secrets or intellectual property"](https://www.wired.com/story/solarwinds-hack-supply-chain-threats-improvements/).

To foster **transparency**, the cloud native community has adopted [Software Bill of Materials (SBOMs)](https://www.cisa.gov/sbom) and to enable **validation** projects like [Sigstore](https://www.sigstore.dev/) and [SLSA](https://slsa.dev/) are improving the integrity of our artifacts.

Still, using a SaaS offering for a secure build system is still limited by the fact that Intellectual Property (IP) would be exposed to the SaaS vendor as well as infrastructure provider. A build system based on Enclaves would allow users to verify the build system and be sure that no code or data is available to any service provider.

### Conclusion

CVMs & Enclaves provide us with the choice to use a more secure environment to carry out computations and protect our data. Using Confidential Virtual Machines should be the default today — especially for sensitive, but also for non-sensitive workloads.

If you want to learn more about Confidential Computing, follow Edgeless Systems on [LinkedIn](https://www.linkedin.com/company/edgeless-systems) and [Twitter](https://twitter.com/EdgelessSystems), and star our [OSS projects on GitHub](https://github.com/edgelesssys).

Originally published on [Medium](https://medium.com/@datosh18/what-can-confidential-computing-do-for-the-kubernetes-community-96bb2278c329)
