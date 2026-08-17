---
title: "URL Encoder/Decoder"
description: "Encode and decode URL components online with Unicode and form-space support."
date: 2026-08-17
layout: "page"
---

URL encoding converts spaces, Unicode text, and reserved characters into percent-escaped values suitable for URL parameters. Processing happens locally in your browser.

{{< tool id="url" >}}

### How to use it

- **Encode** converts plain text into a URL component.
- **Decode** restores percent escapes such as `%E4%BD%A0` to text.
- **Form mode** converts spaces to `+` when encoding and treats `+` as a space when decoding.

The result is intended for an individual path segment or query parameter value. Structural characters in a complete URL should be handled according to their role.
