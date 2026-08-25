---
title: "JSONPath Query"
description: "Filter and inspect JSON values with JSONPath expressions."
date: 2026-08-25
layout: "page"
category: "data"
keywords: ["JSONPath", "JSON", "query", "filter"]
tool_related: ["json", "yaml"]
---

The JSONPath tool queries nested JSON properties, array indexes, and wildcard results locally in the browser.

{{< tool id="jsonpath" >}}

### Examples and limits

Supported syntax includes $, dot properties, array indexes, bracket properties, and the * wildcard. Recursive descent and filter expressions are not supported.

### Usage

- Use $.users[*].name to query every user name.
- Results include the matching path and value.
- Invalid JSON or expressions show an inline error.
