---
title: "如何彻底卸载 OpenClaw 小龙虾"
date: 2026-03-18T17:22:00+08:00
draft: false
description: "本文提供了在 Windows、Linux 和 macOS 系统上彻底卸载 OpenClaw 的详细步骤和自动化脚本。"
categories: ["教程"]
tags: ["OpenClaw", "卸载", "清理"]
---

OpenClaw 小龙虾，一个最近爆火的AI代理，它的安装和使用都非常方便。然而，在最近的新闻中我们同时也发现，这款工具有很大的安全风险，可能并不适合企业环境或者包含个人隐私的计算机中。但是，由于OpenClaw 小龙虾的安装方式与常规软件并不相同，所以我们可能并不是很轻易地就可以将其卸载，本文将提供详细的操作指南来教会大家卸载小龙虾。

我们将针对不同的操作系统（Windows, Linux, macOS）提供手动卸载步骤以及推荐的自动化清理脚本。

## 自动化卸载脚本（推荐）

为了简化卸载过程，我们编写了针对各平台的自动化清理脚本。这些脚本会自动检测 Node.js 环境、停止相关进程并清理全局包。

### Windows (PowerShell)

以管理员权限打开 PowerShell，然后执行以下命令：
   ```powershell
   irm https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForWindows.ps1 | iex
   ```

### Linux (Bash)

打开终端，然后执行以下命令：
   ```bash
   curl -sSL https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForLinux.sh | bash
   ```

### macOS (Bash)

打开终端，然后执行以下命令：
   ```bash
   curl -sSL https://blog.codeglimpse.top/post/openclaw-uninstall/CleanupOpenClawForMacOS.sh | bash
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