---
title: "JSON Formatter"
description: "Format, minify, validate, escape, and unescape JSON directly in your browser."
date: 2026-08-13T00:00:00+08:00
layout: "page"
category: "data"
keywords: ["JSON", "format", "validate"]
tool_related: ["yaml", "jsonpath", "csv"]
---

The JSON formatter helps you format and validate JSON data. It can also escape JSON text for embedding inside a string and restore escaped text to its original form.

{{< tool id="json" >}}

### Examples and limits
Formatting `{"name":"Alice","items":[1,true]}` produces readable multi-line JSON using the selected indentation. Invalid JSON reports a parse error; escape and unescape operate on text and never execute it. Everything is processed locally.

### How to use

- **Format**: Validate the JSON and output readable multi-line text using the selected indentation.
- **Minify**: Remove unnecessary whitespace and output compact JSON.
- **Validate**: Check whether the JSON is valid without changing the result.
- **Escape**: Escape quotes, backslashes, and control characters so JSON can be embedded in another JSON string.
- **Unescape**: Restore escaped text to the original JSON text.

All processing happens locally in your browser. Your JSON is not uploaded.
