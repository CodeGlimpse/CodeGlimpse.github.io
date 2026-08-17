---
title: "JWT Decoder"
description: "Decode JWT headers, payloads, and time claims locally in your browser."
date: 2026-08-17
layout: "page"
---

The JWT decoder reads the Header, Payload, and the `iat`, `nbf`, and `exp` time claims. Tokens are processed only in your browser.

{{< tool id="jwt" >}}

### Security boundary

This tool **does not verify JWT signatures**. A successful decode only confirms that the token content is readable; it does not establish the issuer, authenticity, or permissions. Authentication and authorization must be validated by a trusted server with approved algorithms and keys.

### Time claims

- `iat` records when the token was issued.
- `nbf` indicates when the token becomes active.
- `exp` indicates when the token expires.
