---
title: "Text Analyzer and Converter"
description: "Count characters, words, lines, and UTF-8 bytes, then apply common text transforms."
date: 2026-08-17
layout: "page"
category: "text"
keywords: ["text", "statistics", "transform"]
tool_related: ["diff", "markdown"]
---

Analyze character, non-whitespace character, word, line, and UTF-8 byte counts while applying common case and whitespace transformations.

{{< tool id="text" >}}

### Examples and limits
For `hello world\n你好`, the tool reports two lines and fourteen characters; title case produces `Hello World\n你好`. Word counts depend on browser language segmentation, and very large text is limited by browser memory. Content stays local.

### Available transforms

- Uppercase, lowercase, title case, and sentence case.
- Trim whitespace from every line.
- Collapse repeated spaces and excessive blank lines.

Word counting uses the browser's language segmentation support. Results for mixed-language text can vary slightly between browser engines and locales.
