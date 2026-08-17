---
title: "HTML Entity Encoder/Decoder"
description: "Encode HTML-sensitive characters and decode common named and numeric entities."
date: 2026-08-17
layout: "page"
---

HTML entities safely represent tag delimiters, quotes, and characters that are difficult to enter directly. Results are displayed as text and are never executed as HTML.

{{< tool id="html" >}}

### Supported scope

- Encode `&`, `<`, `>`, double quotes, and single quotes.
- Optionally encode every non-ASCII character as a hexadecimal numeric entity.
- Decode numeric entities and common named entities such as `amp`, `lt`, `gt`, `quot`, `nbsp`, and `copy`.

Unknown named entities remain unchanged. This text converter does not replace context-aware server-side escaping or a content security policy.
