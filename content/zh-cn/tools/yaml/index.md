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

支持 YAML 1.2 中可表示为 JSON 的字符串键映射、数组、字符串、有限数字、布尔值和 null，包括嵌套结构与空数组、空对象。转换保留数据值，不保留注释和原有排版。

重复键、锚点、别名、显式标签、多文档、非字符串键和非有限数字会报错。超出 JavaScript 安全整数范围的数字也会报错；需要精确保留的大整数请加引号作为字符串输入。

### 使用说明

- YAML 转 JSON 后会输出缩进后的 JSON。
- JSON 转 YAML 会保留对象、数组、null 和空集合。
- 输入只在浏览器本地解析。
