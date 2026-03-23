---
title: Complete Guide to OpenClaw Installation and Configuration
description: A comprehensive guide on how to install and configure OpenClaw, the open-source personal AI assistant.
slug: openclaw-install
date: 2026-03-23 22:00:00+0800
categories:
    - Tutorials
tags:
    - OpenClaw
---

# Complete Guide to OpenClaw Installation and Configuration

OpenClaw is a personal AI assistant platform designed to run on your own devices. It integrates seamlessly with your favorite chat channels (such as WhatsApp, Telegram, Slack, Discord, etc.), providing a unified and "always-on" AI experience. This guide will walk you through the complete installation and configuration process.

## Prerequisites

Before installing OpenClaw, please ensure your system meets the following requirements:

- **Node.js**: Node 24 is highly recommended. Node 22.16+ is also supported.
- **Operating System**: macOS, Linux, or Windows (WSL2 is strongly recommended for stability).
- **Model API Keys**: You need API keys from providers like Anthropic, OpenAI, or Google.
- **Network**: A stable internet connection for downloading packages and communicating with AI models.

## Installation Methods

OpenClaw offers multiple installation methods. Choose the one that best fits your technical preference.

### 1. Recommended: Installation Script (Fastest)

The installation script automatically detects your OS, installs Node if necessary, and guides you through the initialization.

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
**openclaw-cn (Ensure Git is installed):**
```powershell
iwr -useb https://open-claw.org.cn/install-cn.ps1 | iex
```

### 2. Manual Installation via npm or pnpm

If you prefer managing your Node environment manually, you can install the OpenClaw CLI globally.

#### Using npm
```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

#### Using pnpm
```bash
pnpm add -g openclaw@latest
pnpm approve-builds -g
openclaw onboard --install-daemon
```

### 3. Source Installation (For Developers)

If you want to contribute or run from the local codebase:

**openclaw**
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

**openclaw-cn (using Gitee and npmmirror):**
```bash
git clone https://gitee.com/OpenClaw-CN/openclaw-cn.git
cd openclaw-cn
pnpm config set registry https://registry.npmmirror.com/ # Set registry mirror
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

## Initialization and Configuration (Onboarding)

After installation, the most important step is running the onboarding wizard. It will configure your workspace, gateway, and initial AI models.

```bash
openclaw onboard --install-daemon
```

The wizard will prompt you to:
1. **Select Model Provider**: Choose between Anthropic, OpenAI, Google, etc.
2. **Enter API Key**: Provide the API key for your chosen provider.
3. **Install Daemon**: Install OpenClaw as a system service (recommended) to keep it running in the background.

## Verifying Installation

To ensure everything is running correctly, use the following commands:

```bash
openclaw doctor         # Check for configuration issues
openclaw status         # Check Gateway status
openclaw dashboard      # Open the browser UI
```