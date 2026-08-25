---
title: "Regular Expression Tester"
description: "Test JavaScript regular expressions, capture groups, and replacements online."
date: 2026-08-17
layout: "page"
---

Inspect JavaScript regular expression matches, positions, capture groups, and replacement previews. Expressions run in an isolated Worker and are stopped when they exceed the time limit.

{{< tool id="regex" >}}

### Examples and limits
Pattern `(\\w+)=(\\d+)` applied to `a=1` with replacement `$1:[$2]` produces `a:[1]`. JavaScript regular-expression syntax is used; pattern, input, and result counts are bounded, and the Worker stops timed-out runs. Test text is not uploaded.

### Supported flags

- `g` global matching
- `i` case-insensitive matching
- `m` multiline mode
- `s` dot-all mode
- `u` Unicode mode
- `y` sticky matching

The tool limits pattern length, input size, and match count. The timeout reduces page-freeze risk, but production systems should still avoid unrestricted complex expressions from untrusted users.
