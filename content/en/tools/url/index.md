---
title: "URL Encoder/Decoder"
description: "Encode and decode URL components online with Unicode and form-space support."
date: 2026-08-17
layout: "page"
category: "encoding"
keywords: ["URL", "URI", "encode"]
tool_related: ["base64", "jwt"]
---

URL encoding converts spaces, Unicode text, and reserved characters into percent-escaped values suitable for URL parameters. Processing happens locally in your browser.

{{< tool id="url" >}}

### Examples and limits
In normal mode, `hello world+code` becomes `hello%20world%2Bcode`; form mode uses `+` for spaces and produces `hello+world%2Bcode`. Component mode does not parse a complete URL, malformed percent escapes are rejected, and input is not uploaded.

### How to use it

- **Encode** converts plain text into a URL component.
- **Decode** restores percent escapes such as `%E4%BD%A0` to text.
- **Form mode** converts spaces to `+` when encoding and treats `+` as a space when decoding.

The result is intended for an individual path segment or query parameter value. Structural characters in a complete URL should be handled according to their role.
