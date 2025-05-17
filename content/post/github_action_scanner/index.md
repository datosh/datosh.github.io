---
title: Comparison of GitHub Action Scanners
date: 2025-05-17
Description: "A comparison of GitHub Action Scanners."
thumbnail: "images/thumbnails/github_action_scanner.png"
Tags: ["github", "actions", "security"]
Draft: false
---

[GitHub Actions](https://docs.github.com/en/actions) are a powerful way to
automate your software development workflows, and manage them right in your
repository. Even though they are becoming ever more popular, there is little
movement to invest in tooling to make them more secure... at least until
recently.
In the last few weeks I have seen posts about
[zizmor](https://github.com/zizmorcore/zizmor)
and
[poutine](https://github.com/boostsecurityio/poutine).
After a bit of digging I was also able to find
[octoscan](https://github.com/synacktiv/octoscan),
as well as a research project from Snyk called
[github-actions-scanner](https://github.com/snyk-labs/github-actions-scanner).

All of them are static code analysis tools that scan your GitHub Actions workflows
for potential (security) issues. All of them are barely a year old, so let's see how
they compare!

Now for a victim 😈 we will use
[opkssh](https://github.com/openpubkey/opkssh) which is still a new and small-ish
project, so we have a good chance of actually resolving all findings, within the
scope of a single blog post.

{{< info note >}}
[opkssh](https://github.com/openpubkey/opkssh)
is a tool which enables ssh to be used with OpenID Connect allowing SSH
access to be managed via identities like alice@example.com instead of long-lived
SSH keys.
{{< /info >}}

## GitHub Token

Before we dive in, most of these tools need to interact with the GitHub API,
mostly for fetching the action definitions from the repository.
GitHub has a very aggressive rate limit for their API, which has recently gotten
[even more restrictive](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/)
with the rise of web scraping to fuel the ever-growing AI arms race.

So make sure to go to your
[GitHub Settings](https://github.com/settings/tokens),
create a good old classic token with the `repo` scope, and make it available
on your system:

```bash
export GH_TOKEN=ghp_OyoXXXXXXXXXXXXXXU3GhrAf
```

## Zizmor

[Zizmor](https://docs.zizmor.sh/) gained a lot of
[attention](https://www.wiz.io/blog/github-actions-security-guide)
[recently](https://grafana.com/blog/2025/05/15/grafana-security-update-post-incident-review-for-github-workflow-vulnerability-and-whats-next/),
in the wake of high profile GitHub Actions
[security](https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066)
[incidents](https://www.wiz.io/blog/new-github-action-supply-chain-attack-reviewdog-action-setup).

The installation is easy enough, when you have Rust installed, but other
[installation options](https://docs.zizmor.sh/installation/) are available as
well.

```bash
cargo install --locked zizmor
```

Next, we scan a repository (the GitHub token is automatically picked up
from the `GH_TOKEN` environment variable):

```console
$ zizmor datosh/opkssh
 INFO collect_inputs: zizmor: collected 7 inputs from datosh/opkssh
 INFO zizmor: skipping forbidden-uses: audit not configured
 INFO audit: zizmor: 🌈 completed .github/workflows/build.yml
 INFO audit: zizmor: 🌈 completed .github/workflows/ci.yml
 INFO audit: zizmor: 🌈 completed .github/workflows/go.yml
 INFO audit: zizmor: 🌈 completed .github/workflows/release-drafter.yml
 INFO audit: zizmor: 🌈 completed .github/workflows/release.yml
 INFO audit: zizmor: 🌈 completed .github/workflows/staging.yml
 INFO audit: zizmor: 🌈 completed .github/workflows/weekly.yml
[...]
35 findings (5 suppressed): 0 unknown, 0 informational, 0 low, 18 medium, 12 high
```

Each finding is reported (by default) using cargo-style output. Personally, I
don't find it very pleasant to read.

```bash
warning[excessive-permissions]: overly broad permissions
  --> .github/workflows/ci.yml:32:3
   |
32 | /   nix-build:
33 | |     name: Nix Build
...  |
43 | |         run: nix build .
44 | |   # Run integration tests
   | |                         -
   | |_________________________|
   |                           this job
   |                           default permissions used due to no permissions: block
   |
   = note: audit confidence → Medium
```

Other formats are supported, one of which is
[SARIF](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html),
the Static Analysis Results Interchange Format. This allows you to ingest this
data into your existing tooling, e.g., right in your
[GitHub repository](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning).

We don't get a summary of the findings, but we can easily build one using the
JSON output format and a bit of `jq` magic:

```console
$ zizmor datosh/opkssh --format json > zizmor-report.json
$ jq 'reduce .[] as $item ({}; .[$item.ident] += 1)' zizmor-report.json
{
  "artipacked": 9,
  "excessive-permissions": 9,
  "unpinned-uses": 10,
  "cache-poisoning": 2
}
```

Their [audit rules](https://docs.zizmor.sh/audits/) page contains detailed
information about each finding. So let's dive into ours!

### ArtiPACKED

The term `ArtiPACKED` was coined by the security researchers who discovered
[this vulnerability](https://unit42.paloaltonetworks.com/github-repo-artifacts-leak-tokens/).
By default, using actions/checkout causes a credential to be persisted in the
checked-out repo's `.git/config`, so that subsequent git operations can be
authenticated. [[rule docs]](https://docs.zizmor.sh/audits/#artipacked)

The initial research discovered that this token was sometimes included in the
final release artifact, so it may be used by attackers to access the repository.
Even if we don't accidentally persist the token as an artifact, we should not
make it available to subsequent steps, unless we actually need to.

The fix is a simple single line change:

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
  with:
    persist-credentials: false
```

### Excessive Permissions

At the start of each workflow job, GitHub automatically creates a unique
`GITHUB_TOKEN` secret which is used to authenticate your workflow, e.g., to
push packages, make changes to issues, etc.

This token, by default, has
[very broad permissions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication#permissions-for-the-github_token).
It is possible to limit the default permissions
[on an organization level](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#workflow-permissions),
but the most fail-safe and explicit way is to use the `permissions` keyword
in your workflow.
As per the
[rule documentation](https://docs.zizmor.sh/audits/#excessive-permissions),
limiting permissions only takes a few lines of YAML:

```yaml
name: release
permissions: {} # drop all permissions

jobs:
  release:
    name: Release 📦
    permissions:
      packages: write # grant only what is needed

    steps:
      - name: ...
```

### Unpinned Uses

GitHub recommends to
[pin an Action to a full length commit SHA](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#using-third-party-actions)
as it is currently the only way to use an Action as an immutable release.

Most actions use references like `actions/checkout@v4`, to automatically pick up
minor and patch version upgrades, but stick to a major version. The problem is
that this can introduce stability issues, as bugs make their way into your pipeline
without changes on your side, as well as [security issues](https://unit42.paloaltonetworks.com/github-actions-supply-chain-attack/).

The only real solution is to pin to a specific commit SHA, e.g.,
`actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683`.
Still, only
[2% of GitHub repositories](https://pin-gh-actions.kammel.dev/)
fully embrace this security best practice!

Zizmor has one exception in this rule, where they allow mutable references to
official `actions/*` actions, e.g., `actions/checkout@v4`. They state that if the
"upstream repository is trusted, then symbolic references are often suitable".
I would disagree with this decision, as official actions are just as likely to
be a target of supply chain attacks as any other third party action, and the
security of your system is only as strong as the weakest link. So please pin your
actions! Tools like [frizbee](https://github.com/stacklok/frizbee/releases) help
with the initial migration, and
[renovate](https://docs.renovatebot.com/presets-helpers/#helperspingithubactiondigests)
makes updating a breeze!

### Cache Poisoning

Caching is a great way to speed up your workflows, but at the same time attackers
can use your cache to persist malicious files and lateral movement.
As described by
[Adnan Khan](https://adnanthekhan.com/2024/05/06/the-monsters-in-your-build-cache-github-actions-cache-poisoning/),
there are basically no checks in the caching implementation of GitHub Actions,
allowing attackers to move between branches and workflows.

The best we can do is to not use caching at all in sensitive workflows, e.g.,
when releasing our software. Disabling caching is different for each workflow,
so best consult the `actions.yml` for each workflow to find out how to disable it.
The [actions/setup-go](https://github.com/actions/setup-go/blob/main/action.yml)
provides a `cache` input, which can be set to `false` to disable caching.

## Poutine

Poutine is developed by [Boost Security](https://boostsecurity.io/), and is the
only tool that also supports
[GitLab pipelines](https://docs.gitlab.com/ee/ci/pipelines/pipeline_architectures.html),
[Azure DevOps](https://docs.microsoft.com/en-us/azure/devops/pipelines/get-started/pipelines-get-started?view=azure-devops)
and
[Tekton](https://tekton.dev/).

The [release page](https://github.com/boostsecurityio/poutine/releases) provides
easy to use statically linked binaries. So installation doesn't require more than
`curl` and `install`.

After that we can scan the repository with (the GitHub token is automatically
picked up from the `GH_TOKEN` environment variable):

```bash
poutine analyze_repo datosh/opkssh
```

The findings are grouped by rule and are easy to read:

```txt
Summary of findings:
+--------------------------------------------+--------------------------------------------------------+----------+--------+
|                  RULE ID                   |                       RULE NAME                        | FAILURES | STATUS |
+--------------------------------------------+--------------------------------------------------------+----------+--------+
| debug_enabled                              | CI Runner Debug Enabled                                |        0 | Passed |
| default_permissions_on_risky_events        | Default permissions used on risky events               |        0 | Passed |
| github_action_from_unverified_creator_used | Github Action from Unverified Creator used             |        3 | Failed |
| if_always_true                             | If condition always evaluates to true                  |        0 | Passed |
| injection                                  | Injection with Arbitrary External Contributor Input    |        0 | Passed |
| job_all_secrets                            | Workflow job exposes all secrets                       |        0 | Passed |
| known_vulnerability_in_build_component     | Build Component with a Known Vulnerability used        |        0 | Passed |
| known_vulnerability_in_build_platform      | Build Platform with a Known Vulnerability used         |        0 | Passed |
| pr_runs_on_self_hosted                     | Pull Request Runs on Self-Hosted GitHub Actions Runner |        0 | Passed |
| unpinnable_action                          | Unpinnable CI component used                           |        0 | Passed |
| untrusted_checkout_exec                    | Arbitrary Code Execution from Untrusted Code Changes   |        0 | Passed |
| unverified_script_exec                     | Unverified Script Execution                            |        0 | Passed |
+--------------------------------------------+--------------------------------------------------------+----------+--------+
```

The specific findings link to the rule documentation for more details. So let's
dive into our only finding.

### Unverified Creator

The full output for this finding is:

```txt
Rule: Github Action from Unverified Creator used
Severity: note
Description: Usage of the following GitHub Actions repositories was detected in workflows
or composite actions, but their owner is not a verified creator.
Documentation: https://boostsecurityio.github.io/poutine/rules/github_action_from_unverified_creator_used

+---------------------------------+-------------------+----------------------------------------------------+
|           REPOSITORY            |      DETAILS      |                        URL                         |
+---------------------------------+-------------------+----------------------------------------------------+
| golangci/golangci-lint-action   | Used in 1 repo(s) | https://github.com/golangci/golangci-lint-action   |
|                                 |                   |                                                    |
| ncruces/go-coverage-report      | Used in 1 repo(s) | https://github.com/ncruces/go-coverage-report      |
|                                 |                   |                                                    |
| release-drafter/release-drafter | Used in 1 repo(s) | https://github.com/release-drafter/release-drafter |
|                                 |                   |                                                    |
+---------------------------------+-------------------+----------------------------------------------------+
```

This rule detects that a GitHub Action
["owner is not a verified creator"](https://boostsecurityio.github.io/poutine/rules/github_action_from_unverified_creator_used/).
So what does that mean?

On the GitHub Actions marketplace, GitHub tracks which actions are
[published by verified creators](https://github.com/marketplace?query=sort%3Apopularity-desc&type=actions&verification=verified_creator)
and they get a little badge next to them.
To become a verified creator, you first need to become a
[partner organization](https://partner.github.com/)
and then
[request your creator badge via email](https://docs.github.com/en/actions/sharing-automations/creating-actions/publishing-actions-in-github-marketplace#about-badges-in-github-marketplace).

I acknowledge that this provides a positive signal for the trustworthiness of the
action, but flagging all unverified actions seems a little too noisy for me.
Given that they also categorize this as `severity: note`, I would use this
information to do a pass over your workflow dependencies and manually judge
whether you trust the action or not.

As far as I'm concerned, this is a won't fix.

## Octoscan

[Octoscan](https://github.com/synacktiv/octoscan) is a tool developed by
[Synacktiv](https://synacktiv.com/).

The
[GitHub release page](https://github.com/synacktiv/octoscan/releases)
provides binaries for Windows and Linux, otherwise the project recommends to
[build it yourself](https://github.com/synacktiv/octoscan?tab=readme-ov-file#installation).

This project requires a two-step process. First we download the workflow definitions
for each branch, and then we scan them.

```bash
octoscan dl --token $GH_TOKEN --org datosh --repo opkssh
octoscan scan octoscan-output
```

The only finding I got, for each branch, was:

```console
$ octoscan scan octoscan-output

octoscan-output/datosh/opkssh/main/.github/workflows/ci.yml:40:34:
label "ubuntu-24.04-arm" is non default and might be a self-hosted runner. [runner-label]
   |
40 |         runs_on: [ubuntu-latest, ubuntu-24.04-arm]
   |                                  ^~~~~~~~~~~~~~~~~
```

Sadly, this is a false positive, as the `ubuntu-24.04-arm` runner is a recently
added type that is currently in
[public preview](https://docs.github.com/en/actions/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners#standard-github-hosted-runners-for-public-repositories).

I [opened an issue](https://github.com/synacktiv/octoscan/issues/28) with the project.

## Snyk GitHub Action Scanner

Even though [github-action-scanner](https://github.com/snyk-labs/github-action-scanner)
is a research project by [Snyk](https://snyk.io/) and does not seem intended for
production usage, I wanted to see what type of findings it would produce.

The installation was a bit more involved, but installing [nvm](https://github.com/nvm-sh/nvm)
brings down the installation steps to:

```bash
git clone https://github.com/snyk-labs/github-actions-scanner.git
cd github-actions-scanner
nvm install --lts
npm i
# This is how we will invoke the tool going forward
npm run start --
```

Scanning the repository is then a matter of:

```console
$ npm run start -- scan-repo -u https://github.com/datosh/opkssh

> github-actions-analyzer@1.0.0 start
> node index.mjs scan-repo -u https://github.com/datosh/opkssh

2025-05-17T10:43:45.653Z info: github-actions-scanner by Snyk (2024)
2025-05-17T10:43:47.429Z info: Got 7 actions for datosh/opkssh...
2025-05-17T10:43:47.429Z info: Scanning datosh/opkssh/.github/workflows/build.yml@main...
2025-05-17T10:43:48.510Z info: Scanning datosh/opkssh/.github/workflows/ci.yml@main...
2025-05-17T10:43:48.724Z info: Scanning datosh/opkssh/.github/workflows/go.yml@main...
2025-05-17T10:43:49.298Z info: Scanning datosh/opkssh/.github/workflows/release-drafter.yml@main...
2025-05-17T10:43:49.500Z info: Scanning datosh/opkssh/.github/workflows/release.yml@main...
2025-05-17T10:43:49.690Z info: Scanning datosh/opkssh/.github/workflows/staging.yml@main...
2025-05-17T10:43:49.874Z info: Scanning datosh/opkssh/.github/workflows/weekly.yml@main...
2025-05-17T10:43:50.079Z info: Scanned 7 actions
[...]
```

Each finding is reported in its own block and links back to the project
documentation for more details:

```txt
The rule UNPINNED_ACTION triggered for https://github.com/datosh/opkssh/blob/main/.github/workflows/release-drafter.yml
  Documentation: https://github.com/snyk/github-actions-scanner#UNPINNED_ACTION
  Workflow: .github/workflows/release-drafter.yml
    Job: update_release_draft
      Step: none
        - Description: The action release-drafter/release-drafter@v6 is used with branch/tag v6 rather than a pinned commit.
          Permissions: contents:write,pull-requests:write
          Secrets: secrets.GITHUB_TOKEN
```

We only got one type of finding, pin actions by hash, which is great, but
we already covered this [in the previous section](#unpinned-uses).

One thing I'd like to note is that the tool supports a `--recurse` flag, which dives
into the dependencies of your dependencies, and helps you uncover issues in your
supply chain!

## Conclusion

All tools helped me to learn more about GitHub Actions security, and allowed me
to put together a [pull request](https://github.com/openpubkey/opkssh/pull/198)
to improve the security posture of opkssh's workflows.

I would have loved to see more tooling support that checks the official
[GitHub Actions security hardening guide](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions),
but each tool has additional checks that go far beyond what GitHub recommends!
In the end, you are responsible to compile your own security policy based on the
best practices out there.

I highly recommend browsing [Zizmor's audit rules](https://docs.zizmor.sh/audits/)
documentation, as they link out to the original research and further information
for most rules.
