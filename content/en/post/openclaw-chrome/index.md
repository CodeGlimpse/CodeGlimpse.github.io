---
title: "OpenClaw Browser Modes: Managed, MCP, and Chrome Extension"
description: "Distinguish the OpenClaw managed browser, Chrome DevTools MCP, and Chrome extension, then choose and verify the right connection."
slug: openclaw-chrome
date: 2026-03-24 23:00:00+0800
categories:
    - Tutorials
tags:
    - OpenClaw
lastmod: 2026-09-07T00:00:00+08:00
series_id: openclaw
series_order: 2
tool_related: [json, diff]
---

OpenClaw provides three browser modes: the isolated `openclaw` browser, the Chrome DevTools MCP `user` profile, and the Chrome extension `chrome` profile. They differ mainly in whether they reuse personal login state and how the connection is authorized.

## Choose a connection mode

| Profile | Browser connection | Suitable use |
| --- | --- | --- |
| `openclaw` | Separate profile managed by OpenClaw | Practice and testing that do not need personal login state |
| `user` | Chrome DevTools MCP attaches to a running browser | Existing login state is needed and someone can approve the connection |
| `chrome` | OpenClaw Chrome extension | Existing login state is needed and extension installation and pairing are complete |

The isolated browser is the default. Both modes that reuse a signed-in browser expose more content to automation; choose them according to the task and browser permissions.

## Use the managed browser

With a working Gateway:

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

These commands check status, start the browser, open a test page, and inspect a snapshot separately. Successful command exit alone does not replace checking the actual page and snapshot.

## Attach to Chrome with `user`

The `user` profile requires Chromium **144+** with remote debugging enabled.

1. Keep the target Chrome running and open `chrome://inspect/#remote-debugging`.
2. Enable remote debugging there.
3. Run the connection commands and approve Chrome's connection prompt in person:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

`user` is built in; the simplest case does not require writing a complete profile configuration. Successful status should include `driver: existing-session`, `transport: chrome-mcp`, and `running: true`. Tab listings and snapshots should also match the real browser.

Brave, Edge, or a different profile directory may need an explicit `userDataDir`. A browser already started with a debugging port may need `cdpUrl`. Follow the matching conditions in the [existing-session documentation](https://docs.openclaw.ai/tools/browser#existing-session-via-chrome-devtools-mcp).

## The Chrome extension remains supported

The current official setup entry point is:

```bash
openclaw browser extension install
```

Complete installation, consent, and pairing using the [extension documentation](https://docs.openclaw.ai/tools/chrome-extension). Native bootstrap on macOS/Linux differs from manual pairing on Windows; follow the steps for your operating system.

After pairing, inspect the `chrome` profile:

```bash
openclaw browser --browser-profile chrome status
openclaw browser --browser-profile chrome tabs
```

## Troubleshooting order

- **No `browser` subcommand:** check the OpenClaw version and whether the browser plugin is enabled.
- **`user` cannot attach:** check browser version, remote debugging, consent, and the target profile directory.
- **Status succeeds but the expected page is absent:** confirm the selected profile, then inspect `tabs`.
- **The extension cannot connect:** follow installation and pairing for the current operating system. MCP remote debugging does not replace extension pairing.

## Official references

- [Browser modes, CLI, and existing sessions](https://docs.openclaw.ai/tools/browser)
- [Chrome extension installation and pairing](https://docs.openclaw.ai/tools/chrome-extension)
