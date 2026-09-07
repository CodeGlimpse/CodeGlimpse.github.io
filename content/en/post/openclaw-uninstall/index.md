---
title: "How to Completely Uninstall OpenClaw"
date: 2026-03-18T17:22:00+08:00
draft: false
description: "This article provides detailed steps and automated scripts for completely uninstalling OpenClaw and its related components on Windows, Linux, and macOS."
categories:
    - Tutorials
tags:
    - OpenClaw
lastmod: 2026-09-07T00:00:00+08:00
review_date: "2026-09-07"
review_scope: "Checked against the official removal workflow. Bundled scripts passed syntax and scope checks; no cleanup was executed in this review."
series_id: openclaw
series_order: 3
---

Removing OpenClaw involves separate scopes: the Gateway service, state, workspace, desktop app, and CLI package. Decide what to preserve before removal and confirm any backups first.

## Start with the built-in uninstaller

If the CLI is still available, inspect all removal scopes first:

```bash
openclaw uninstall --dry-run --all
```

Review the exact directories and services, then use the interactive flow:

```bash
openclaw uninstall
```

The current official prompt initially selects only the Gateway service. State, workspace, and app are separate choices; `--all` selects all four scopes. Removing state does not imply removing configured workspaces. Service-removal failure may preserve data scopes and produce a partial-cleanup error.

If the CLI is gone but its service remains, follow the operating-system-specific [official manual removal instructions](https://docs.openclaw.ai/install/uninstall). Do not terminate every Node.js process.

The optional scripts below perform narrower package/process/Docker inventory and cleanup. They do not replace the built-in state, workspace, and service removal workflow.

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

## Remove the CLI package and verify

After the requested service and data scopes are handled, uninstall the CLI with the package manager that installed it. Choose one:

```bash
# npm installation
npm uninstall -g openclaw

# pnpm installation
pnpm remove -g openclaw
```

Treat third-party forks such as `openclaw-cn` separately. Use the actual package prefix and reviewed inventory rather than deleting a guessed system-wide directory. Recheck the former service and command resolution; the absence of a CLI command alone does not prove removal of a background service.

## Common problems

- For permission errors, identify the installation location or Docker permission requirement first. Do not elevate every cleanup action by default.

- If a command cannot be found, check the PATH and package-manager environment used for that installation. The inventory is limited to what the script can actually detect.

- A dry run reports a plan. Successful cleanup requires checking the apply result and any remaining service or resource.

## Official reference

[OpenClaw uninstall scopes, preview, and manual service removal](https://docs.openclaw.ai/install/uninstall)
