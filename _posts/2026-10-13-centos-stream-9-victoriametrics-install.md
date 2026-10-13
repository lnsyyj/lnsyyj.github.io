---
layout: post
title: CentOS Stream 9 安装 VictoriaMetrics
description: 在 CentOS Stream 9 上通过官方二进制包安装 VictoriaMetrics 单机版，用 systemd 管理服务，写入并查询测试数据，梳理常用启动参数与数据目录，每步都有解释。
date: 2026-10-13 00:00:00 +0800
tags: [CentOS Stream 9, VictoriaMetrics, 监控, 时序数据库, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上安装 **VictoriaMetrics 单机版**。VictoriaMetrics 是一个高性能的开源时序数据库，兼容 Prometheus 的查询和写入协议，常用来替代或长期存储 Prometheus 的监控数据。本文覆盖下载、安装、systemd 管理、写入与查询测试，以及常用启动参数和数据目录，每一步都有解释。

> 示例面向 CentOS Stream 9 的 x86_64 主机。文章核对时最新版本是 v1.154.0（2026 年 10 月 13 日），版本会随官方发布更新，动手前建议到 [VictoriaMetrics Releases](https://github.com/VictoriaMetrics/VictoriaMetrics/releases) 确认。

## 一、确认环境和资源

```bash
cat /etc/os-release | grep VERSION_ID
free -h
df -h
ss -lntp | grep 8428
```

`cat /etc/os-release | grep VERSION_ID` 确认系统是 CentOS Stream 9；`free -h`、`df -h` 查看内存和磁盘——VictoriaMetrics 会把数据落在磁盘、热点数据缓存在内存，单机起步建议内存 2 GB 以上，并给数据目录留足空间；`ss -lntp | grep 8428` 检查默认 HTTP 端口 8428 是否被占用。

## 二、选择安装方式

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| 官方二进制包 | 版本最新、无额外依赖 | 需手动下载、配 systemd |
| Docker 镜像 | 隔离干净、启动一条命令 | 需要 Docker 环境 |

VictoriaMetrics 官方没有提供 RPM 仓库，Linux 上的标准做法是下载官方二进制包，再用 systemd 管理，下文按这个方式展开。

## 三、下载并安装二进制包

### 3.1 下载并校验

```bash
curl -fLO https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v1.154.0/victoria-metrics-linux-amd64-v1.154.0.tar.gz
curl -fLO https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v1.154.0/victoria-metrics-linux-amd64-v1.154.0_checksums.txt
sha256sum -c victoria-metrics-linux-amd64-v1.154.0_checksums.txt --ignore-missing
```

第一条 `curl` 的 `-f` 表示出错即失败、`-L` 跟随重定向、`-O` 按文件名保存；第二条下载官方校验和清单；第三条 `sha256sum -c ... --ignore-missing` 用清单核对已下载文件的 sha256，`--ignore-missing` 表示只校验本地存在的文件（清单里还列了 cluster、enterprise 等其他包），输出 `OK` 说明文件完整未被篡改。

### 3.2 解压并安装

```bash
tar -xzf victoria-metrics-linux-amd64-v1.154.0.tar.gz
sudo install -m 755 victoria-metrics-prod /usr/local/bin/victoria-metrics-prod
```

`tar -xzf` 解压，`x` 解压、`z` 是 gzip、`f` 指定文件。单机版压缩包里只有一个二进制文件 `victoria-metrics-prod`。`install -m 755 源 目标` 把二进制安装到 `/usr/local/bin/` 并设置可执行权限。装完确认版本：

```bash
victoria-metrics-prod --version
```

### 3.3 创建运行用户和数据目录

```bash
sudo useradd -r -s /sbin/nologin victoriametrics
sudo mkdir -p /var/lib/victoria-metrics
sudo chown -R victoriametrics:victoriametrics /var/lib/victoria-metrics
```

`useradd -r` 创建系统账号（UID 较小，不用于登录），`-s /sbin/nologin` 指定一个不能登录的 shell；`mkdir -p` 创建数据目录；`chown -R` 把目录属主交给这个运行用户，这样服务进程才有权限在里面读写时序数据。

## 四、配置 systemd 服务并启动

创建服务单元文件：

```bash
sudo tee /etc/systemd/system/victoria-metrics.service <<-'EOF'
[Unit]
Description=VictoriaMetrics
After=network.target

[Service]
User=victoriametrics
Group=victoriametrics
ExecStart=/usr/local/bin/victoria-metrics-prod \
  -storageDataPath=/var/lib/victoria-metrics \
  -retentionPeriod=12
Restart=always
RestartSec=3
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
EOF
```

`tee ... <<-'EOF' ... EOF` 把中间内容写入 systemd 单元文件。各字段含义：

| 字段 | 含义 |
| --- | --- |
| `[Unit]` 的 `After=network.target` | 等网络就绪后再启动 |
| `User` / `Group` | 用哪个系统账号运行进程 |
| `ExecStart` | 启动命令，行尾 `\` 是续行符 |
| `-storageDataPath=...` | 数据存储目录 |
| `-retentionPeriod=12` | 数据保留 12 个月（单位是月） |
| `Restart=always` | 进程异常退出后总是自动重启 |
| `RestartSec=3` | 重启前等待 3 秒 |
| `LimitNOFILE=1048576` | 提高文件描述符上限，时序库会同时打开大量文件 |
| `[Install]` 的 `WantedBy=multi-user.target` | 系统进入多用户模式时启动（即开机自启） |

加载并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now victoria-metrics
sudo systemctl status victoria-metrics --no-pager
```

`daemon-reload` 让 systemd 重新读取刚创建的单元文件；`enable --now` 同时完成"设开机自启"和"立即启动"；`status` 确认状态为 `active (running)`。

## 五、验证运行

```bash
ss -lntp | grep 8428
curl http://127.0.0.1:8428/health
curl http://127.0.0.1:8428/metrics | head
```

`ss -lntp | grep 8428` 确认进程已监听 8428 端口；`curl http://127.0.0.1:8428/health` 访问健康检查接口，正常返回 `OK`；`curl .../metrics` 是 VictoriaMetrics 自身的监控指标（Prometheus 文本格式），`| head` 只看开头几行，说明服务已经在对外提供 HTTP 接口。

## 六、写入并查询一条测试数据

```bash
curl -d 'temperature{location="server-room"} 23.5' http://127.0.0.1:8428/api/v1/import/prometheus
curl 'http://127.0.0.1:8428/api/v1/query?query=temperature'
```

第一条用 `curl -d` 以 POST 方式把一行 Prometheus 文本格式的数据（`指标名{标签} 值`）发到导入接口 `/api/v1/import/prometheus`，这会把 `temperature` 这个指标写入数据库；第二条访问查询接口 `/api/v1/query`，`query=temperature` 是查询表达式，返回的 JSON 里 `data.result` 就是查询结果。能用一条命令写入并立刻查到，说明读写链路都正常。

生产环境的数据一般来自两个方向：让 Prometheus 通过 remote write 把数据转发到 VictoriaMetrics（地址填 `http://主机:8428/api/v1/write`），或让 VictoriaMetrics 自己抓取（用 `-promscrape.config` 指定抓取配置）。

## 七、常用启动参数与数据位置

常用启动参数（加在 systemd 单元的 `ExecStart` 里）：

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `-httpListenAddr` | `:8428` | HTTP 监听地址和端口 |
| `-storageDataPath` | `victoria-metrics-data` | 数据存储目录 |
| `-retentionPeriod` | `1` | 数据保留时长，单位是月（也支持 `d` 天等后缀） |
| `-selfScrapeInterval` | `0`（关闭） | 每隔多久把自身指标写进自己，如 `10s` |
| `-promscrape.config` | 空 | 指定抓取配置文件的路径，启用自动抓取 |

改参数时编辑 `/etc/systemd/system/victoria-metrics.service`，然后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl restart victoria-metrics
```

关键路径汇总：

| 内容 | 位置 |
| --- | --- |
| 主程序 | `/usr/local/bin/victoria-metrics-prod` |
| systemd 服务单元 | `/etc/systemd/system/victoria-metrics.service` |
| 数据目录 | `/var/lib/victoria-metrics`（由 `-storageDataPath` 指定） |
| 运行用户 | `victoriametrics` |
| 日志 | systemd 日志（`journalctl -u victoria-metrics`） |

## 八、Docker 方式（可选）

如果更习惯容器部署，也可以用官方镜像：

```bash
sudo docker run -d --name victoria-metrics \
  -p 8428:8428 \
  -v /var/lib/victoria-metrics:/victoria-metrics-data \
  victoriametrics/victoria-metrics
```

`-d` 后台运行，`--name` 指定容器名，`-p 8428:8428` 把宿主机 8428 端口映射到容器，`-v` 把数据目录挂载到宿主机以便持久化，最后是镜像名 `victoriametrics/victoria-metrics`。

## 九、常用管理命令

| 操作 | 命令 |
| --- | --- |
| 启动 / 停止 / 重启 / 状态 | `sudo systemctl start/stop/restart/status victoria-metrics` |
| 开机自启 / 取消自启 | `sudo systemctl enable/disable victoria-metrics` |
| 查看日志 | `sudo journalctl -u victoria-metrics -f` |
| 健康检查 | `curl http://127.0.0.1:8428/health` |
| 即时查询 | `curl 'http://127.0.0.1:8428/api/v1/query?query=表达式'` |

## 十、卸载

```bash
sudo systemctl disable --now victoria-metrics
sudo rm -f /etc/systemd/system/victoria-metrics.service
sudo rm -f /usr/local/bin/victoria-metrics-prod
sudo systemctl daemon-reload
```

`disable --now` 取消自启并立即停止；然后删除服务单元文件和二进制，`daemon-reload` 刷新 systemd。要连数据一起删，再执行 `sudo rm -rf /var/lib/victoria-metrics`（**会永久删除所有时序数据，执行前确认已备份**）。运行用户 `victoriametrics` 如不再需要，可用 `sudo userdel victoriametrics` 删除。

## 十一、常见问题

### 服务起来了但 8428 打不开

先确认 `systemctl status victoria-metrics` 为 `active (running)`，再用 `ss -lntp | grep 8428` 看是否监听。跨机器访问还要检查防火墙和云安全组是否放行 8428；本机测试用 `curl http://127.0.0.1:8428/health`。

### 内存占用偏高

VictoriaMetrics 会把近期热点数据缓存在内存里，属正常行为。数据量很大时适当增加内存，或调小 `-retentionPeriod`、减少活跃时间序列；不要和数据库进程同机抢内存。

### 磁盘涨得很快

检查 `-retentionPeriod` 是否符合预期，以及是否有大量高基数的标签（标签组合越多，时序越多）。用 `df -h` 观察数据目录所在磁盘。

### 数据没查到

确认写入是否成功（看接口返回状态码）、查询表达式的指标名和标签是否写对。Prometheus remote write 场景还要检查 Prometheus 侧 `remote_write` 地址是否为 `http://主机:8428/api/v1/write`。

### 和 Prometheus 有什么区别

VictoriaMetrics 兼容 Prometheus 的 PromQL 查询、`/api/v1/write` 写入和 `/api/v1/query` 查询等接口，可以直接作为 Prometheus 的 remote write 后端，主打更高的写入吞吐和更省的磁盘/内存。通常用 Prometheus（或 VM 自带抓取）采集，VictoriaMetrics 负责长期存储。

## 官方文档

- [VictoriaMetrics 官方站点](https://victoriametrics.com/)
- [VictoriaMetrics Releases](https://github.com/VictoriaMetrics/VictoriaMetrics/releases)
- [VictoriaMetrics 快速开始](https://docs.victoriametrics.com/quickstart/)
- [单机版运行参数](https://docs.victoriametrics.com/single-server-victoriametrics/)

*命令和配置依据 VictoriaMetrics 官方文档整理，版本核对日期：2026 年 10 月 13 日。下载地址和版本号会随官方发布变化，请以 Releases 页面为准。*
