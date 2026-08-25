---
title: "YAML 与 JSON 转换工具"
description: "在浏览器本地进行 YAML 与 JSON 的双向转换。"
date: 2026-08-25
layout: "page"
category: "data"
keywords: ["YAML", "JSON", "配置", "转换"]
tool_related: ["json", "csv"]
---

YAML 与 JSON 转换工具适合整理配置文件和接口样例，数据不会离开浏览器。

{{< tool id="yaml" >}}

### 示例与限制

支持常见的映射、数组、字符串、数字、布尔值和 null。复杂 YAML 特性如锚点、标签和多文档暂不支持。

### 使用说明

- YAML 转 JSON 后会输出缩进后的 JSON。
- JSON 转 YAML 会保留对象和数组结构。
- 输入只在浏览器本地解析。
