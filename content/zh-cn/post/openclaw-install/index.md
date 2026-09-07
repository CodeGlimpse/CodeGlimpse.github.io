---
title: "OpenClaw 安装与配置：环境检查与验收"
description: "按官方资料检查 Node.js 与包管理器要求，选择安装方式、初始化并验证 OpenClaw Gateway。"
slug: openclaw-install
date: 2026-03-23 22:00:00+0800
categories:
    - Tutorials
tags:
    - OpenClaw
lastmod: 2026-09-07T00:00:00+08:00
review_date: "2026-09-07"
review_scope: "已对照官方安装资料；Node.js 与包管理器要求见正文，未在全新系统重新安装验证。"
series_id: openclaw
series_order: 1
tool_related: [json, diff]
---

OpenClaw 可以在自己的设备上运行 Gateway，并连接聊天渠道和模型服务。本篇按“检查环境 → 选择安装方式 → 初始化 → 验收”的顺序整理官方 CLI 流程。

## 先检查适用环境

截至资料复核日，官方安装页列出的 Node.js 范围为 **22.22.3+、24.15+ 或 25.9+，推荐 Node 26**。不能把旧文中的“Node 22.16+”继续当作当前要求。官方已提供原生 Windows Hub、PowerShell CLI 和 WSL2 等 Windows 路径；这里主要介绍 CLI。

先记录实际版本，再选用对应命令：

```bash
node --version
npm --version
```

模型认证方式取决于提供商。按照初始化向导在自己的设备上完成认证，不把密钥写进截图、分享链接或问题报告。安装器、初始化和守护进程步骤会改变本机环境。

## 方式一：通过包管理器安装

使用 **npm 12 或 npm 11.16+** 时，官方当前命令显式允许 OpenClaw 自身的安装脚本：

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
```

**npm 11.15 及更早版本**不支持上述选项，使用：

```bash
npm install -g openclaw@latest
```

如果使用 pnpm，当前官方全局安装方式为：

```bash
pnpm add -g --allow-build=openclaw openclaw@latest
```

`pnpm approve-builds -g` 不是当前支持的全局安装流程。`latest` 会变化；需要复现时，应先确认具体发布版本，再将其替换为明确版本号并记录 Node、包管理器和操作系统版本。

## 方式二：使用官方安装脚本

脚本可能安装或切换 Node.js、安装 OpenClaw 并启动向导。先下载并阅读，再决定是否执行；有发布方校验信息时一并核对。

### macOS / Linux / WSL2

```bash
installer_path="$(mktemp)"
curl -fL https://openclaw.ai/install.sh -o "$installer_path"
less "$installer_path"
# 审阅完成后执行
bash "$installer_path"
```

### Windows PowerShell

```powershell
$installerPath = Join-Path $env:TEMP 'openclaw-install.ps1'
Invoke-WebRequest -Uri 'https://openclaw.ai/install.ps1' -OutFile $installerPath
Get-Content -LiteralPath $installerPath
# 审阅完成后执行
& $installerPath
```

第三方分支、国内镜像与官方发行版可能在包名、配置和版本上不同。本次只复核官方 OpenClaw；原文中的 `openclaw-cn` 安装步骤不再与官方步骤混用。源码构建请按[官方安装页](https://docs.openclaw.ai/install)对应版本的 pnpm 要求操作。

## 初始化和验收

如果安装器尚未运行初始化向导：

```bash
openclaw onboard --install-daemon
```

该命令会配置模型、Gateway 和后台启动方式。完成后分别检查 CLI 和服务：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
openclaw dashboard
```

`doctor` 是诊断入口，某些版本可能提示迁移或修复配置；先阅读输出再接受变更。能输出版本号不等于 Gateway 已运行，打开 Dashboard 也不等于已经完成一次模型请求。

## 常见失败与下一步

- **找不到 `openclaw`**：重新打开终端，检查 `npm prefix -g` 和命令搜索路径，确认使用的是安装时的 Node 环境。
- **安装脚本未获允许**：先核对 npm/pnpm 版本和上面的许可选项，不要批量允许不认识的包。
- **Gateway 未运行**：查看 `openclaw gateway status` 的服务与连接信息，再按官方排障页定位。

下一篇介绍浏览器的三种连接方式。普通 JSON 示例可以用本站 [JSON 工具]({{< relref "tools/json" >}})检查语法；完整 JSON5 配置仍应由 OpenClaw 自身诊断。

## 官方依据

- [安装与系统要求](https://docs.openclaw.ai/install)
- [入门与初始化](https://docs.openclaw.ai/start/getting-started)
- [版本发布记录](https://github.com/openclaw/openclaw/releases)
