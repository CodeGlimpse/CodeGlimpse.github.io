---
title: "OpenClaw 浏览器三种模式：托管、MCP 与 Chrome 扩展"
description: "区分 OpenClaw 托管浏览器、Chrome DevTools MCP 和 Chrome 扩展，按任务选择连接方式并检查结果。"
slug: openclaw-chrome
date: 2026-03-24 23:00:00+0800
categories:
    - Tutorials
tags:
    - OpenClaw
lastmod: 2026-09-07T00:00:00+08:00
series_id: openclaw
series_order: 2
tool_related: [json, diff]
---

OpenClaw 提供三种浏览器模式：隔离的 `openclaw`、基于 Chrome DevTools MCP 的 `user`，以及基于 Chrome 扩展的 `chrome`。它们主要区别在于是否复用个人登录态，以及连接时需要怎样的授权。

## 先选择连接模式

| 配置名 | 连接对象 | 适合的情况 |
| --- | --- | --- |
| `openclaw` | OpenClaw 管理的独立浏览器资料目录 | 自动化练习、测试，不需要个人浏览器登录态 |
| `user` | 通过 Chrome DevTools MCP 附加到已运行的浏览器 | 需要现有登录态，且有人在电脑前确认连接 |
| `chrome` | 通过 OpenClaw Chrome 扩展连接浏览器 | 需要现有登录态并已完成扩展安装、配对 |

独立浏览器是默认选择。两种复用登录态的方式都会扩大自动化能访问的内容，选择时应以任务需要和浏览器权限为准。

## 使用独立托管浏览器

在 Gateway 已可用的前提下：

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

这组命令可以分别核对状态、启动浏览器、打开测试网页和读取快照。仅命令退出成功，不能替代实际页面和快照结果的检查。

## 使用 `user` 连接已有 Chrome

`user` 模式要求目标 Chromium 浏览器为 **144+**，并启用远程调试。

1. 保持目标 Chrome 运行，在地址栏打开 `chrome://inspect/#remote-debugging`。
2. 在该页面启用远程调试。
3. 运行连接命令，在浏览器出现授权提示时人工确认：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

`user` 是内置配置名，无需为最简单场景手写整份配置。成功时，状态应包含 `driver: existing-session`、`transport: chrome-mcp` 和 `running: true`；标签页列表与快照还应对应实际浏览器。

Brave、Edge 或其他资料目录可能需要显式设置 `userDataDir`；已经用调试端口启动的浏览器可能需要 `cdpUrl`。这些属于不同连接条件，按[官方已有会话说明](https://docs.openclaw.ai/tools/browser#existing-session-via-chrome-devtools-mcp)配置。

## Chrome 扩展仍是支持的方式

当前官方扩展入口为：

```bash
openclaw browser extension install
```

然后依照[扩展文档](https://docs.openclaw.ai/tools/chrome-extension)完成安装、授权和配对。macOS/Linux 的本地主机引导与 Windows 的手动配对流程不同，请选择对应系统的步骤。

完成配对后，使用 `chrome` 配置检查连接：

```bash
openclaw browser --browser-profile chrome status
openclaw browser --browser-profile chrome tabs
```

## 排查顺序

- **没有 `browser` 子命令**：核对 OpenClaw 版本和浏览器插件是否启用。
- **无法附加 `user`**：核对浏览器版本、远程调试开关、授权提示和目标资料目录。
- **状态正常但看不到目标页面**：先确认使用了正确的 profile，再检查 `tabs` 返回内容。
- **扩展无法连接**：检查当前操作系统对应的安装和配对流程，不能用 MCP 的调试开关代替扩展配对。

## 官方依据

- [Browser：模式、CLI 和已有会话](https://docs.openclaw.ai/tools/browser)
- [Chrome extension：安装与配对](https://docs.openclaw.ai/tools/chrome-extension)
