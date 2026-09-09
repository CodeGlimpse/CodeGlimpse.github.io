---
title: "如何彻底卸载 OpenClaw 小龙虾"
date: 2026-03-18T17:22:00+08:00
draft: false
description: "本文提供了在 Windows、Linux 和 macOS 系统上彻底卸载 OpenClaw 的详细步骤和自动化脚本。"
categories:
    - Tutorials
tags:
    - OpenClaw
lastmod: 2026-09-07T00:00:00+08:00
series_id: openclaw
series_order: 4
---

卸载 OpenClaw 涉及不同范围：Gateway 服务、状态目录、工作区、桌面应用和 CLI 包。先确定哪些内容需要保留，并确认备份，再开始清理。

## 优先使用内置卸载器

CLI 仍可用时，先预览所有清理范围：

```bash
openclaw uninstall --dry-run --all
```

核对实际目录和服务后，进入交互式卸载：

```bash
openclaw uninstall
```

当前官方交互流程初始只选中 Gateway 服务，状态、工作区和应用是独立选项；`--all` 会选择全部四项。删除状态不等于删除配置过的工作区。服务移除失败时，相关数据范围可能被保留，并报告部分清理失败。

如果 CLI 已删除但后台服务仍在，按[官方手动移除说明](https://docs.openclaw.ai/install/uninstall)处理对应操作系统的服务，不要终止所有 Node.js 进程。

下面的附带脚本只负责范围更窄的包、进程和 Docker 资源盘点及清理，不能替代内置卸载器对服务、状态和工作区的处理。

## 自动化卸载脚本（先检查，再执行）

清理脚本默认只做 **dry-run（只读盘点）**，列出检测到的 OpenClaw 全局包、命令行明确包含 OpenClaw 的 Node.js 进程，以及当前 Docker 上下文中名称或镜像明确匹配 OpenClaw 的资源。脚本不会停止全部 Node.js 进程，也不会扫描或删除用户目录、配置文件、注册表或任意 Docker 资源。

不要使用 `curl | bash` 或 `irm | iex` 直接执行远程脚本。请先下载、核对 SHA-256、阅读内容，再运行 dry-run。确认清单无误后使用 `-Apply`/`--apply`；交互模式还会要求输入 `REMOVE OPENCLAW`。

### Windows（PowerShell）

```powershell
$scriptUrl = 'https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForWindows.ps1'
$scriptPath = Join-Path $env:TEMP 'CleanupOpenClawForWindows.ps1'
Invoke-WebRequest -Uri $scriptUrl -OutFile $scriptPath

$expectedSha256 = 'eab731bd073f42fb75569be6c1dd3af37aca3214957057241ed13072fcc40daa'
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $scriptPath).Hash.ToLowerInvariant() -ne $expectedSha256) {
    throw 'SHA-256 校验失败，请勿执行该文件。'
}

Get-Content -LiteralPath $scriptPath
& $scriptPath          # dry-run，只读盘点
& $scriptPath -Apply   # 查看同一清单并要求明确确认后执行
```

通常不需要管理员权限；只有当前安装位置或 Docker 环境本身要求提升权限时，才应使用管理员终端。`-Apply -Yes` 仅用于你已经审核过清单的受控自动化环境。

### Linux（Bash）

```bash
script_path="$(mktemp)"
curl -fL 'https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForLinux.sh' -o "$script_path"
printf '%s  %s\n' '0cfab4f8823a1644ef2e5b47275b144417c271372b7b11b795cf8c60a6689cb8' "$script_path" | sha256sum -c -

less "$script_path"
bash "$script_path"          # dry-run，只读盘点
bash "$script_path" --apply  # 要求输入 REMOVE OPENCLAW 后执行
```

### macOS（Bash）

```bash
script_path="$(mktemp)"
curl -fL 'https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForMacOS.sh' -o "$script_path"
printf '%s  %s\n' 'a7e6048a20a933e4297edfe64847afc8f5a206add153502ff6ac260be9d7a801' "$script_path" | shasum -a 256 -c -

less "$script_path"
bash "$script_path"          # dry-run，只读盘点
bash "$script_path" --apply  # 要求输入 REMOVE OPENCLAW 后执行
```

## 卸载 CLI 包并验收

处理完所选服务和数据范围后，使用当初安装它的包管理器卸载 CLI。下列命令按实际情况选择一种：

```bash
# npm 安装
npm uninstall -g openclaw

# pnpm 安装
pnpm remove -g openclaw
```

`openclaw-cn` 等第三方分支应单独确认。按实际包前缀和已审核清单处理残留，不照抄猜测的全局安装路径直接删除。随后检查原服务和命令搜索结果；仅 CLI 命令消失不能证明后台服务已经移除。

## 常见问题

- 权限不足时，先确认安装位置或 Docker 环境的实际要求，不统一使用管理员权限处理所有清理步骤。

- 找不到命令时，核对当初安装使用的 PATH 和包管理器环境；脚本清单只覆盖实际检测到的范围。

- dry-run 只报告计划，实际完成情况还要检查执行结果、剩余服务与资源。

## 官方依据

[OpenClaw 卸载范围、预览与手动服务移除](https://docs.openclaw.ai/install/uninstall)
