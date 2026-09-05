---
title: "How to Completely Uninstall OpenClaw"
date: 2026-03-18T17:22:00+08:00
draft: false
description: "This article provides detailed steps and automated scripts for completely uninstalling OpenClaw and its related components on Windows, Linux, and macOS."
categories:
    - Tutorials
tags:
    - OpenClaw
---

OpenClaw, a recently popular AI agent, is very convenient to install and use. However, recent news has also revealed that this tool poses significant security risks and may not be suitable for enterprise environments or computers containing personal privacy. Nevertheless, due to the unique installation method of OpenClaw, it may not be easy to uninstall it. This article will provide a detailed guide to teach you how to uninstall OpenClaw.

We will cover manual removal steps and provide recommended automated cleanup scripts for Windows, Linux, and macOS.

## Why is a Complete Uninstall Necessary?

In some cases, a simple `npm uninstall` may not be enough to remove all traces of OpenClaw. Remnants can include:
- Lingering configuration files
- Active background processes
- Caches stored in various user directories
- Paths added to environment variables

## Automated Uninstallation (Inspect Before Applying)

The cleanup scripts default to a read-only **dry run**. They list detected OpenClaw global packages, Node.js processes whose command line explicitly identifies OpenClaw, and resources in the current Docker context whose name or image explicitly matches OpenClaw. They do not stop every Node.js process or scan and remove user directories, configuration files, registry values, or arbitrary Docker resources.

Do not execute remote scripts through `curl | bash` or `irm | iex`. Download the file, verify its SHA-256 digest, inspect it, and run the dry-run first. After reviewing the plan, use `-Apply`/`--apply`; interactive mode also requires typing `REMOVE OPENCLAW`.

### Windows (PowerShell)

```powershell
$scriptUrl = 'https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForWindows.ps1'
$scriptPath = Join-Path $env:TEMP 'CleanupOpenClawForWindows.ps1'
Invoke-WebRequest -Uri $scriptUrl -OutFile $scriptPath

$expectedSha256 = 'eab731bd073f42fb75569be6c1dd3af37aca3214957057241ed13072fcc40daa'
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $scriptPath).Hash.ToLowerInvariant() -ne $expectedSha256) {
    throw 'SHA-256 verification failed. Do not run this file.'
}

Get-Content -LiteralPath $scriptPath
& $scriptPath          # dry-run; inventory only
& $scriptPath -Apply   # asks for explicit confirmation before changing anything
```

Administrator privileges are normally unnecessary. Use an elevated terminal only if your installation location or Docker environment specifically requires it. `-Apply -Yes` is reserved for controlled automation after the plan has been reviewed.

### Linux (Bash)

```bash
script_path="$(mktemp)"
curl -fL 'https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForLinux.sh' -o "$script_path"
printf '%s  %s\n' '0cfab4f8823a1644ef2e5b47275b144417c271372b7b11b795cf8c60a6689cb8' "$script_path" | sha256sum -c -

less "$script_path"
bash "$script_path"          # dry-run; inventory only
bash "$script_path" --apply  # requires typing REMOVE OPENCLAW
```

### macOS (Bash)

```bash
script_path="$(mktemp)"
curl -fL 'https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForMacOS.sh' -o "$script_path"
printf '%s  %s\n' 'a7e6048a20a933e4297edfe64847afc8f5a206add153502ff6ac260be9d7a801' "$script_path" | shasum -a 256 -c -

less "$script_path"
bash "$script_path"          # dry-run; inventory only
bash "$script_path" --apply  # requires typing REMOVE OPENCLAW
```

## Manual Uninstallation Guide

If you prefer to handle the uninstallation manually, please follow the steps below:

### 1. Terminate Running Processes

Ensure no OpenClaw-related Node.js processes are active. You can use Task Manager on Windows or the `top`/`ps` commands on Linux and macOS to find and terminate them.

### 2. Uninstall Global Packages

Use your preferred package manager to execute the uninstall command:

```bash
# Using npm
npm uninstall -g openclaw openclaw-cn

# Using pnpm
pnpm uninstall -g openclaw openclaw-cn
```

### 3. Clean Up Residual Files

Check the following locations and delete any folders related to OpenClaw:
- **Windows**: `C:\Users\<YourUsername>\AppData\Roaming\npm\node_modules\openclaw`
- **Linux/macOS**: `/usr/local/lib/node_modules/openclaw` or `~/.npm-global/lib/node_modules/openclaw`

## Frequently Asked Questions

**Q: I'm getting a "permission denied" error when running the script.**
**A:** On Windows, ensure you are running PowerShell with administrator privileges. On Linux and macOS, you may need to use `sudo`.

**Q: The script reports that Node.js was not found.**
**A:** This can happen if Node.js is not in your system's PATH. Our scripts attempt to locate common installation directories (like those used by NVM), but you may need to ensure your environment is configured correctly.

---

We hope this guide helps you successfully uninstall OpenClaw. If you have any questions, feel free to leave a comment below.
