---
title: "OpenClaw 2026.3.23.1 浏览器工具重构：从 Chrome 扩展转向原生 DevTools MCP"
description: "参考 OpenClaw 官方文档与 Chrome 团队最新技术，详解 2026.3.23.1 版本 browser 工具的重大升级：弃用扩展中继，全面拥抱 Chrome DevTools MCP 协议。"
slug: openclaw-chrome
date: 2026-03-24 23:00:00+0800
categories:
    - Tutorials
tags:
    - OpenClaw
---

在最新的 **2026.3.23.1** 版本中，OpenClaw 对浏览器自动化工具进行了重磅重构。

根据官方文档与 Chrome 团队的最新发布，OpenClaw 已正式从不稳定的“扩展插件中继（Extension Relay）”模式，转向了基于 **Chrome DevTools MCP (Model Context Protocol)** 的原生连接方案。这意味着 AI 现在能以更安全、更原生、更高效的方式接管你的浏览器。

---

## 核心演进：为什么不再需要插件？

在 2026.3.23.1 之前的版本中，OpenClaw 主要依靠一个手动安装的 Chrome 扩展来桥接。这种方式存在权限受限、登录态同步不稳定等问题。

新版本引入了两种核心 Profile（配置文件）模式：
1. **`openclaw` 模式**：完全隔离的托管浏览器，无需任何配置，开箱即用（橙色主题）。
2. **`user` 模式（原 `chrome` 模式升级）**：通过 **Chrome DevTools MCP** 直接附加到你当前正在使用的 Chrome 窗口，实现真正的“零插件”接管。

---

## 旧版本教程：Chrome 扩展中继 (Legacy)

如果你仍在使用旧版本，其连接逻辑依赖于扩展插件：

1. **安装扩展**：需进入 `chrome://extensions/` 开启开发者模式，手动加载 `openclaw-connector` 文件夹。
2. **ID 配置**：在 `~/.openclaw/openclaw.json`（或旧版 YAML）中填入插件生成的唯一 ID。
3. **手动点击**：每次任务开始前，用户必须在浏览器中点击插件图标，手动允许 AI 连接到当前标签页。

---

## 新版本教程：DevTools MCP 远程调试 (推荐)

在 **2026.3.23.1** 中，连接你的原生浏览器（Profile: `user`）不再需要插件，而是利用 Chrome 144+ 内置的远程调试能力。

### 第一步：在 Chrome 中开启远程调试
不再需要繁琐的命令行参数，现在可以通过 Chrome 内部设置开启：
1. 在 Chrome 地址栏输入 `chrome://inspect/#remote-debugging`。
2. 勾选 **"Enable remote debugging"**。
3. 按照提示允许传入的调试连接。

### 第二步：配置 OpenClaw 使用 `user` 配置文件
OpenClaw 的配置现在统一在 `~/.openclaw/openclaw.json` 中。要启用原生接管，请确保配置如下：

```json
{
  "browser": {
    "enabled": true,
    "defaultProfile": "user",
    "profiles": {
      "user": {
        "driver": "existing-session",
        "attachOnly": true,
        "color": "#00AA00"
      }
    }
  }
}
```

### 第三步：授权连接
当你第一次运行 `openclaw tool run browser` 时，Chrome 顶部会弹出授权对话框。
- 点击 **"Allow"**（允许）。
- 此时 Chrome 会显示“Chrome 正受到自动测试软件的控制”横幅，表示 AI 已成功接管。

---

## 关键技术点对比

| 特性 | 旧版 (Extension) | 新版 (DevTools MCP) |
| :--- | :--- | :--- |
| **连接协议** | 扩展 API 转发 | **原生 CDP / MCP 协议** |
| **认证方式** | 插件 ID 校验 | **Chrome 系统级弹窗授权** |
| **登录态共享** | 需插件介入同步 | **原生共享现有 Session** |
| **安全性** | 插件可能存在注入风险 | **基于 Chrome 内置安全沙箱** |
| **系统要求** | 任意 Chrome 版本 | **Chrome M144 或更高版本** |

---

## 升级建议与注意事项

1. **版本要求**：原生 MCP 模式需要 **Chrome M144 (Beta/Canary)** 或更高版本。如果你使用的是稳定版 Chrome 且版本较低，建议继续使用 `openclaw` 托管模式。
2. **配置文件路径**：OpenClaw 的配置已从 `config.yaml` 转向更加标准化的 `~/.openclaw/openclaw.json`。
3. **隐私提示**：使用 `user` 模式时，AI 可以访问你已登录的所有页面（如 GitHub、Gmail）。在执行自动化任务时，请确保你信任该智能体。

---