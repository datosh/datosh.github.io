---
title: "The unreasonable effectiveness of VEX in NixOS"
date: 2026-10-11
slug: nixos_vex
Description: "We explore why NixOS is uniquely positioned to implement a scalable process for vulnerability management."
thumbnail: "images/thumbnails/nixos_vex.png"
Tags: ["vex", "cve", "nix", "nixos"]
Draft: false
---

Triggered by the flood of LLM-assisted vulnerability reports this year, we have heard a lot about the struggles that maintainers of popular (open-source) projects face to cope with them. Most projects have slowed down feature development to focus on vulnerability triage; others are still looking for ways to combat the flood itself.

While we tend to hear many reports from maintainers, we have heard less about the people on the other side of the process: SysAdmins, SREs and AppSec teams are equally struggling with the same flood. New (potentially unpatched) CVEs are popping up each day. Each CVE needs to be assessed, and affected software needs to be updated or manually patched.

If you spend any time in this space, it doesn't take long for you to hear about [VEX](https://www.cisa.gov/sites/default/files/publications/VEX_Use_Cases_Document_508c.pdf) documents and statements. VEX stands for Vulnerability Exploitability eXchange: a machine-readable security advisory that tells you whether a specific software product is actually exposed to a known vulnerability.

Sounds great! But can we actually generate these statements in an automated way to support a scalable vulnerability triage process? The answer is, as always: it depends.

## SBOM-Based Scanning

Let's take a look at a security process that is used in many projects and organizations today.

Given a simple Go program:

```go
package main

import (
	"fmt"

	"golang.org/x/text/width"
)

func main() {
	fmt.Println(width.Widen.String("hello, world"))
}
```

Using `v0.38.0` of the `golang.org/x/text` library:

```go.mod
module maybe-vulnerable

go 1.26.8

require golang.org/x/text v0.38.0
```

A common approach to scan a program for vulnerabilities is to:
1. Generate a Software Bill of Materials (SBOM)
2. Scan the components noted in the SBOM for known vulnerabilities

Every team using this approach will see the following vulnerabilities (as of 11 Oct 2026):

```bash
$ syft scan . -o cyclonedx-json > sbom.cdx
$ grype sbom:sbom.cdx
NAME               INSTALLED  FIXED IN  TYPE       VULNERABILITY  SEVERITY  EPSS         RISK
golang.org/x/text  v0.38.0    0.39.0    go-module  GO-2026-5970   High      0.5% (39th)  0.4
golang.org/x/text  v0.38.0    0.41.0    go-module  GO-2026-6629   High      0.3% (24th)  0.3
```

If we do the legwork though, we can see that neither vulnerability actually affects our program.

