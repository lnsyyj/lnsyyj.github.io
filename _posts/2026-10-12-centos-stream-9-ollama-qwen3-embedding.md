---
layout: post
title: CentOS Stream 9 安装 Ollama 并运行 qwen3-embedding:4b
description: 在 CentOS Stream 9 上安装 Ollama，启动服务并配置环境变量，拉取并运行 Qwen3-Embedding-4B 向量模型，通过原生与 OpenAI 兼容接口测试文本向量生成。
date: 2026-10-12 00:00:00 +0800
categories: [技术, 大模型]
tags: [CentOS Stream 9, Ollama, Qwen, 大模型, 向量, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上安装 **Ollama**，并拉取、运行 **qwen3-embedding:4b** 文本向量（Embedding）模型。每一步都会解释命令和配置项的含义，最后通过 Ollama 的原生接口和 OpenAI 兼容接口验证向量生成。

> 示例命令面向 CentOS Stream 9 的 x86_64 主机。Ollama 默认监听 `127.0.0.1:11434`，只对本机开放；如果要给其他机器调用，需要单独配置并注意安全，后文会说明。

## 一、准备工作

先确认系统版本、内存、磁盘和是否装了 GPU：

```bash
cat /etc/os-release | grep VERSION_ID
free -h
df -h
lspci | grep -i nvidia
```

`cat /etc/os-release | grep VERSION_ID` 确认系统是 CentOS Stream 9（输出 `VERSION_ID="9"`）；`free -h` 查看内存总量和剩余量；`df -h` 查看磁盘空间；`lspci | grep -i nvidia` 检查是否有 NVIDIA 显卡（没有输出说明是纯 CPU 环境）。

`qwen3-embedding:4b` 是一个 40 亿参数量的向量模型，量化后模型文件约 2.4 GB。运行时会完整加载到内存里，所以建议内存至少 8 GB、磁盘预留 5 GB 以上。没有 GPU 也能用（Ollama 会自动退回 CPU 推理），只是生成速度慢一些；有 NVIDIA GPU 时 Ollama 会自动使用 GPU 加速。

## 二、安装 Ollama

### 2.1 官方一键脚本

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

拆开看每个部分的含义：

- `curl` 是下载工具；`-f` 遇到 HTTP 错误时不输出错误页内容；`-s` 静默模式、不打印下载进度；`-S` 配合 `-s` 使用，出错时仍显示错误信息；`-L` 跟随重定向。
- `| sh` 把下载到的脚本内容通过管道交给 `sh` 执行。

脚本会做几件事：创建 `ollama` 系统用户和用户组、把主程序安装到 `/usr/local/bin/ollama`（库文件在 `/usr/local/lib/ollama`）、并生成 `ollama.service` 系统服务并设为开机启动。

> 安全提示：`curl ... | sh` 等于直接执行远程代码。更稳妥的做法是先下载脚本、查看内容，再执行：

```bash
curl -fsSL https://ollama.com/install.sh -o install.sh
less install.sh
sudo sh install.sh
```

### 2.2 国内网络慢时的处理

安装脚本和模型仓库都在国外服务器上，国内直连可能很慢。可以让下载走 HTTP 代理（替换成自己的代理地址）：

```bash
export HTTPS_PROXY=http://127.0.0.1:7890
curl -fsSL https://ollama.com/install.sh | sh
```

`export HTTPS_PROXY=...` 只在当前终端会话生效，告诉 curl 等工具通过指定代理访问 HTTPS 地址。模型拉取由后台的 `ollama serve` 服务进程完成，代理需要配在服务里，详见后文"四、Ollama 的关键配置"。

### 2.3 手动下载解压（可选）

如果不想用脚本，也可以手动下载二进制包并解压到 `/usr/local`：

```bash
curl -fsSL https://ollama.com/download/ollama-linux-amd64.tgz -o ollama.tgz
sudo tar -C /usr/local -xzf ollama.tgz
```

`tar -C /usr/local -xzf` 把压缩包解压到 `/usr/local`，得到 `/usr/local/bin/ollama` 和 `/usr/local/lib/ollama`。这种方式不会自动创建用户和服务，需要再手动补上系统服务配置，适合定制化部署；日常使用直接走一键脚本即可。

### 2.4 用 Docker 运行 Ollama（备选）

如果你更习惯容器部署，也可以用官方镜像一条命令跑起来：

```bash
docker run -d --name ollama --restart=always \
  -p 11434:11434 \
  -e OLLAMA_HOST=0.0.0.0:11434 \
  ollama/ollama:latest
```

`-d` 后台运行，`--name ollama` 指定容器名，`--restart=always` 开机自启；`-p 11434:11434` 把容器端口映射到宿主机；`-e OLLAMA_HOST=0.0.0.0:11434` 让 Ollama 监听所有网卡，便于其他机器调用。

测试服务是否就绪：

```bash
curl -sS http://localhost:11434/api/tags || echo "tags not ready"
```

`/api/tags` 返回已安装模型列表；服务还没起好时会输出 `tags not ready`，稍等再试。

拉取模型（在容器里执行 `ollama` 命令）：

```bash
docker exec -it ollama ollama pull qwen3-embedding:4b
```

`docker exec -it 容器名 命令` 进入运行中的容器执行命令，这里等价于在容器内跑 `ollama pull qwen3-embedding:4b`。要找其他模型，去 [ollama.com/search](https://ollama.com/search) 搜索。

> 提示：官方 `ollama/ollama` 镜像体积很大（约 3.6GB，内置 GPU 运行时）。国内拉取这种大镜像可能报 `magic number mismatch` 之类的下载损坏错误，这时优先用上文 2.1 的本机安装方式更稳。

## 三、启动并验证

安装脚本通常已经启动并设为开机自启，确认一下：

```bash
ollama --version
sudo systemctl status ollama --no-pager
curl http://127.0.0.1:11434/
```

`ollama --version` 显示客户端版本；`systemctl status ollama` 确认服务状态为 `active (running)`；`curl http://127.0.0.1:11434/` 访问本机 11434 端口，服务正常时返回 `Ollama is running`。

如果没有自动启动，手动启动并设为开机自启：

```bash
sudo systemctl enable --now ollama
```

`enable` 让服务开机自动启动，`--now` 表示启用后立即启动。

## 四、Ollama 的关键配置

Ollama 主要通过环境变量配置，常用几个：

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `OLLAMA_HOST` | `127.0.0.1:11434` | 服务监听的地址和端口 |
| `OLLAMA_MODELS` | `/usr/share/ollama/.ollama/models` | 模型文件存储目录 |
| `OLLAMA_KEEP_ALIVE` | `5m` | 模型加载后在内存中保留多久 |

默认模型目录是 `ollama` 系统用户主目录（`/usr/share/ollama`）下的 `.ollama/models`，官方脚本会把这个用户建在 `/usr/share/ollama`。

修改环境变量推荐用 `systemctl edit`，它会生成一个覆盖文件而不是直接改官方服务文件：

```bash
sudo systemctl edit ollama
```

在打开的编辑器中写入：

```ini
[Service]
Environment="OLLAMA_MODELS=/data/ollama/models"
Environment="HTTPS_PROXY=http://127.0.0.1:7890"
Environment="HTTP_PROXY=http://127.0.0.1:7890"
```

`[Service]` 表示这些配置作用于服务进程；`Environment=` 设置环境变量。上面的例子把模型目录改到数据盘 `/data/ollama/models`，并给服务进程配置代理（模型下载由服务进程完成）。保存后 `systemctl edit` 会自动生成 `/etc/systemd/system/ollama.service.d/override.conf`。

应用并重启：

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

`daemon-reload` 让 systemd 重新读取服务定义，`restart` 重启服务使环境变量生效。

如果只是想让同一内网的其他机器也能调用，把监听地址改成局域网网卡：

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

然后放行防火墙：

```bash
sudo firewall-cmd --permanent --add-port=11434/tcp
sudo firewall-cmd --reload
```

> 安全提示：`0.0.0.0` 会监听所有网卡。不要直接把 11434 端口暴露到公网——Ollama 本身没有身份认证，公网可访问意味着任何人都能用你的机器跑模型。局域网调用可以，跨公网应使用 VPN、SSH 隧道或反向代理加认证。

## 五、拉取 qwen3-embedding:4b 模型

```bash
ollama pull qwen3-embedding:4b
```

`ollama pull 模型名:标签` 从 Ollama 模型库下载指定模型。模型名 `qwen3-embedding` 对应 Qwen3-Embedding 系列，`:4b` 是 40 亿参数版本。同系列还有 `0.6b`、`1.7b`、`8b` 等尺寸：参数量越大，向量质量通常越好，但体积和显存/内存占用也越大。下载过程中会按分片拉取模型权重，完成后自动校验并入库。

查看已下载的模型：

```bash
ollama list
```

查看某个模型的详细信息（参数量、向量维度、量化方式等）：

```bash
ollama show qwen3-embedding:4b
```

输出里 `embedding length` 就是该模型输出的向量维度，`qwen3-embedding:4b` 是 2560 维。同系列各尺寸的维度：`0.6b` 为 1024 维、`1.7b` 为 2048 维、`4b` 为 2560 维、`8b` 为 4096 维。

## 六、运行并测试向量生成

### 6.1 交互式运行

```bash
ollama run qwen3-embedding:4b
```

进入交互模式后，输入一段文本并回车，模型会输出对应的向量。按 `Ctrl+D`（或输入 `/bye`）退出。交互模式适合快速体验，实际开发中更多是通过 HTTP 接口调用。

### 6.2 原生 Embedding 接口

```bash
curl http://127.0.0.1:11434/api/embed -d '{
  "model": "qwen3-embedding:4b",
  "input": "CentOS Stream 9 安装 Ollama"
}'
```

`/api/embed` 是 Ollama 的向量接口；`model` 指定用哪个模型，`input` 是要向量化的文本（可以是字符串，也可以是字符串数组，数组会一次返回多个向量）。返回的 JSON 里 `embeddings` 是一个二维数组，每个元素是一条文本对应的 2560 维向量。

### 6.3 OpenAI 兼容接口

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-embedding:4b","input":"你好，世界"}'
```

`/v1/embeddings` 兼容 OpenAI 的 Embeddings API 格式：`-H "Content-Type: application/json"` 声明请求体是 JSON。返回结果里 `data[0].embedding` 是对应的向量数组。这样已有的、按 OpenAI 格式写的代码只要把 `base_url` 指向 `http://127.0.0.1:11434/v1` 就能直接用。

实际使用中，这些向量常用于检索增强（RAG）、语义搜索、文本聚类等场景：把文档向量化后存进向量数据库，查询时把问题也向量化，再按相似度找最相关的文档。

## 七、常用命令速查

| 操作 | 命令 |
| --- | --- |
| 启动 / 停止 / 重启 / 状态 | `sudo systemctl start/stop/restart/status ollama` |
| 查看版本 | `ollama --version` |
| 拉取模型 | `ollama pull 模型名:标签` |
| 列出已下载模型 | `ollama list` |
| 查看模型详情 | `ollama show 模型名` |
| 交互式运行 | `ollama run 模型名` |
| 查看正在运行的模型 | `ollama ps` |
| 停止某个模型 | `ollama stop 模型名` |
| 删除模型 | `ollama rm 模型名` |

## 八、常见问题

### 安装脚本下载失败或很慢

先确认网络能访问 ollama.com，再按上文给当前终端配置 `HTTPS_PROXY` 后重试。

### 拉模型一直卡住或超时

模型下载由 `ollama serve` 服务进程完成，检查代理是否配置在服务上（`systemctl edit ollama` 里加 `Environment="HTTPS_PROXY=..."`），然后 `daemon-reload` + `restart`。

### 提示内存不足或 OOM

4b 模型加载需要约几 GB 内存。用 `free -h` 确认剩余内存，关闭不用的模型（`ollama stop`），或换更小的 `1.7b`、`0.6b` 版本。用 `OLLAMA_KEEP_ALIVE` 缩短模型驻留时间也能减少长时间占用。

### 外网机器调用失败

Ollama 默认只监听 `127.0.0.1`。确认已把 `OLLAMA_HOST` 改为 `0.0.0.0:11434` 或局域网地址、防火墙已放行 11434，并且调用方网络可达。不要直接对公网暴露无认证的 Ollama 端口。

### 向量维度对不上

不同尺寸的 Qwen3-Embedding 输出维度不同：`4b` 是 2560 维。如果下游向量数据库建表时指定了维度，必须与模型一致，先用 `ollama show qwen3-embedding:4b` 确认 `embedding length`。

## 官方文档

- [Ollama 官方下载与安装](https://ollama.com/download)
- [Ollama Linux 安装说明](https://github.com/ollama/ollama/blob/main/docs/linux.md)
- [Ollama API 文档：Embedding](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Ollama 模型库：qwen3-embedding](https://ollama.com/library/qwen3-embedding)
- [Qwen3-Embedding 模型说明](https://qwenlm.github.io/blog/qwen3-embedding/)

*命令和配置依据 Ollama 官方文档整理，核对日期：2026 年 10 月 12 日。模型体积、输出维度与下载地址可能随版本更新，具体以 `ollama show` 和官方页面为准。*
