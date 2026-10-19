---
layout: post
title: CentOS Stream 9 安装 Milvus 向量数据库（Docker Compose 单机版）
description: 在 CentOS Stream 9 上用 Docker Compose 部署 Milvus 单机版：下载官方 compose 文件、理解 etcd/MinIO/standalone 各服务、启动验证，并用 pymilvus 连接建库测试。
date: 2026-10-12 00:00:00 +0800
tags: [CentOS Stream 9, Milvus, Docker, 向量数据库, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上用 **Docker Compose** 部署 **Milvus 单机版（standalone）**。Milvus 是面向向量检索的开源数据库，常和向量模型（例如上一篇文章里的 `qwen3-embedding:4b`）搭配，用于 RAG 检索、语义搜索、推荐等场景。

> 示例以 Milvus v3.0.2 的官方 compose 文件为准，核对日期：2026 年 10 月 12 日。Milvus 版本更新较快，动手前建议到 [Milvus Releases](https://github.com/milvus-io/milvus/releases) 确认最新稳定版，把下文命令里的版本号替换掉即可。

## 一、准备工作：Docker 与 Compose

Milvus 单机版通过 Docker 容器运行，要求宿主机已安装 Docker 引擎和 Compose v2 插件（即 `docker compose` 子命令，中间是空格）。确认：

```bash
docker --version
docker compose version
sudo systemctl status docker --no-pager
```

`docker --version` 显示 Docker 客户端版本；`docker compose version` 确认 Compose v2 插件可用（如果是旧版独立的 `docker-compose`，命令是 `docker-compose`，但本文统一用新版 `docker compose`）；`systemctl status docker` 确认 Docker 守护进程在运行。没有安装的话，参考本博客的《CentOS Stream 9 安装 Docker》一文先装好。

还需要确认资源：Milvus 的 etcd、MinIO、standalone 三个容器一起运行，建议内存至少 8 GB、磁盘预留 10 GB 以上。

```bash
free -h
df -h
```

## 二、先理解部署架构

单机版 Milvus 由三个服务组成，它们都定义在同一个 compose 文件里：

| 服务 | 镜像 | 作用 |
| --- | --- | --- |
| `etcd` | `quay.io/coreos/etcd` | 存储元数据：集合 schema、索引信息、各组件状态等 |
| `minio` | `milvusdb/minio` | 对象存储：保存向量数据、日志、索引文件等实际数据 |
| `standalone` | `milvusdb/milvus` | Milvus 本体，`milvus run standalone` 在单个进程里跑起协调与执行组件 |

理解这个结构对排障很有用：Milvus 把"元数据"交给 etcd、把"文件数据"交给 MinIO，自己负责计算和对外服务。单机版把 Milvus 的所有协调器、查询节点等合并在一个 `standalone` 进程里；数据量大、需要横向扩展时才改用集群版（Kubernetes + Milvus Operator），本文不展开。

## 三、下载官方 compose 文件

```bash
curl -fLo docker-compose.yml https://github.com/milvus-io/milvus/releases/download/v3.0.2/milvus-standalone-docker-compose.yaml
```

`curl` 的 `-f` 表示遇到 HTTP 错误时直接失败（不输出错误页），`-L` 跟随重定向，`-o docker-compose.yml` 把内容写入本地文件。也可以换成 `wget ... -O docker-compose.yml`。建议先看一眼文件内容再启动：

```bash
less docker-compose.yml
```

## 四、理解 compose 文件里的关键内容

打开后能看到几个要点：

- 文件顶部用 `x-milvus-image: &milvus-image milvusdb/milvus:v3.0.2` 定义了一个镜像别名，后面用 `*milvus-image` 引用，保证 `standalone` 等容器使用同一个镜像和版本。
- `milvus-volume-init` 是一个**一次性初始化容器**：它以 root 身份（`user: "0:0"`）运行，把 `/var/lib/milvus` 数据目录的属主改成容器内的 milvus 用户，并写一个标记文件，下次启动时如果标记还在就跳过。它不接网络、只读运行、不自动重启。
- 各服务的数据都挂载到宿主机的 `./volumes/...` 目录：`volumes/etcd`、`volumes/minio`、`volumes/milvus`。路径里的 `${DOCKER_VOLUME_DIRECTORY:-.}` 表示可以先用环境变量 `DOCKER_VOLUME_DIRECTORY` 指定数据根目录，不指定则默认是当前目录。
- 端口映射：`standalone` 暴露 `19530`（客户端 gRPC 接口）和 `9091`（指标与健康检查）；`minio` 暴露 `9000`（对象存储 API）和 `9001`（MinIO 控制台）。
- MinIO 默认账号密码是 `minioadmin` / `minioadmin`，定义在 `minio` 服务的环境变量里。

## 五、启动服务

在 compose 文件所在目录执行：

```bash
sudo docker compose up -d
```

`docker compose up` 读取当前目录的 `docker-compose.yml` 创建并启动所有服务；`-d` 表示后台运行。第一次执行会先从镜像仓库拉取 milvus、etcd、minio 三个镜像（milvus 镜像较大，需要一点时间），之后自动创建容器并启动。

如果拉取镜像很慢，可以按《CentOS Stream 9 安装 Docker》里的方法配置国内镜像加速器。如果想指定数据目录，启动前先设置：

```bash
export DOCKER_VOLUME_DIRECTORY=/data/milvus
sudo docker compose up -d
```

这样数据就会写到 `/data/milvus/volumes/` 下的三个子目录里。

查看容器状态：

```bash
sudo docker compose ps
```

`docker compose ps` 列出各容器及健康状态。standalone 首次启动要初始化，健康检查里设置了 90 秒的等待期（`start_period: 90s`），所以可能要等一两分钟才变成 `healthy`，属正常现象。可以持续看日志：

```bash
sudo docker compose logs -f standalone
```

`logs -f` 持续跟踪日志输出，按 `Ctrl+C` 退出查看（不会停止容器）。

## 六、验证服务是否就绪

```bash
curl http://localhost:9091/healthz
sudo ss -lntp | grep -E '19530|9091|9000|9001'
```

`curl http://localhost:9091/healthz` 访问健康检查接口，服务正常时返回 `OK`；`ss -lntp | grep` 查看宿主机上是否已监听 19530、9091、9000、9001 端口，确认端口映射生效。

## 七、用客户端连接并验证

Milvus 的 Python 客户端是 `pymilvus`。安装：

```bash
python3 -m venv ~/milvus-env
source ~/milvus-env/bin/activate
pip install pymilvus
```

`python3 -m venv` 创建一个独立的 Python 虚拟环境，避免污染系统环境；`source .../activate` 激活它；`pip install pymilvus` 在虚拟环境里安装客户端。不想用虚拟环境的话，直接 `pip install --user pymilvus` 也可以。

连接并做一次"建库 → 列出 → 删除"的完整验证：

```bash
python3 - <<'PY'
from pymilvus import MilvusClient

client = MilvusClient(uri="http://localhost:19530")
print("collections:", client.list_collections())

client.create_collection(collection_name="demo", dimension=2560)
print("after create:", client.list_collections())

client.drop_collection(collection_name="demo")
print("after drop:", client.list_collections())
PY
```

`MilvusClient(uri=...)` 指向本机 19530 端口；`create_collection` 创建一个名为 `demo`、向量维度为 2560 的集合——这里特意用 2560 维，和上一篇 `qwen3-embedding:4b` 的输出维度一致，后续可以把该模型生成的向量直接写入。`list_collections` 列出所有集合，`drop_collection` 删除集合。能依次看到 `[]`、`['demo']`、`[]` 就说明整条链路可用。

## 八、数据与安全配置

数据目录：默认在 compose 文件所在目录下的 `volumes/{milvus,etcd,minio}`，也可以像上文那样用 `DOCKER_VOLUME_DIRECTORY` 改到数据盘。备份时把这三个目录一起备份即可。

MinIO 凭据：默认 `minioadmin` / `minioadmin`，生产环境应改掉。在 compose 文件里修改 `minio` 服务的 `MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY`，同时把 `standalone` 服务里对应的连接信息一并更新，再 `docker compose up -d` 重建。

端口安全：`19530` 是客户端接口、`9000/9001` 是 MinIO 接口和网页控制台，默认都监听所有网卡。这些端口没有内置认证，**不要直接暴露到公网**。只在本机使用就不用动；跨机器调用建议走内网、VPN 或 SSH 隧道，必要时用防火墙只放行可信来源：

```bash
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.0.0.20/32" port port="19530" protocol="tcp" accept'
sudo firewall-cmd --reload
```

## 九、停止与清理

停止并移除容器（保留数据卷，下次 `up -d` 数据还在）：

```bash
sudo docker compose down
```

连同数据一起删除（**不可恢复**，会清掉所有集合数据）：

```bash
sudo docker compose down -v
```

`down` 停止并删除容器和默认网络；`-v` 额外删除 compose 创建的具名数据卷。日常升级或重启用 `docker compose restart` 即可，不要轻易加 `-v`。

## 十、备选：standalone_embed.sh 一键启动

Milvus 还提供了一个带内嵌 etcd 的一键脚本，适合快速体验、不想自己维护 compose 文件的情况：

```bash
curl -sfL https://raw.githubusercontent.com/milvus-io/milvus/master/scripts/standalone_embed.sh -o standalone_embed.sh

bash standalone_embed.sh start
```

`curl -sfL ... -o standalone_embed.sh` 下载官方脚本（`-s` 静默、`-f` 出错即失败、`-L` 跟随重定向、`-o` 保存到文件）；`bash standalone_embed.sh start` 执行脚本并启动内嵌 etcd 的 Milvus 单机，脚本会自动生成 `embedEtcd.yaml` 等配置并拉起容器。

> 常见问题：如果报 `error mounting ".../embedEtcd.yaml" ... not a directory`，说明脚本需要的 `embedEtcd.yaml` 文件没有生成。先 `ls` 确认脚本目录下有没有这个文件，没有的话参考脚本里 `cat > embedEtcd.yaml` 那段手动补一份，或改用本文前几节的官方 compose 方式（etcd + MinIO + standalone），更稳。

## 十一、常见问题

### `docker compose` 提示找不到命令

说明装的是旧版独立 Compose，或没装 compose 插件。用 `docker compose version` 确认；旧版改用 `docker-compose` 命令，或升级 Docker 并安装 `docker-compose-plugin`。

### 拉取镜像很慢或失败

配置 Docker 国内镜像加速器（见 Docker 安装一文），或用代理。Milvus 镜像体积较大，首次下载耐心等待。

### standalone 一直是 `unhealthy` 或起不来

先看日志：`sudo docker compose logs standalone`。常见原因是内存不足（etcd + minio + milvus 一起约需数 GB）或 etcd/MinIO 未就绪。确认 `docker compose ps` 里三个服务状态，必要时调大内存再重试。

### 端口被占用

19530、9091、9000、9001 中任意一个被占用都会导致对应容器起不来。用 `sudo ss -lntp | grep <端口>` 找到占用进程，或修改 compose 文件里的宿主机端口映射（只改冒号左侧的宿主机端口即可）。

### 连接 19530 超时

确认容器已 `healthy`、`curl http://localhost:9091/healthz` 返回 OK、防火墙或云安全组放行了 19530（仅本机调用则无需放行）。

## 官方文档

- [Milvus 官方文档：Docker Compose 安装单机版](https://milvus.io/docs/install_standalone-docker.md)
- [Milvus Releases](https://github.com/milvus-io/milvus/releases)
- [pymilvus 客户端文档](https://milvus.io/docs/install-pymilvus.md)
- [Milvus 快速开始](https://milvus.io/docs/quickstart.md)

*命令和配置依据 Milvus v3.0.2 官方 compose 文件与文档整理，核对日期：2026 年 10 月 12 日。镜像、端口和配置可能随版本变化，具体以官方文档和实际下载的 compose 文件为准。*
