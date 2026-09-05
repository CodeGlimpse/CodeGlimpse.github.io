---
title: Privacy
slug: privacy
date: 2026-09-04T00:00:00+08:00
description: How CodeGlimpse processes browser-local tool data, site analytics, and Clarity masking.
comments: false
---

# Privacy

Last updated: 2026-09-04

CodeGlimpse is a static blog and browser-tool site. The online tools perform their main calculations in your current browser; the site does not provide accounts, server-side workspaces, or cloud storage.

## Tool inputs and local data

- JSON, text, regular expressions, SQL, JWTs, passwords, and similar content are processed by browser-side scripts.
- Tool inputs, outputs, passwords, JWTs, private keys, and local presets are not sent as analytics events.
- Favorites, recent tools, and presets are stored only in this browser's `localStorage`.
- Sharing puts ordinary-tool input into a URL fragment; never put passwords, JWTs, private keys, or other sensitive data in a share link.
- JWT and password tools do not generate share links by default.

## Site analytics

The site loads these third-party analytics services by default to understand visits and overall interaction quality:

- Google Analytics 4: page views, language, and general device/referrer information.
- Baidu Analytics: page views and referrer information.
- Microsoft Clarity: interaction and usability analysis.

Analytics scripts are not given tool inputs or custom events containing complete text. Tool forms, result areas, share panels, and JWT/password containers carry explicit Clarity masking markers; the Clarity project settings must also keep “mask all input and sensitive text” enabled.

The site does not send passwords, JWTs, private keys, complete text, tool results, local presets, or `#cgshare=` share content in analytics events. Page analytics use a path without query parameters or fragments.

## Disable analytics

You can choose “Disable analytics” in the privacy notice at the bottom of a page, or use the buttons below. The choice is stored in this browser and analytics scripts will no longer initialize after a reload.

<button type="button" data-analytics-optout>Disable analytics</button>
<button type="button" data-analytics-optin>Re-enable analytics</button>

Disabling analytics cannot retract data that a third-party service has already received. For deletion or access requests in those services, use the provider's own privacy controls.

## Service Worker and external links

The Service Worker caches only same-origin pages and static assets; it does not cache cross-origin analytics requests. External websites, downloads, and third-party services linked from articles are governed by their own privacy policies.

If the tool behavior differs from this statement, report the page, browser, and reproduction steps through [Contacts](/en/links/); do not send real passwords, tokens, or private keys.
