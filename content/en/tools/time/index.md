---
title: "Unix Timestamp Converter"
description: "Online tool to convert between Unix timestamps and human-readable dates"
date: 2026-03-16
layout: "page"
category: "conversion"
keywords: ["time", "timestamp", "Unix"]
tool_related: ["bmi", "uuid"]
---

A Unix timestamp is a way to track time as a running total of seconds. This count starts at the Unix Epoch on January 1st, 1970 at UTC. This tool helps you convert between these timestamps and human-readable dates.

{{< tool id="time" >}}

### Examples and limits
Timestamp `0` in UTC corresponds to `1970-01-01 00:00:00`. The tool distinguishes seconds from milliseconds and rejects invalid dates, non-numeric values, and unsafe integers; nonexistent local times during daylight-saving transitions are also rejected. Conversion stays in the browser.

### How to use

Choose timestamp or date-time mode, enter a value, select a time zone, and convert. Results are calculated locally and are never submitted to a server.

### What is Unix Time?
Unix time (also known as Epoch time, POSIX time, seconds since the Epoch, or UNIX Epoch time) is a system for describing a point in time. It is the number of seconds that have elapsed since the Unix epoch, minus leap seconds; the Unix epoch is 00:00:00 UTC on 1 January 1970.
