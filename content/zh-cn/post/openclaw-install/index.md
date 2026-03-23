---
title: OpenClaw 安装与配置完全指南
description: 全面介绍如何安装和配置 OpenClaw，这款开源的个人 AI 助手。
slug: openclaw-install
date: 2026-03-23 22:00:00+0800
categories:
    - Tutorials
tags:
    - OpenClaw
---

# OpenClaw 安装与配置完全指南

OpenClaw 是一款旨在运行在用户自有设备上的个人 AI 助手平台。它能与你常用的聊天频道（如 WhatsApp、Telegram、Slack、Discord 等）无缝集成，提供统一且“永不离线”的 AI 体验。本指南将带你完成完整的安装和配置过程。

## 前置条件

在安装 OpenClaw 之前，请确保你的系统满足以下要求：

- **Node.js**: 强烈推荐 Node 24 版本。Node 22.16+ 版本也可支持。
- **操作系统**: macOS、Linux 或 Windows（为了稳定性，强烈推荐使用 WSL2）。
- **模型 API 密钥**: 你需要准备好来自 Anthropic、OpenAI 或 Google 等提供商的 API 密钥。
- **网络**: 稳定的互联网连接，用于下载软件包以及与 AI 模型通信。

## 安装方法

OpenClaw 提供了多种安装方式，你可以根据自己的技术偏好进行选择。

### 1. 推荐方式：安装脚本（最快）

安装脚本会自动检测你的操作系统，根据需要安装 Node，并引导你完成初始化过程。

#### macOS / Linux / WSL2
**openclaw**
```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```
**openclaw-cn**
```bash
curl -fsSL https://open-claw.org.cn/install-cn.sh | bash
```

#### Windows (PowerShell)
**openclaw**
```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```
**openclaw-cn**(安装脚本不会在Windows原生环境自动下载Git，请确保已安装Git)
```powershell
iwr -useb https://open-claw.org.cn/install-cn.ps1 | iex

```

### 2. 通过 npm 或 pnpm 手动安装

如果你更喜欢自己管理 Node 环境，可以全局安装 OpenClaw CLI。

#### 使用 npm
```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

#### 使用 pnpm
```bash
pnpm add -g openclaw@latest
pnpm approve-builds -g
openclaw onboard --install-daemon
```

### 3. 源码安装（针对开发者）

如果你想参与贡献或从本地代码库运行：
**openclaw**
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```
**openclaw-cn**
```bash
git clone https://gitee.com/OpenClaw-CN/openclaw-cn.git
cd openclaw-cn
pnpm config set registry https://registry.npmmirror.com/ # 配置国内镜像
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

## 初始化与配置 (Onboarding)

安装完成后，最重要的步骤是运行初始化向导。它将配置你的工作区、网关以及初始 AI 模型。

```bash
openclaw onboard --install-daemon
```

向导会提示你：
1. **选择模型提供商**: 在 Anthropic、OpenAI、Google 等之间进行选择。
2. **输入 API 密钥**: 输入对应提供商的 API 密钥。
3. **安装守护进程 (Daemon)**: 将 OpenClaw 安装为系统服务（推荐），使其在后台持续运行。

## 验证安装

要确保一切正常运行，请使用以下命令：

```bash
openclaw doctor         # 检查配置问题
openclaw status         # Gateway 网关状态
openclaw dashboard      # 打开浏览器 UI
```