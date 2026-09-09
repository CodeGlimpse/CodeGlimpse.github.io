---
title: "OpenClaw 装好了却用不了：从运行时到 Gateway 排查"
description: "从一次 Node.js 版本拦截的实际输出出发，分层检查 OpenClaw 命令、Gateway、模型请求与浏览器连接。"
slug: openclaw-troubleshooting
date: 2026-09-09T00:01:00+08:00
categories: [Tutorials]
tags: [OpenClaw]
series_id: openclaw
series_order: 3
tool_related: [json, diff]
---

“安装完成”和“可以完成一次任务”之间，还有运行时、Gateway、认证和浏览器连接几个环节。把失败定位到具体环节，才能选对下一步。

## 先排除命令与运行时问题

在 Windows PowerShell 中检查：

```powershell
Get-Command node, npm, openclaw -All
node --version
openclaw --version
```

命令找不到时，先确认安装方式、命令所在目录和当前终端的 PATH。CLI 能被找到后，还要检查运行它的 Node.js 是否符合所用版本的要求。

本机的 Node.js 是 `v22.13.1`。在隔离目录运行 **OpenClaw 2026.9.2 发布包的启动器**时，`--version` 就被以下检查拦住了，退出码为 1：

```text
openclaw: Node.js >=22.22.3 <23, >=24.15.0 <25, or >=25.9.0 is required (current: v22.13.1).
```

这次复现只运行了发布包的启动器和运行时检查，没有进行全局安装或启动 Gateway。它说明：**同样叫 Node 22，也不代表满足最低补丁版本。** 此时还没进入模型认证或浏览器配对阶段，修改那些配置不会解决这个报错。

2026.9.2 的包元数据和启动器都规定了上述范围。处理时按所用 OpenClaw 版本的要求选受支持的 Node，然后重新检查 `node --version` 与 `openclaw --version`。具体安装入口见[安装与配置]({{< relref "post/openclaw-install" >}})。

## CLI 可以运行，再检查 Gateway

下面是 CLI 已经可以执行时的排查步骤，不是上面这台实验环境的成功输出。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

`logs --follow` 会持续输出日志，看完后用 Ctrl+C 退出。官方排障文档将 `Runtime: running`、`Connectivity probe: ok` 和 `Capability: ...` 列为应关注的 Gateway 信息。字段会随版本变化，要结合完整错误判断。

| 现象 | 优先检查 |
| --- | --- |
| 服务没有运行 | 服务安装方式、启动日志和运行账户 |
| `ECONNREFUSED` / connection refused | 目标地址与端口，以及对应服务是否监听 |
| 服务运行，但连接探测失败 | 地址、端口、认证及相关错误；不要把“进程存在”当成连通成功 |
| 终端 CLI 与后台服务表现不同 | 两者使用的 OpenClaw/Node 路径、版本和配置来源是否一致 |

`openclaw doctor` 可以提供诊断信息。遇到修复、迁移或重启提示时，先读清楚将改变什么；`doctor --fix` 和 `gateway restart` 是会修改状态的操作，应在问题范围明确后使用。

## 模型请求与浏览器连接分别验证

Gateway 可连接，仍不等于模型请求成功。选择你自己的模型配置完成一次不含敏感内容的简单请求，再依据日志区分认证失败、提供商配额、模型名称或网络问题。401、403、429 应结合具体提供商的错误正文解释。

浏览器连接则按任务选择资料目录与连接模式：

```bash
openclaw browser --browser-profile openclaw status
```

上面检查的是独立托管浏览器。需要复用现有登录态时，按[浏览器三种模式]({{< relref "post/openclaw-chrome" >}})选择 `user` 或 `chrome` 并完成各自授权。网页能打开、扩展已安装、附加到正确标签页是不同的检查点。

## 记录足够的信息再反馈

保留系统与版本、运行命令、实际地址的非敏感部分、错误时间和对应日志片段。删除令牌、密钥、Cookie 和个人会话内容。

普通 JSON 示例可用[JSON 工具](/tools/json/)检查；两份经过脱敏的示例可用[文本 Diff](/tools/diff/)比较。OpenClaw 的完整配置可能是 JSON5，应使用其自身诊断功能，不用普通 JSON 格式化器改写完整配置。

## 参考

- [OpenClaw 官方排障指南](https://docs.openclaw.ai/gateway/troubleshooting)
- [安装与运行时要求](https://docs.openclaw.ai/install)
- [浏览器模式](https://docs.openclaw.ai/tools/browser)
- [OpenClaw 2026.9.2 包信息](https://www.npmjs.com/package/openclaw/v/2026.9.2)
