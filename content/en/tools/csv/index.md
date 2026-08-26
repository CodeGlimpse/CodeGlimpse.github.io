---
title: "CSV and JSON Converter"
description: "Convert CSV and JSON arrays in either direction locally in your browser."
date: 2026-08-17
layout: "page"
category: "data"
keywords: ["CSV", "JSON", "table"]
tool_related: ["json", "yaml", "diff"]
---

Convert CSV with a header row into an array of JSON objects, or convert JSON object arrays and two-dimensional arrays into CSV. Data stays in your browser.

{{< tool id="csv" >}}

### Examples and limits
`name,age\nAlice,30` converts to a JSON array containing `name` and `age`. Quoted fields and embedded line breaks are supported, but headers must be non-empty and unique; very large files are limited by browser memory. Content never leaves the browser.

### How to use

Choose the conversion direction and delimiter, paste the content, and run the conversion. Results can be copied, shared, or exported locally from the tool panel.

### Format support

- Comma, semicolon, tab, and pipe delimiters.
- Quoted fields, escaped double quotes, and line breaks inside fields.
- CSV header names must be non-empty and unique.
- The JSON root must be an array whose items are all objects or all arrays.

Large data sets can still consume significant browser memory, so work from a copy of important source data.
