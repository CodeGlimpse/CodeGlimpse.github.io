---
title: "OpenClaw Installation: Environment Checks and Verification"
description: "Check official Node.js and package-manager requirements, choose an installation method, onboard, and verify the OpenClaw Gateway."
slug: openclaw-install
date: 2026-03-23 22:00:00+0800
categories:
    - Tutorials
tags:
    - OpenClaw
lastmod: 2026-09-07T00:00:00+08:00
review_date: "2026-09-07"
review_scope: "Checked against official installation documentation; runtime requirements are recorded below. No fresh-system installation was performed."
series_id: openclaw
series_order: 1
tool_related: [json, diff]
---

OpenClaw runs a Gateway on your own device and connects it to messaging channels and model services. This guide follows the official CLI workflow: check the environment, choose an installation method, run onboarding, and verify the result.

## Check the environment first

At the review date, the official requirements list **Node.js 22.22.3+, 24.15+, or 25.9+, with Node 26 recommended**. The earlier “Node 22.16+” requirement is outdated. Official Windows options now include the native Windows Hub, PowerShell CLI, and WSL2; this article focuses on the CLI.

Record your actual versions before choosing a command:

```bash
node --version
npm --version
```

Model authentication depends on the provider. Complete it locally through the onboarding flow and keep credentials out of screenshots, shared links, and issue reports. Installation, onboarding, and daemon setup change the local environment.

## Option 1: a package manager

For **npm 12 or npm 11.16+**, the current official command explicitly permits OpenClaw's own lifecycle scripts:

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
```

**npm 11.15 and earlier** do not support that option:

```bash
npm install -g openclaw@latest
```

For pnpm, the current global installation command is:

```bash
pnpm add -g --allow-build=openclaw openclaw@latest
```

`pnpm approve-builds -g` is not the supported global installation flow. Because `latest` changes, use a reviewed explicit release number when reproducibility matters, and record Node.js, package-manager, and operating-system versions.

## Option 2: the official installer

The installer may install or select Node.js, install OpenClaw, and start onboarding. Download and inspect it before execution; verify any publisher-provided checksums or signatures as well.

### macOS / Linux / WSL2

```bash
installer_path="$(mktemp)"
curl -fL https://openclaw.ai/install.sh -o "$installer_path"
less "$installer_path"
# Run only after reviewing the script
bash "$installer_path"
```

### Windows PowerShell

```powershell
$installerPath = Join-Path $env:TEMP 'openclaw-install.ps1'
Invoke-WebRequest -Uri 'https://openclaw.ai/install.ps1' -OutFile $installerPath
Get-Content -LiteralPath $installerPath
# Run only after reviewing the script
& $installerPath
```

Third-party forks and mirrors can differ in package names, configuration, and versions. This review covers official OpenClaw; the former `openclaw-cn` steps are no longer mixed into the official workflow. For source builds, follow the matching pnpm requirements on the [official installation page](https://docs.openclaw.ai/install).

## Onboarding and verification

If the installer has not already completed onboarding:

```bash
openclaw onboard --install-daemon
```

This configures model access, the Gateway, and background startup. Check the CLI and service separately:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
openclaw dashboard
```

`doctor` is a diagnostic entry point; some releases may offer configuration migrations or repairs. Read the output before accepting changes. A version number does not prove that the Gateway is running, and opening the Dashboard does not prove a successful model request.

## Common failures and next steps

- **`openclaw` is not found:** reopen the terminal, inspect `npm prefix -g` and command resolution, and confirm that you are using the Node environment that installed it.
- **Lifecycle scripts are blocked:** check the package-manager version and the matching approval option above instead of approving unrelated packages.
- **The Gateway is unavailable:** inspect service and connection details in `openclaw gateway status` before following the official troubleshooting guidance.

The next article explains the three browser connection modes. Use the [JSON tool]({{< relref "tools/json" >}}) for ordinary JSON examples; full JSON5 configurations still require OpenClaw's own diagnostics.

## Official references

- [Installation and system requirements](https://docs.openclaw.ai/install)
- [Getting started and onboarding](https://docs.openclaw.ai/start/getting-started)
- [Release history](https://github.com/openclaw/openclaw/releases)
