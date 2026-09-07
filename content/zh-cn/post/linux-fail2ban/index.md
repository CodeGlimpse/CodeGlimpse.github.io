---
title: "保护 Linux 服务器的一大利器：Fail2ban"
date: 2026-04-01 15:00:00+08:00
description: "Fail2ban 是一款强大的工具，可以保护你的服务器免受暴力破解攻击。本教程将指导你如何安装和配置 Fail2ban。"
categories:
    - Tutorials
tags:
    - Linux
lastmod: 2026-09-07T00:00:00+08:00
review_date: "2026-09-07"
review_scope: "示例范围为 Debian/Ubuntu 与 systemd；已对照上游默认配置，未在 Linux 主机重做封禁实测。"
---

Fail2ban 根据日志中的失败事件执行封禁动作。它能补充 SSH 等服务的防护，但需要正确的日志来源、过滤器和防火墙动作；安装服务本身不等于已经保护所有入口。

## 适用范围与安装

下面以使用 systemd 的 Debian/Ubuntu 软件包环境和 SSH 为例。先核对发行版、SSH 实际端口及 Fail2ban 软件包版本；Fedora、RHEL 和其他发行版的仓库与日志配置不能直接套用。

```bash
sudo apt update
sudo apt install fail2ban
fail2ban-client --version
```

优先使用发行版维护的软件包。原文中的 CentOS 7/8 与固定 `1.0.2` 源码安装示例不再作为当前默认路径；确需源码安装时，按[上游说明](https://github.com/fail2ban/fail2ban)评估依赖、服务文件和后续升级方式。

## 先确认 SSH 日志在哪里

Ubuntu/Debian 常见服务单元为 `ssh`，其他环境可能是 `sshd`。检查实际单元及日志：

```bash
sudo systemctl status ssh --no-pager
sudo journalctl -u ssh -n 30 --no-pager
```

如果使用文件日志，先确认 `/var/log/auth.log` 等文件确实存在且包含 SSH 认证事件。不要仅因为某篇教程写了该路径，就假定机器正在向它写日志。

## 用小型覆盖文件配置 SSH jail

保留发行版的 `jail.conf`，在 `/etc/fail2ban/jail.d/sshd.local` 中写入需要覆盖的参数，避免复制整份默认配置后长期失去上游更新。

启用前先确保有第二条管理会话或控制台，并将确认过的固定管理地址加入 `ignoreip`。下面只列出回环地址；它不包含你的远程管理地址。

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

- 使用自定义 SSH 端口时，将 `port` 改为实际端口。
- `systemd` 后端读取 journal，**不能同时照抄文件型 `logpath`**。
- 若改用文件日志，选择合适的文件后端，并设置已确认的路径，例如 `backend = polling` 配合 `logpath = /var/log/auth.log`。
- `maxretry` 和 `findtime` 控制触发条件；`bantime` 是封禁时长，按业务和恢复能力调整。

## 验证配置后再启用

```bash
sudo fail2ban-client -t
```

配置检查通过后，再启用或重新加载服务：

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client reload
sudo fail2ban-client ping
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

确认 `sshd` 已启用、日志来源正确，并检查实际的封禁动作。需要测试封禁时，使用受控测试来源并保留恢复入口，不要反复用唯一管理连接试错。

## 封禁、解禁与持久化

下面的 `192.0.2.10` 是文档示例地址，操作前替换为经过核实的目标：

```bash
sudo fail2ban-client set sshd banip 192.0.2.10
sudo fail2ban-client set sshd unbanip 192.0.2.10
sudo fail2ban-client unban 192.0.2.10
```

上游默认配置启用 SQLite 持久化，`dbfile` 为 `/var/lib/fail2ban/fail2ban.sqlite3`。因此不能笼统地说“重启后所有封禁都会失效”；恢复结果还受数据库、封禁剩余时间、清理策略和发行版配置影响。应检查当前有效配置和服务重启后的实际状态。

## 扩展到其他服务前

不要只添加一个不存在过滤器的 `nginx-404` jail。先确认过滤器文件、真实日志格式和误报范围，再用 `fail2ban-regex` 对受控样例验证。JavaScript 正则工具也不能替代 Fail2ban 自身的过滤器测试。

如果没有封禁事件，按“日志是否产生 → 后端是否读取 → 过滤器是否匹配 → 防火墙动作是否成功”的顺序排查。修改配置后先运行 `fail2ban-client -t`，不要靠反复重启猜测原因。

## 官方依据

- [Fail2ban 项目与安装说明](https://github.com/fail2ban/fail2ban)
- [默认 jail 配置与后端说明](https://github.com/fail2ban/fail2ban/blob/master/config/jail.conf)
- [默认数据库与服务配置](https://github.com/fail2ban/fail2ban/blob/master/config/fail2ban.conf)
