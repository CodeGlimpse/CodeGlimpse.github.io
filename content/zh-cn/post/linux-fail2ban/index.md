---
title: "保护 Linux 服务器的一大利器：Fail2ban"
date: 2026-04-01 15:00:00+08:00
description: "Fail2ban 是一款强大的工具，可以保护你的服务器免受暴力破解攻击。本教程将指导你如何安装和配置 Fail2ban。"
categories:
    - Tutorials
tags:
    - Linux
---

## 什么是 Fail2ban？

Fail2ban 是一个入侵防御软件框架，可以保护计算机服务器免受暴力破解攻击。它通过扫描日志文件（例如 `/var/log/auth.log`）并禁止显示恶意迹象的 IP 地址——如密码失败次数过多，寻找漏洞等。

## 安装 Fail2ban

根据你使用的 Linux 发行版，选择相应的安装方式。

### 1. 使用包管理器安装

#### Debian / Ubuntu
```bash
sudo apt update
sudo apt install fail2ban
```

#### CentOS / RHEL (使用 yum 或 dnf)
在 CentOS/RHEL 上，你通常需要先安装 EPEL 仓库：
```bash
# CentOS 7
sudo yum install epel-release
sudo yum install fail2ban

# CentOS 8 / RHEL 8 / Fedora (使用 dnf)
sudo dnf install epel-release
sudo dnf install fail2ban
```

### 2. 通过源码安装 (tar.gz)
如果你需要安装特定版本或者你的发行版没有提供包，可以从源码安装：

```bash
# 下载源码（请替换为最新版本链接）
wget https://github.com/fail2ban/fail2ban/archive/refs/tags/1.0.2.tar.gz
tar -xvzf 1.0.2.tar.gz
cd fail2ban-1.0.2

# 安装
sudo python3 setup.py install
```
*注意：源码安装通常需要手动配置 systemd 服务文件和日志路径。*

安装后，建议将 Fail2ban 设置为开机自启：
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 配置 Fail2ban

Fail2ban 的默认配置文件是 `/etc/fail2ban/jail.conf`。但是，不建议直接修改此文件，因为软件包更新时可能会覆盖它。相反，你应该创建一个本地配置文件 `/etc/fail2ban/jail.local` 或在 `/etc/fail2ban/jail.d/` 目录下创建新的 `.conf` 文件来覆盖默认设置。

### 创建本地配置文件

首先，将 `jail.conf` 复制到 `jail.local`：

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

现在，你可以安全地编辑 `jail.local` 文件。

### 配置 SSH 防护

打开 `/etc/fail2ban/jail.local` 文件，找到 `[sshd]` 部分。你可以根据需要自定义以下参数：

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

- `enabled`: `true` 表示启用此监狱（jail）。
- `port`: SSH 服务的端口。
- `logpath`: SSH 认证日志文件的路径。
- `maxretry`: 在 `findtime` 时间内允许的最大失败尝试次数。
- `findtime`: 监控失败尝试的时间窗口。
- `bantime`: 禁止 IP 地址的时间长度。`1d` 表示一天。

### 重启 Fail2ban

修改配置后，你需要重启 Fail2ban 服务以使更改生效：

```bash
sudo systemctl restart fail2ban
```

### 更多实用场景配置

除了 SSH，Fail2ban 还可以保护许多其他服务。在 `jail.local` 中添加以下内容：

#### Nginx 防止恶意扫描 (404 错误过多)
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
*注意：这需要你在 `/etc/fail2ban/filter.d/` 下定义 `nginx-404.conf` 过滤器。*

#### MySQL/MariaDB 防护
```ini
[mariadb-jail]
enabled  = true
port     = 3306
filter   = mysqld-auth
logpath  = /var/log/mysql/error.log
maxretry = 3
```

## Fail2ban 常用管理命令

`fail2ban-client` 是管理 Fail2ban 的主要工具。

### 1. 查看状态
```bash
# 查看服务整体运行状态
sudo fail2ban-client ping

# 查看已启用的监狱列表
sudo fail2ban-client status

# 查看特定监狱的详细状态（如 sshd）
sudo fail2ban-client status sshd
```

### 2. 管理被禁 IP
```bash
# 手动禁止一个 IP (在 sshd 监狱中)
sudo fail2ban-client set sshd banip 1.2.3.4

# 手动解禁一个 IP
sudo fail2ban-client set sshd unbanip 1.2.3.4

# 解禁所有监狱中的某个 IP
sudo fail2ban-client unban 1.2.3.4
```

### 3. 重新加载配置
当你修改了 `.local` 文件或过滤器后，无需重启整个服务即可生效：
```bash
sudo fail2ban-client reload
```

## 常见问题与小贴士
- **白名单**：在 `[DEFAULT]` 部分设置 `ignoreip = 127.0.0.1/8 ::1 <你的固定IP>`，防止把自己关在外面。
- **持久化**：默认情况下，重启服务后之前的禁令会失效。如果需要持久化，可以配置数据库存储。
- **邮件通知**：Fail2ban 支持在封禁 IP 时向管理员发送邮件提醒。

## 总结

Fail2ban 是一个简单而有效的工具，可以为你的服务器增加一层重要的安全保护。通过正确配置，你可以大大减少受到暴力破解攻击的风险。