---
title: "OpenClaw is installed but unusable: trace the runtime and Gateway"
description: "Start with a real Node.js version rejection, then separate CLI, Gateway, model-request, and browser-connection checks."
slug: openclaw-troubleshooting
date: 2026-09-09T00:01:00+08:00
categories: [Tutorials]
tags: [OpenClaw]
series_id: openclaw
series_order: 3
tool_related: [json, diff]
---

An installation finishing does not establish that a task can run. The runtime, Gateway, authentication, and browser connection are separate stages. Locate the failing stage before choosing the next action.

## Check command resolution and runtime first

In Windows PowerShell:

```powershell
Get-Command node, npm, openclaw -All
node --version
openclaw --version
```

If a command is missing, check its installation method, executable directory, and the current terminal's PATH. Once the CLI can be found, confirm that the Node.js version running it meets that OpenClaw release's requirements.

This machine runs Node.js `v22.13.1`. Running the **launcher from the OpenClaw 2026.9.2 release package** in an isolated directory rejected even `--version`, with exit code 1:

```text
openclaw: Node.js >=22.22.3 <23, >=24.15.0 <25, or >=25.9.0 is required (current: v22.13.1).
```

This reproduction ran only the package launcher and runtime guard; it did not install OpenClaw globally or start a Gateway. **Being on Node 22 is insufficient if the patch version is below the supported floor.** Execution has not reached model authentication or browser pairing, so changing those settings cannot fix this error.

Both the 2026.9.2 package metadata and launcher specify this range. Choose a supported Node runtime for the OpenClaw release you use, then recheck both version commands. See [installation and configuration]({{< relref "post/openclaw-install" >}}) for the installation options.

## Once the CLI runs, inspect the Gateway

These are next-step checks for a working CLI, not successful output from the isolated experiment above:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

`logs --follow` streams logs until Ctrl+C. The official troubleshooting guide identifies `Runtime: running`, `Connectivity probe: ok`, and `Capability: ...` as useful Gateway signals. Fields can vary by release; read the complete error.

| Symptom | First check |
| --- | --- |
| Service is not running | Installation method, startup logs, and service account |
| `ECONNREFUSED` / connection refused | Destination address, port, and whether the intended service is listening |
| Process runs but its probe fails | Address, port, authentication, and the actual probe error |
| Terminal CLI and background service differ | OpenClaw/Node executable paths, versions, and configuration sources |

`openclaw doctor` provides diagnostics. Read repair, migration, or restart prompts before accepting them. `doctor --fix` and `gateway restart` change state and belong after the problem has been narrowed down.

## Verify model requests and browser connections separately

A reachable Gateway does not prove that model requests work. Using your own model configuration, try a simple request without sensitive content. Interpret authentication, provider quota, model-name, and network errors using the corresponding log messages. Read provider-specific details for 401, 403, and 429 responses.

For the browser, select the intended profile and connection mode:

```bash
openclaw browser --browser-profile openclaw status
```

This checks the managed browser. To reuse a signed-in session, follow the [browser modes guide]({{< relref "post/openclaw-chrome" >}}) for `user` or `chrome` and complete the appropriate authorization. Opening a page, installing an extension, and attaching to the correct tab are distinct checks.

## Capture useful reproduction details

Record system and software versions, commands, non-sensitive destination details, error times, and relevant log excerpts. Remove tokens, keys, cookies, and personal session content.

Check ordinary JSON examples with the [JSON tool](/en/tools/json/) and compare sanitized examples with [Text Diff](/en/tools/diff/). Full OpenClaw configuration can be JSON5; use OpenClaw's diagnostics rather than rewriting it with an ordinary JSON formatter.

## References

- [Official OpenClaw troubleshooting](https://docs.openclaw.ai/gateway/troubleshooting)
- [Installation and runtime requirements](https://docs.openclaw.ai/install)
- [Browser modes](https://docs.openclaw.ai/tools/browser)
- [OpenClaw 2026.9.2 package](https://www.npmjs.com/package/openclaw/v/2026.9.2)
