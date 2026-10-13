---
layout: post
title: CentOS Stream 9 安装 Grafana
description: 在 CentOS Stream 9 上通过官方 YUM 源安装 Grafana，启动服务、开放防火墙、访问 Web 界面，并梳理配置文件、数据目录和常用管理命令，每步都有解释。
date: 2026-10-13 00:00:00 +0800
tags: [CentOS Stream 9, Grafana, 监控, 可视化, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上安装 **Grafana**。Grafana 是一套开源的监控可视化平台，可以接入 Prometheus、InfluxDB、MySQL 等多种数据源，用来画仪表盘、做告警。本文覆盖：添加官方软件源、安装、启动、开放防火墙、访问 Web 界面，以及关键配置文件和常用管理命令，每一步都有解释。

> 示例面向 CentOS Stream 9 的 x86_64 主机。文章核对时 Grafana OSS 最新稳定版是 v13.2.3（2026 年 10 月 13 日），版本会随官方发布更新，具体以 [grafana.com](https://grafana.com/grafana/download) 为准。

## 一、确认环境和资源

```bash
cat /etc/os-release | grep VERSION_ID
free -h
ss -lntp | grep 3000
```

`cat /etc/os-release | grep VERSION_ID` 确认是 CentOS Stream 9；`free -h` 查看内存，Grafana 本身很轻量，默认单机几百 MB 内存即可；`ss -lntp | grep 3000` 检查 3000 端口（Grafana 默认 Web 端口）是否已被占用，有输出说明被别的程序占用，需要先处理或改端口。

## 二、选择安装方式

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| 官方 YUM 源 | 自动跟随升级、配置简单 | 需要先添加仓库 |
| 直接下载 RPM | 不依赖仓库、可指定版本 | 升级要手动换包 |
| Docker 镜像 | 隔离干净、便于迁移 | 需要先有 Docker 环境 |

服务器长期使用推荐**官方 YUM 源**，这也是 Grafana 官方文档的标准做法。下文按这种方式展开。

## 三、添加官方软件源并安装

### 3.1 添加 Grafana 软件源

```bash
sudo tee /etc/yum.repos.d/grafana.repo <<-'EOF'
[grafana]
name=grafana
baseurl=https://rpm.grafana.com
repo_gpgcheck=1
enabled=1
gpgcheck=1
gpgkey=https://rpm.grafana.com/gpg.key
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
EOF
```

`tee ... <<-'EOF' ... EOF` 把中间内容写入 `/etc/yum.repos.d/grafana.repo` 这个软件源定义文件。文件里各字段含义：

| 字段 | 含义 |
| --- | --- |
| `[grafana]` | 软件源 ID，dnf 用方括号里的名字标识这个源 |
| `name=grafana` | 源的显示名称 |
| `baseurl=https://rpm.grafana.com` | 软件包下载地址 |
| `enabled=1` | 是否启用（1 启用，0 禁用） |
| `gpgcheck=1` | 是否校验 RPM 包的 GPG 签名 |
| `repo_gpgcheck=1` | 是否校验仓库元数据的签名 |
| `gpgkey=https://rpm.grafana.com/gpg.key` | GPG 公钥地址 |
| `sslverify=1` + `sslcacert=...` | 启用 HTTPS 校验并指定系统 CA 证书包 |

### 3.2 安装 Grafana

```bash
sudo dnf install -y grafana
```

`dnf install` 从刚添加的源安装 `grafana` 包，`-y` 自动确认。首次执行会提示导入 Grafana 的 GPG 公钥，输入 `y` 即可。安装完成后，主程序在 `/usr/sbin/grafana-server`，并会自动创建 `grafana` 系统用户、配置文件和 systemd 服务。

## 四、启动并设置开机自启

```bash
sudo systemctl enable --now grafana-server
sudo systemctl status grafana-server --no-pager
```

服务名是 `grafana-server`（不是 `grafana`）。`systemctl enable --now grafana-server` 同时完成"设为开机自启"（`enable`）和"立即启动"（`--now`）；`status` 确认服务状态，看到 `active (running)` 表示启动成功。

## 五、开放防火墙端口

Grafana 默认监听 3000 端口。本机访问无需开防火墙；如果要让内网其他机器通过浏览器访问，需要放行：

```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

`--permanent` 把规则写入持久配置（重启仍有效），`--add-port=3000/tcp` 放行 TCP 3000，`--reload` 立即生效，`--list-ports` 确认规则已加。**不建议**直接把 3000 端口暴露到公网；跨公网访问应走 VPN、SSH 隧道或反向代理加 HTTPS。

## 六、访问 Web 界面

浏览器打开：

```text
http://服务器IP:3000
```

首次登录的默认账号密码都是 `admin`：

```text
用户名：admin
密码：admin
```

登录后 Grafana 会强制要求设置一个新密码，按提示改掉即可。`admin` 是内置管理员，拥有全部权限，生产环境务必改用强密码并给普通用户单独建账号、按需授权。

## 七、关键配置与数据位置

| 内容 | 位置 |
| --- | --- |
| 主配置文件 | `/etc/grafana/grafana.ini` |
| 数据目录（含内置 SQLite 数据库 grafana.db） | `/var/lib/grafana` |
| 插件目录 | `/var/lib/grafana/plugins` |
| 日志目录 | `/var/log/grafana/grafana.log` |
| 主程序 | `/usr/sbin/grafana-server` |
| 命令行工具 | `/usr/bin/grafana-cli` |
| systemd 服务单元 | `/usr/lib/systemd/system/grafana-server.service` |
| 运行用户 | `grafana` |

`grafana.ini` 是核心配置，用 `[section]` 加 `key = value` 的格式组织，行首带 `;` 的是注释（表示使用默认值）。改完配置要重启服务才生效：

```bash
sudo systemctl restart grafana-server
```

几个常用配置（在 `grafana.ini` 里找到对应项取消注释并修改）：

- `[server]` 的 `http_port`：改 Web 端口，默认 3000。改端口后还要同步放行防火墙，并注意 SELinux 对端口的要求。
- `[server]` 的 `root_url`：对外访问地址。放在反向代理（如 nginx）后面时，把它设成完整的域名，否则登录跳转、回调可能出错。
- `[auth.anonymous]` 的 `enabled`：是否允许匿名访问，默认关闭。
- `[users]` 的 `allow_sign_up`：是否允许访客自行注册，默认关闭。

安装插件用 `grafana-cli`：

```bash
sudo grafana-cli plugins install 插件名
```

例如 `sudo grafana-cli plugins install grafana-clock-panel`。装完同样要重启服务。命令行工具的另一种用途是重置管理员密码：`sudo grafana-cli admin reset-admin-password 新密码`。

## 八、常用管理命令

| 操作 | 命令 |
| --- | --- |
| 启动 / 停止 / 重启 / 状态 | `sudo systemctl start/stop/restart/status grafana-server` |
| 开机自启 / 取消自启 | `sudo systemctl enable/disable grafana-server` |
| 查看日志 | `sudo journalctl -u grafana-server -f` 或 `tail -f /var/log/grafana/grafana.log` |
| 查看版本 | `grafana-server -v` |
| 安装插件 | `sudo grafana-cli plugins install 插件名` |
| 重置管理员密码 | `sudo grafana-cli admin reset-admin-password 新密码` |

## 九、卸载

```bash
sudo systemctl stop grafana-server
sudo dnf remove -y grafana
```

`dnf remove` 卸载软件包。如果要连数据一起删（仪表盘、数据源配置都在 `/var/lib/grafana/grafana.db` 里），再执行：

```bash
sudo rm -rf /var/lib/grafana
sudo rm -f /etc/yum.repos.d/grafana.repo
```

**注意**：`rm -rf /var/lib/grafana` 会永久删除所有仪表盘、数据源和用户配置，确认已备份再执行。

## 十、常见问题

### 浏览器打不开 3000 端口

按顺序排查：服务是否 `active (running)`（`systemctl status grafana-server`）、是否监听 3000（`ss -lntp | grep 3000`）、防火墙是否放行（`firewall-cmd --list-ports`）、云安全组是否放行。本机测试用 `curl http://127.0.0.1:3000` 最快。

### 改端口后访问不了

除了改 `grafana.ini` 的 `http_port` 和放行防火墙，CentOS Stream 9 默认开启 SELinux，新端口可能没有正确标签。可用 `sudo semanage port -a -t http_port_t -p tcp 新端口` 打标签（没有 `semanage` 先 `dnf install policycoreutils-python-utils`），再重启服务。

### 忘了管理员密码

用命令行重置：`sudo grafana-cli admin reset-admin-password 新密码`，然后重启服务。

### 添加数据源报连接失败

确认 Grafana 所在机器能连通数据源地址和端口（如 Prometheus 的 9090、InfluxDB 的 8086），并检查数据源自己的防火墙/认证。同一台机器上的数据源优先用 `127.0.0.1`。

### 放在 nginx 反代后面登录跳转异常

把 `grafana.ini` 里 `[server]` 的 `root_url` 设成完整域名（如 `https://grafana.example.com/`），并在 nginx 侧正确转发 `Host` 头和 WebSocket，然后重启 Grafana。

## 官方文档

- [Grafana 官方下载页](https://grafana.com/grafana/download)
- [Grafana RPM/Deb 安装说明](https://grafana.com/docs/grafana/latest/setup-grafana/installation/rpm/)
- [Grafana 配置参考（grafana.ini）](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)
- [Grafana 服务管理（systemd）](https://grafana.com/docs/grafana/latest/setup-grafana/start-restart-grafana/)

*命令和配置依据 Grafana 官方文档整理，版本核对日期：2026 年 10 月 13 日。软件源地址、版本号可能随官方更新变化，具体以 grafana.com 当前页面为准。*