[GO-2026-5970](https://osv.dev/vulnerability/GO-2026-5970) only exists in the `golang.org/x/text/unicode/norm` package, and [GO-2026-6629](https://osv.dev/vulnerability/GO-2026-6629) only exists in the `golang.org/x/text/secure/precis` package. Neither of them is used in our program!

We could take this information and craft two VEX statements stating `vulnerable_code_not_present`, but there are two issues with this:

1. This manual process scales with the size of your codebase and the number of dependencies.
2. You have to **repeat the full analysis every time you change your code**, because you might start to use a vulnerable function.

## Reachability Analysis

Luckily for us, programming languages are highly structured, so it is easy (for machines anyway) to reason about them.

On top of that, the Go team is very diligent in their work and record every affected import path and symbol, using the [ecosystem_specific field](https://ossf.github.io/osv-schema/#affectedecosystem_specific-field), when a new vulnerability is documented.

This is what powers [govulncheck](https://go.googlesource.com/vuln). It uses static analysis of our source code and the [Go vulnerability database](https://vuln.go.dev/) to narrow down reports to only those that could affect the application. Running it on our sample application shows:

```bash
$ govulncheck .
=== Symbol Results ===

No vulnerabilities found.

Your code is affected by 0 vulnerabilities.
This scan also found 1 vulnerability in packages you import and 14 vulnerabilities in
modules you require, but your code doesn't appear to call these vulnerabilities.
```

If you have this power, you could conceivably [turn off Dependabot](https://words.filippo.io/dependabot/), and only patch when affected.

## This Breaks Down for Operating Systems

Let's see how this would work for an operating system. We use this Dockerfile:

```Dockerfile
FROM debian:trixie@sha256:913f6706df59a68922d1dd08f78c2476560a8d367897200a6005b00e5f67c2d5
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssh-server \
 && mkdir -p /run/sshd \
 && rm -rf /var/lib/apt/lists/*
```

And then scan as before:

```bash
$ docker build -t opensshpam .
$ syft scan docker:opensshpam -o cyclonedx-json > sbom.cdx
$ grype sbom:sbom.cdx
✔ Scanned for vulnerabilities     [284 vulnerability matches]
  ├── by severity: 3 critical, 65 high, 80 medium, 39 low, 97 negligible
  └── by status:   0 fixed, 284 not-fixed, 0 ignored
NAME             INSTALLED            FIXED_IN   TYPE  VULNERABILITY   SEVERITY    EPSS          RISK
[...]
openssh-server   1:10.0p1-7+deb13u4              deb   CVE-2007-2768   Negligible  8.6% (94th)   0.4
[...]
```

For this demo we will focus on the triage process for a single vulnerability [CVE-2007-2768](https://nvd.nist.gov/vuln/detail/cve-2007-2768), and leave the remaining 283 as an exercise for the reader. 🫠

The long and short of it is that if sshd uses OPIE one-time passwords through PAM, an attacker can tell from the login prompt whether a username exists. It's been unfixed upstream since 2007.

Manually checking our sshd configuration, we can see that PAM is enabled, but keyboard-interactive authentication is disabled, and that is the only way sshd hands a login prompt to PAM.

```bash
$ docker run --rm opensshpam sh -c 'sshd -T | grep -E "^(usepam|kbdinteractiveauthentication) "'
usepam yes
kbdinteractiveauthentication no
```

Furthermore, we can see that no module named `opie` is configured.

```bash
$ docker run --rm opensshpam grep -E '^(@include|auth)' /etc/pam.d/sshd /etc/pam.d/common-auth
/etc/pam.d/sshd:@include common-auth
/etc/pam.d/sshd:@include common-account
/etc/pam.d/sshd:@include common-session
/etc/pam.d/sshd:@include common-password
/etc/pam.d/common-auth:auth     [success=1 default=ignore]      pam_unix.so nullok
/etc/pam.d/common-auth:auth     requisite                       pam_deny.so
/etc/pam.d/common-auth:auth     required                        pam_permit.so
$ docker run --rm opensshpam sh -c 'find / -xdev -name "pam_opie*" 2>/dev/null; dpkg -l | grep -i opie'
# nothing is printed
```

Doing this for 283 more vulnerabilities on every configuration change is not feasible!

## The Unreasonable Effectiveness of NixOS

Now, what makes NixOS different? Let's consider this system, which is very close to the Docker-based OS example we had before:

```nix
{
  fileSystems."/" = {
    device = "/dev/sda1";
    fsType = "ext4";
  };
  boot.loader.grub.device = "nodev";
  system.stateVersion = "26.11";

  services.openssh.enable = true;
  services.openssh.settings.KbdInteractiveAuthentication = false;
}
```

With the following flake:

```nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    {
      nixosConfigurations.sshd = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./configuration.nix
        ];
      };
    };
}
```

Replacing syft with [sbomnix](https://github.com/tiiuae/sbomnix), we can run the same process as before:

```bash
$ sbomnix .#nixosConfigurations.sshd.config.system.build.toplevel
[...]
INFO     Wrote: sbom.cdx.json
$ grype sbom:sbom.cdx.json
✔ Scanned for vulnerabilities     [272 vulnerability matches]
  ├── by severity: 14 critical, 84 high, 152 medium, 22 low, 0 negligible
  └── by status:   147 fixed, 125 not-fixed, 0 ignored
NAME        INSTALLED    FIXED_IN   TYPE  VULNERABILITY   SEVERITY    EPSS          RISK
[...]
openssh     10.5p1                  nix   CVE-2007-2768   Medium      8.6% (94th)   4.0
[...]
```

Finally, we have arrived at the payoff. As we learned before, `CVE-2007-2768` only affects our systems when certain conditions hold, and NixOS allows us to codify those!

Not only that, but we can **conditionally** generate a VEX feed, keeping the VEX statement only if the conditions still hold:

```nix
{
  config,
  lib,
  pkgs,
  ...
}:
let
  notAffected =
    !(pkgs ? opie)
    && config.services.openssh.settings.KbdInteractiveAuthentication == false
    && !(lib.any (rule: rule.enable && lib.hasInfix "opie" rule.modulePath) (
      lib.attrValues config.security.pam.services.sshd.rules.auth
    ));
in
{
  system.build.vex = pkgs.writeText "vex.json" (
    builtins.toJSON {
      "@context" = "https://openvex.dev/ns/v0.2.0";
      "@id" = "https://kammel.dev/vex/sshd";
      author = "Fabian Kammel";
      timestamp = "2026-10-11T00:00:00Z";
      version = 1;
      statements = lib.optional notAffected {
        vulnerability.name = "CVE-2007-2768";
        products = [ { "@id" = "pkg:nix/openssh"; } ];
        status = "not_affected";
        justification = "vulnerable_code_not_present";
      };
    }
  );
}
```

Integrating this into our process:

```bash
$ VEX=$(nix build --no-link --print-out-paths .#nixosConfigurations.sshd.config.system.build.vex)
$ grype --vex $VEX sbom:sbom.cdx.json
 ✔ Scanned for vulnerabilities     [271 vulnerability matches]
   ├── by severity: 14 critical, 84 high, 152 medium, 22 low, 0 negligible
   └── by status:   147 fixed, 125 not-fixed, 1 ignored
```

The triaged CVE is now successfully ignored.

## nixos-vex

As you can see, building out these conditions is a lot of work, but the payoff is enormous. Once a CVE has been triaged and codified, the cost to re-check is close to zero (a little bit of CI overhead).

I have been doing this sort of triaging work for my NixOS machines, and I have open-sourced this as [nixos-vex](https://github.com/datosh/nixos-vex).

Check out the demos for a sample [desktop](https://github.com/datosh/nixos-vex/tree/main/demo/desktop) and [server](https://github.com/datosh/nixos-vex/tree/main/demo/server) profile, as they also highlight some other features built into nixos-vex.

**I would not recommend using this as a high-trust data source yet!**

My goal is to share the process, invite feedback, and hopefully contribute this back to the Nix ecosystem at some point.
