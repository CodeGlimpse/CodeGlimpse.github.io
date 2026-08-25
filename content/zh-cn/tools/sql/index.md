---
title: "SQL 格式化工具"
description: "在线格式化和压缩常见 SQL 查询语句。"
date: 2026-08-25
layout: "page"
category: "development"
keywords: ["SQL", "数据库", "格式化", "查询"]
tool_related: ["json", "diff"]
---

SQL 工具适合快速整理 SELECT、JOIN、WHERE、GROUP BY 和 ORDER BY 查询。

{{< tool id="sql" >}}

### 示例与限制

工具进行轻量级 SQL 词法格式化，不连接数据库，也不验证具体数据库方言。输入只在浏览器本地处理。

### 使用说明

- 格式化会按子句和逻辑条件换行。
- 压缩会移除多余空白。
- 字符串和注释内容会尽量保持原样。
