---
title: "JWT Decoder"
description: "Decode JWT headers, payloads, and time claims locally in your browser."
date: 2026-08-17
layout: "page"
category: "security"
keywords: ["JWT", "token", "claims"]
tool_related: ["json", "base64"]
---

The JWT decoder reads the Header, Payload, and the `iat`, `nbf`, and `exp` time claims. Tokens are processed only in your browser.

{{< tool id="jwt" >}}

### Examples and limits
`eyJhbGciOiJub25lIn0.eyJzdWIiOiI0MiJ9.` can be decoded to inspect its header and payload; the three-part structure is parsed but the signature is not verified. Tokens may contain sensitive data, so avoid pasting production tokens. Processing is local to the browser.

### How to use

Paste a JWT and run the decoder to inspect its structure and time claims. URL sharing is disabled for this tool so token content does not enter a link; use a local snapshot only when you can protect the file.

### Security boundary

This tool **does not verify JWT signatures**. A successful decode only confirms that the token content is readable; it does not establish the issuer, authenticity, or permissions. Authentication and authorization must be validated by a trusted server with approved algorithms and keys.

### Time claims

- `iat` records when the token was issued.
- `nbf` indicates when the token becomes active.
- `exp` indicates when the token expires.
