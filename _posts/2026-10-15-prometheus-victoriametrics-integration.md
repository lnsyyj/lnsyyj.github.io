---
layout: post
title: CentOS Stream 9：Prometheus 对接 VictoriaMetrics 长期存储
description: 在 CentOS Stream 9 上安装 Prometheus，通过 remote_write 把监控数据写入 VictoriaMetrics 做长期存储，配置队列参数、remote_read、VM 直接抓取，并验证数据流转，每步都有解释。
date: 2026-10-15 00:00:00 +0800
tags: [CentOS Stream 9, Prometheus, VictoriaMetrics, 监控, 运维]
---

本文介绍如何在 **CentOS Stream 9** 上让 **Prometheus** 与 **VictoriaMetrics** 对接：Prometheus 负责采集和告警，VictoriaMetrics 作为兼容 Prometheus 协议的长期存储后端，通过 `remote_write` 接收数据。文章覆盖安装 Prometheus、配置 `remote_write`、验证数据流转，以及可选的 `remote_read` 和"用 VictoriaMetrics 直接抓取"两种进阶方式，每一步都有解释。

> 前提：已按《CentOS Stream 9 安装 VictoriaMetrics》把 VictoriaMetrics 单机版跑起来（默认监听 `127.0.0.1:8428`）。VictoriaMetrics 版本以 v1.154.0 为例；Prometheus 用示例版本号 3.5.0，请以 [Prometheus Releases](https://github.com/prometheus/prometheus/releases) 上的最新稳定版为准。

## 一、先理解对接原理

Prometheus 的核心职责是"抓取（scrape）目标、短期存储、告警"，它本地保存的数据默认保留 15 天，不适合长期存储大量历史。VictoriaMetrics 实现了 Prometheus 的 `remote_write` 协议，可以当作它的长期后端。

对接的关键是 Prometheus 的 `remote_write`：Prometheus 每采集到新样本，就以压缩后的远程写入格式批量推送到 VictoriaMetrics 的 `/api/v1/write` 接口，VM 负责落盘和长期保留。之后查询（PromQL）仍然走 Prometheus 风格，只是可以查 VM 里的长期数据。

通常有三种用法，按推荐程度：

| 方式 | 说明 |
| --- | --- |
| Prometheus 采集 + `remote_write` 到 VM | 最常用：Prometheus 保留短期、负责告警，VM 存长期 |
| VM 直接抓取（`-promscrape.config`） | 用 VM 完全替代 Prometheus，一套搞定采集和存储 |
| 加 `remote_read` 从 VM 读回 | 让 Prometheus 能查到 VM 里超出本地保留期的历史数据 |

本文主线是第一种，第六节讲后两种。

## 二、安装 Prometheus

Prometheus 官方只发布二进制压缩包，没有 RPM 仓库，按官方标准方式安装。

### 2.1 下载并解压

```bash
PROM_VERSION=3.5.0   # 示例版本，请替换为官方 Releases 的最新稳定版
curl -fLO "https://github.com/prometheus/prometheus/releases/download/v${PROM_VERSION}/prometheus-${PROM_VERSION}.linux-amd64.tar.gz"
tar -xzf "prometheus-${PROM_VERSION}.linux-amd64.tar.gz"
```

`PROM_VERSION=...` 定义一个变量方便后续复用；`curl -fLO` 的 `-f` 出错即失败、`-L` 跟随重定向、`-O` 按文件名保存；`tar -xzf` 解压，得到 `prometheus-3.5.0.linux-amd64/` 目录，里面有 `prometheus`（主程序）、`promtool`（命令行工具）、`prometheus.yml`（示例配置）等。

### 2.2 安装到 /opt 并创建用户

```bash
sudo mv "prometheus-${PROM_VERSION}.linux-amd64" /opt/prometheus
sudo useradd -r -s /sbin/nologin prometheus
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo cp /opt/prometheus/prometheus.yml /etc/prometheus/prometheus.yml
sudo chown -R prometheus:prometheus /opt/prometheus /etc/prometheus /var/lib/prometheus
```

`mv` 把解压目录移到 `/opt/prometheus`；`useradd -r` 创建不能登录的系统账号 `prometheus`；`mkdir -p` 创建配置目录 `/etc/prometheus` 和数据目录 `/var/lib/prometheus`；`cp` 拷贝示例配置；`chown -R` 把三个目录的属主交给 prometheus 用户，这样服务进程才有读写权限。

### 2.3 编写 systemd 服务

```bash
sudo tee /etc/systemd/system/prometheus.service <<-'EOF'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
ExecStart=/opt/prometheus/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus \
  --storage.tsdb.retention.time=15d
Restart=always

[Install]
WantedBy=multi-user.target
EOF
```

字段说明：`Wants`/`After` 让服务等网络就绪再启动；`User`/`Group` 指定运行账号；`ExecStart` 里三个参数分别是配置文件路径、本地 TSDB 数据目录、本地保留时长——因为长期数据要交给 VictoriaMetrics，Prometheus 本地只留 15 天即可；`Restart=always` 异常退出自动重启。

先别急着启动，下一节配置好 `remote_write` 再一起启动。

## 三、配置 remote_write

编辑 Prometheus 配置：

```bash
sudo vi /etc/prometheus/prometheus.yml
```

在文件里保留抓取配置，并新增 `remote_write` 段：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

remote_write:
  - url: "http://127.0.0.1:8428/api/v1/write"
    queue_config:
      capacity: 10000
      max_shards: 20
      max_samples_per_send: 2000
      batch_send_deadline: 5s
```

逐项解释：

- `global.scrape_interval`：Prometheus 每隔多久抓取一次目标，`evaluation_interval` 是计算告警规则的频率。
- `scrape_configs`：这里让 Prometheus 抓取它自己（`localhost:9090`），这样即使没有其他 exporter，也会有 `up{job="prometheus"}` 这个指标，方便验证数据流转。
- `remote_write.url`：推送到 VictoriaMetrics 的写入接口，**必须是 `/api/v1/write`**（不是 `/write`）。
- `queue_config` 是写入队列参数：`capacity` 是每个分片的内存队列容量；`max_shards` 是最大并发分片数（后端慢时自动扩）；`max_samples_per_send` 是每次批量发送的最大样本数；`batch_send_deadline` 是积攒一批的最长时间。这些参数一般用默认值即可，只有写入量大时才需要调。

可选：如果只想把部分指标写入 VM，可以加 `write_relabel_configs` 过滤，例如丢弃某个前缀的指标：

```yaml
    write_relabel_configs:
      - source_labels: [__name__]
        regex: 'tmp_.*'
        action: drop
```

`write_relabel_configs` 在发送前对样本做重标记/过滤：`source_labels` 选指标名，`regex` 匹配，`action: drop` 表示匹配上的丢弃。

## 四、启动并验证数据流转

启动 Prometheus 和 VictoriaMetrics：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now prometheus victoria-metrics
sudo systemctl status prometheus victoria-metrics --no-pager
```

`daemon-reload` 让 systemd 读取新写的 prometheus 单元；`enable --now` 同时"开机自启 + 立即启动"两个服务（VictoriaMetrics 沿用之前建好的服务名 `victoria-metrics`）；`status` 确认都是 `active (running)`。

验证两端健康：

```bash
curl http://127.0.0.1:9090/-/healthy
curl http://127.0.0.1:8428/health
```

`/-/healthy` 是 Prometheus 的健康检查，返回 `Prometheus Server is Healthy.`；`/health` 是 VictoriaMetrics 的健康检查，返回 `OK`。

确认数据真的通过 remote_write 进了 VM：

```bash
curl 'http://127.0.0.1:8428/api/v1/query?query=up'
curl http://127.0.0.1:8428/api/v1/label/__name__/values | grep up
```

第一条用 Prometheus 风格的查询接口查 `up` 指标——如果返回了 `up{instance="localhost:9090", job="prometheus"}` 且值为 1，就说明 Prometheus 采集到的数据已经通过 remote_write 写进了 VM；第二条列出 VM 里的所有指标名并过滤 `up`，进一步确认。

注意两点：`remote_write` 只转发"开启之后新采集到的样本"，开启前的历史数据不会自动回填；VM 的查询接口 `/api/v1/query` 与 Prometheus 一致，所以 Grafana 等工具可以无缝指向 VM。

## 五、Grafana 查询 VictoriaMetrics

Grafana 里新增一个 **Prometheus** 类型的数据源，URL 填 VM 的地址：

```text
http://127.0.0.1:8428
```

因为 VM 兼容 Prometheus 的查询 API，PromQL 表达式照写即可，数据来自长期存储。这样 Grafana 的仪表盘可以查几个月前的历史数据，而不用受 Prometheus 本地 15 天保留期的限制。

## 六、两种进阶方式

### 6.1 让 Prometheus 读回 VM 历史数据（remote_read）

如果希望 Prometheus 的查询能覆盖 VM 里的长期数据，在 `prometheus.yml` 加：

```yaml
remote_read:
  - url: "http://127.0.0.1:8428/api/v1/read"
    read_recent: true
```

`remote_read.url` 指向 VM 的远程读接口 `/api/v1/read`；`read_recent: true` 表示也读 Prometheus 本地保留期内最近的数据（配合本地存储一起用）。配置后 Prometheus 的查询会合并本地和 VM 的结果。配置完用 `promtool check config /etc/prometheus/prometheus.yml` 校验再重启。

### 6.2 用 VictoriaMetrics 直接抓取（替代 Prometheus）

VM 也能自己当采集器，直接抓取目标、完全替代 Prometheus。给 VM 加一个 `-promscrape.config` 参数，指向一个标准 Prometheus 抓取配置：

```bash
victoria-metrics-prod \
  -storageDataPath=/var/lib/victoria-metrics \
  -promscrape.config=/etc/victoria-metrics/prometheus.yml
```

这个配置文件就是普通的 Prometheus 抓取配置（`scrape_configs`），VM 按同样的语义周期抓取并直接落库。好处是少维护一个 Prometheus；代价是告警功能需要搭配 VM 生态的 `vmalert`。本文主线仍然推荐"Prometheus 抓取 + remote_write"的经典组合。

## 七、常见问题

### VM 里查不到数据

先确认两端健康（`/-/healthy`、`/health`），再确认 `remote_write.url` 写的是 `/api/v1/write`，且 Prometheus 主机能连通 VM 的 8428 端口。记住只有开启 remote_write 之后的新样本才会写入。

### 写入量大时丢失样本

调大 `queue_config` 的 `capacity`、`max_shards`，适当提高 `max_samples_per_send`；同时关注 VM 磁盘和网络是否成为瓶颈。

### 只想存一部分指标

用 `write_relabel_configs` 在发送前按指标名或标签过滤，详见第三节。

### Grafana 查到的时间范围不对

确认数据源 URL 指向 VM（8428）而不是 Prometheus（9090），并检查 VM 的 `-retentionPeriod` 是否足够长。

### 需要回填历史数据

`remote_write` 不会自动回填。要迁移 Prometheus 已有的历史数据，需要用 `vmctl` 之类的工具做一次性迁移（VM 生态的 `vmutils` 包里包含 `vmctl`）。

## 官方文档

- [Prometheus 官方下载](https://prometheus.io/download/)
- [Prometheus 配置说明](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Prometheus remote_write 说明](https://prometheus.io/docs/practices/remote_write/)
- [VictoriaMetrics 快速开始](https://docs.victoriametrics.com/quickstart/)
- [VictoriaMetrics Prometheus 兼容性](https://docs.victoriametrics.com/single-server-victoriametrics/)

*命令和配置依据 Prometheus 与 VictoriaMetrics 官方文档整理，核对日期：2026 年 10 月 15 日。软件版本和参数默认值可能随官方发布变化，请以上述官方文档为准。*
