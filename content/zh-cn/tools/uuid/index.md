---
title: "UUID 生成与校验工具"
description: "使用安全随机数批量生成 UUID v4，并校验 RFC 9562 UUID。"
date: 2026-08-17
layout: "page"
---

UUID 常用于数据库主键、请求标识和分布式系统对象标识。本工具使用浏览器加密随机数生成 UUID v4，并可检查 UUID 格式和版本。

{{< tool id="uuid" >}}

### 功能说明

- 一次生成 1 至 100 个 UUID v4。
- 校验 RFC 9562 格式并识别版本号。
- 支持 Nil UUID（全零）和 Max UUID（全 F）。

随机 UUID 可以显著降低冲突概率，但业务唯一性仍应由数据库约束或服务端逻辑保证。
