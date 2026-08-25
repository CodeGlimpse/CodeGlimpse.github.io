---
title: "JSONPath 查询工具"
description: "使用 JSONPath 表达式从 JSON 数据中筛选和查看结果。"
date: 2026-08-25
layout: "page"
category: "data"
keywords: ["JSONPath", "JSON", "查询", "筛选"]
tool_related: ["json", "yaml"]
---

JSONPath 工具可以从嵌套 JSON 中查询属性、数组索引和通配符结果。

{{< tool id="jsonpath" >}}

### 示例与限制

支持 $、点号属性、数组索引、括号属性和 * 通配符；暂不支持递归下降和过滤表达式。数据只在浏览器本地处理。

### 使用说明

- 使用 $.users[*].name 查询数组中所有用户名称。
- 查询结果包含匹配路径和值。
- 无效 JSON 或表达式会显示错误提示。
