---
title: "JWT 解析器"
description: "在浏览器本地解析 JWT Header、Payload 和时间声明。"
date: 2026-08-17
layout: "page"
category: "security"
keywords: ["JWT", "令牌", "Token"]
tool_related: ["json", "base64"]
---

JWT 解析器可以读取令牌中的 Header、Payload 以及 `iat`、`nbf`、`exp` 时间声明。令牌只在浏览器本地处理。

{{< tool id="jwt" >}}

### 示例与限制
输入 `eyJhbGciOiJub25lIn0.eyJzdWIiOiI0MiJ9.` 可以读取 Header 和 Payload；工具只解析三段结构，不验证签名。令牌内容可能包含敏感信息，请勿粘贴生产令牌；数据仅在浏览器本地处理。

### 安全边界

本工具**不验证 JWT 签名**。成功解析仅代表令牌格式可读取，不能证明签发者、内容真实性或访问权限。认证和授权场景必须由服务端使用可信密钥、允许的算法及完整验证规则处理。

### 时间状态

- `iat`：令牌签发时间。
- `nbf`：令牌在该时间之前不应生效。
- `exp`：令牌在该时间之后视为过期。
