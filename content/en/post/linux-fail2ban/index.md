---
title: "Protect Your Linux Server with Fail2ban"
date: 2026-04-01 15:00:00+08:00
description: "Fail2ban is a powerful tool to protect your server from brute-force attacks. This tutorial guides you through installing and configuring Fail2ban."
categories:
    - Tutorials
tags:
    - Linux
---

## What is Fail2ban?

Fail2ban is an intrusion prevention software framework that protects computer servers from brute-force attacks. It works by scanning log files (e.g., `/var/log/auth.log`) and banning IP addresses that show malicious signs, such as too many password failures, seeking for exploits, etc.

## Installing Fail2ban

Choose the installation method according to your Linux distribution.

### 1. Using Package Manager

#### Debian / Ubuntu
```bash
sudo apt update
sudo apt install fail2ban
```

#### CentOS / RHEL (Using yum or dnf)
On CentOS/RHEL, you typically need to install the EPEL repository first:
```bash
# CentOS 7
sudo yum install epel-release
sudo yum install fail2ban

# CentOS 8 / RHEL 8 / Fedora (Using dnf)
sudo dnf install epel-release
sudo dnf install fail2ban
```

### 2. From Source (tar.gz)
If you need a specific version or your distribution doesn't provide a package, you can install from source:

```bash
# Download source (replace with the latest version link)
wget https://github.com/fail2ban/fail2ban/archive/refs/tags/1.0.2.tar.gz
tar -xvzf 1.0.2.tar.gz
cd fail2ban-1.0.2

# Install
sudo python3 setup.py install
```
*Note: Source installation typically requires manual configuration of systemd service files and log paths.*

After installation, it is recommended to set Fail2ban to start on boot:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Configuring Fail2ban

The default configuration file for Fail2ban is `/etc/fail2ban/jail.conf`. However, it's not recommended to modify this file directly, as it may be overwritten during package upgrades. Instead, you should create a local configuration file, `/etc/fail2ban/jail.local`, or new `.conf` files in the `/etc/fail2ban/jail.d/` directory to override the defaults.

### Create a Local Configuration File

First, copy `jail.conf` to `jail.local`:

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

Now you can safely edit the `jail.local` file.

### Configure SSH Protection

Open the `/etc/fail2ban/jail.local` file and find the `[sshd]` section. You can customize the following parameters as needed:

```ini
[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 5
findtime = 10m
bantime = 1d
```

- `enabled`: `true` enables this jail.
- `port`: The port for the SSH service.
- `logpath`: The path to the SSH authentication log file.
- `maxretry`: The number of failures before a ban is imposed.
- `findtime`: The time window during which the failures must occur.
- `bantime`: The duration for which the IP address is banned. `1d` means one day.

### More Practical Scenarios

In addition to SSH, Fail2ban can protect many other services. Add the following to `jail.local`:

#### Nginx Prevention of Malicious Scans (Too many 404 errors)
```ini
[nginx-404]
enabled  = true
port     = http,https
filter   = nginx-404
logpath  = /var/log/nginx/access.log
findtime = 600
maxretry = 5
bantime  = 1h
```
*Note: This requires you to define an `nginx-404.conf` filter under `/etc/fail2ban/filter.d/`.*

#### MySQL/MariaDB Protection
```ini
[mariadb-jail]
enabled  = true
port     = 3306
filter   = mysqld-auth
logpath  = /var/log/mysql/error.log
maxretry = 3
```

## Common Fail2ban Management Commands

`fail2ban-client` is the primary tool for managing Fail2ban.

### 1. Check Status
```bash
# Check overall service running status
sudo fail2ban-client ping

# Check the list of enabled jails
sudo fail2ban-client status

# Check detailed status of a specific jail (e.g., sshd)
sudo fail2ban-client status sshd
```

### 2. Manage Banned IPs
```bash
# Manually ban an IP (in the sshd jail)
sudo fail2ban-client set sshd banip 1.2.3.4

# Manually unban an IP
sudo fail2ban-client set sshd unbanip 1.2.3.4

# Unban an IP from all jails
sudo fail2ban-client unban 1.2.3.4
```

### 3. Reload Configuration
When you modify `.local` files or filters, you can apply changes without restarting the entire service:
```bash
sudo fail2ban-client reload
```

## FAQ & Tips
- **Whitelist**: Set `ignoreip = 127.0.0.1/8 ::1 <Your Fixed IP>` in the `[DEFAULT]` section to prevent locking yourself out.
- **Persistence**: By default, bans expire after a service restart. For persistence, you can configure database storage.
- **Email Notifications**: Fail2ban supports sending email alerts to administrators when an IP is banned.

## Summary

Fail2ban is a simple yet effective tool that adds a significant layer of security to your server. With proper configuration, you can greatly reduce the risk of brute-force attacks.