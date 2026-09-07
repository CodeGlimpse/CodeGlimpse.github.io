---
title: "Protect Your Linux Server with Fail2ban"
date: 2026-04-01 15:00:00+08:00
description: "Fail2ban is a powerful tool to protect your server from brute-force attacks. This tutorial guides you through installing and configuring Fail2ban."
categories:
    - Tutorials
tags:
    - Linux
lastmod: 2026-09-07T00:00:00+08:00
---

Fail2ban reads failure events from logs and applies ban actions. It complements protection for services such as SSH, but needs the correct log source, filter, and firewall action. Installing the service alone does not protect every entry point.

## Scope and installation

These examples cover SSH with distribution packages on systemd-based Debian/Ubuntu. Check the distribution, actual SSH port, and installed Fail2ban version first. Fedora, RHEL, and other distributions have different repositories and logging defaults.

```bash
sudo apt update
sudo apt install fail2ban
fail2ban-client --version
```

Prefer maintained distribution packages. If source installation is required, consult [upstream guidance](https://github.com/fail2ban/fail2ban) to select a release and confirm dependencies, service integration, and future updates.

## Identify the SSH log source

Ubuntu/Debian commonly use the `ssh` service unit; other environments may use `sshd`. Inspect the actual unit and logs:

```bash
sudo systemctl status ssh --no-pager
sudo journalctl -u ssh -n 30 --no-pager
```

For file-based logging, confirm that a file such as `/var/log/auth.log` exists and receives SSH authentication events. A path in a tutorial is not evidence that the machine writes to it.

## Configure a small SSH jail override

Keep the distribution's `jail.conf` and place only the overrides in `/etc/fail2ban/jail.d/sshd.local`. Copying the entire default file makes later upstream changes harder to inherit.

Before enabling protection, retain a second management session or console and add a verified fixed administration address to `ignoreip`. The example below contains loopback addresses only, not your remote management address.

```ini
[DEFAULT]
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
```

- Set `port` to the actual value if SSH uses a custom port.
- The `systemd` backend reads the journal; **do not combine it with a copied file-based `logpath`**.
- For file logs, choose a suitable backend and a verified path, for example `backend = polling` with `logpath = /var/log/auth.log`.
- `maxretry` and `findtime` define the trigger; `bantime` sets the ban duration. Adjust them for the service and recovery options.

## Validate before enabling

```bash
sudo fail2ban-client -t
```

After configuration validation succeeds, enable or reload the service:

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client reload
sudo fail2ban-client ping
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

Confirm that `sshd` is enabled, the log source is correct, and the ban action works. Test from a controlled source while retaining a recovery path rather than repeatedly failing authentication on your only management connection.

## Bans, unbans, and persistence

`192.0.2.10` is a documentation example address. Replace it with a verified target before running these commands:

```bash
sudo fail2ban-client set sshd banip 192.0.2.10
sudo fail2ban-client set sshd unbanip 192.0.2.10
sudo fail2ban-client unban 192.0.2.10
```

Upstream defaults enable SQLite persistence, with `dbfile` set to `/var/lib/fail2ban/fail2ban.sqlite3`. It is therefore inaccurate to say that all bans disappear on restart. Restoration also depends on the database, remaining ban duration, purge policy, and distribution configuration. Check effective configuration and actual status after a restart.

## Before protecting other services

Do not enable a `nginx-404` jail without its matching filter. Confirm the filter file, actual log format, and false-positive scope, then verify controlled samples with `fail2ban-regex`. A JavaScript regex tool does not replace Fail2ban's filter tests.

If no ban occurs, inspect the sequence: log production, backend ingestion, filter matching, and firewall action. Run `fail2ban-client -t` after configuration changes instead of guessing through repeated restarts.

## Official references

- [Fail2ban project and installation guidance](https://github.com/fail2ban/fail2ban)
- [Default jails and backend documentation](https://github.com/fail2ban/fail2ban/blob/master/config/jail.conf)
- [Default database and service configuration](https://github.com/fail2ban/fail2ban/blob/master/config/fail2ban.conf)
