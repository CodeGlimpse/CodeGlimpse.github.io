---
title: "如何彻底卸载 OpenClaw 小龙虾"
date: 2026-03-18T17:22:00+08:00
draft: false
description: "本文提供了在 Windows、Linux 和 macOS 系统上彻底卸载 OpenClaw 的详细步骤和自动化脚本。"
categories:
    - Tutorials
tags:
    - OpenClaw
---

OpenClaw 小龙虾，一个最近爆火的AI代理，它的安装和使用都非常方便。然而，在最近的新闻中我们同时也发现，这款工具有很大的安全风险，可能并不适合企业环境或者包含个人隐私的计算机中。但是，由于OpenClaw 小龙虾的安装方式与常规软件并不相同，所以我们可能并不是很轻易地就可以将其卸载，本文将提供详细的操作指南来教会大家卸载小龙虾。

我们将针对不同的操作系统（Windows, Linux, macOS）提供手动卸载步骤以及推荐的自动化清理脚本。

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

## 手动卸载步骤

如果你更倾向于手动操作，请按照以下步骤进行：

### 1. 停止相关进程
确保没有任何 OpenClaw 相关的 Node.js 进程正在运行。你可以通过任务管理器（Windows）或 `top`/`ps` 命令（Linux/macOS）查找并终止它们。

### 2. 卸载全局包
使用你常用的包管理器执行卸载命令：

```bash
# 使用 npm
npm uninstall -g openclaw openclaw-cn

# 使用 pnpm
pnpm uninstall -g openclaw openclaw-cn
```

### 3. 清理残留文件
检查以下路径并删除与 OpenClaw 相关的文件夹：
- **Windows**: `C:\Users\<YourUsername>\AppData\Roaming\npm\node_modules\openclaw`
- **Linux/macOS**: `/usr/local/lib/node_modules/openclaw` 或 `~/.npm-global/lib/node_modules/openclaw`

## 常见问题解答

**Q: 运行脚本时提示权限不足？**
A: 请确保在 Windows 上使用管理员权限运行，在 Linux/macOS 上使用 `sudo`（如果需要）。

**Q: 脚本没有找到 Node.js 怎么办？**
A: 请确保 Node.js 已正确安装在你的 PATH 环境变量中。脚本会尝试自动查找常见的安装路径（如 NVM 安装路径）。

---

希望这篇指南能帮助你顺利完成 OpenClaw 的卸载工作。
