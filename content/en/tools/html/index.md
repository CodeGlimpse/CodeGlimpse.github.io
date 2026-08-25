---
title: "HTML Entity Encoder/Decoder"
description: "Encode HTML-sensitive characters and decode common named and numeric entities."
date: 2026-08-17
layout: "page"
---

HTML entities safely represent tag delimiters, quotes, and characters that are difficult to enter directly. Results are displayed as text and are never executed as HTML.

{{< tool id="html" >}}

### Examples and limits
Encoding `<strong>Tom & Jerry</strong>` produces `&lt;strong&gt;Tom &amp; Jerry&lt;/strong&gt;`, and the result is always displayed as text rather than executed. Common named and numeric entities are supported; unknown entities remain unchanged and input is processed locally.

### Supported scope

- Encode `&`, `<`, `>`, double quotes, and single quotes.
- Optionally encode every non-ASCII character as a hexadecimal numeric entity.
- Decode numeric entities and common named entities such as `amp`, `lt`, `gt`, `quot`, `nbsp`, and `copy`.

Unknown named entities remain unchanged. This text converter does not replace context-aware server-side escaping or a content security policy.
