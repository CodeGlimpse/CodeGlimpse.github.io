---
title: "Secure Password Generator"
description: "Generate configurable passwords in batches with browser cryptographic randomness."
date: 2026-08-17
layout: "page"
category: "security"
keywords: ["password", "random", "security"]
tool_related: ["uuid", "sha"]
---

Generate random passwords based on length and selected character classes. Randomness comes from the browser's cryptographic API, and results are not uploaded or stored.

{{< tool id="password" >}}

### Examples and limits
With length `16` and upper-case, lower-case, and numeric classes enabled, the tool generates batches that satisfy the selected pool. Length is limited to 8-128 and batch count to 1-20; generation stops if the browser lacks cryptographic randomness. Passwords are shown only in the current page, so save them with a password manager.

### How to use

Choose the length, count, and character classes, then generate. Passwords are not uploaded or saved by the site. URL sharing is disabled for this tool, and exported snapshots should be treated as sensitive files.

### Recommendations

- Use a unique password for every account and prefer a length of at least 16 characters.
- Keep several character classes enabled, or increase length when reducing the character pool.
- Store passwords in a trusted password manager and avoid sending them through plain-text chat, email, or screenshots.

The displayed entropy is an estimate based on pool size. It does not represent a site's password policy or the complete security of an account.
