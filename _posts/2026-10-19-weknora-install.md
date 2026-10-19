---
layout: post
title: CentOS Stream 9 安装 WeKnora：腾讯开源 RAG 知识库框架
description: 介绍腾讯开源的 WeKnora 知识库框架：功能、架构、可集成的数据库与外围软件，以及在 CentOS Stream 9 上用 Docker Compose 完成部署、配置本地 Ollama 模型、首次初始化，每步都有解释。
date: 2026-10-19 00:00:00 +0800
tags: [CentOS Stream 9, WeKnora, RAG, 知识库, 大模型, Docker]
---

本文介绍腾讯开源的 **WeKnora**（[Tencent/WeKnora](https://github.com/Tencent/WeKnora)）：一个基于大模型的企业级知识库 / RAG 框架，能把文档变成"可问答的知识库"，并支持 Agent 多步推理和自动 Wiki。文章覆盖它的功能、架构、可集成的数据库与外围软件，以及在 **CentOS Stream 9** 上通过 Docker Compose 完成部署和首次初始化，每一步都有解释。

> 本文核对版本为 v0.8.3（2026 年 10 月 14 日发布），MIT 协议。WeKnora 迭代较快，命令和默认端口可能变化，具体以 [官方文档](https://weknora.weixin.qq.com/docs/) 和仓库为准。

## 一、WeKnora 是什么

WeKnora 是一套"把原始文档变成可查询知识"的开源框架。把 PDF、Word、网页、飞书文档等丢进去，它能完成解析、切块、向量化、语义检索，让你用自然语言提问并得到带引用出处的答案。在此基础上还有三层能力：

- **RAG 问答**：基于知识库的检索增强问答，答案带来源引用，支持关键词 + 向量混合检索、重排、父级切块等。
- **Agent 推理**：多步任务执行，可调用知识库、网络搜索、MCP 工具、技能（Skills）和沙箱。
- **自动 Wiki**：把知识库文档自动整理成带知识图谱的 Wiki 页面，可编辑、可回滚。

它还带多租户权限（工作区 + 四角色 RBAC）、审计日志、Langfuse 可观测、IM 渠道接入（企业微信、飞书、Slack 等）等企业级能力。

## 二、核心架构

WeKnora 是一条模块化流水线，每个环节都可替换：

```text
客户端/渠道（Web、IM、MCP、CLI）
          │
          ▼
      WeKnora App（Go 后端）
   ┌─────────────────────────────┐
   │ 文档解析 → 切块 → 向量化     │
   │ → 检索 → 重排 → LLM 推理     │
   └─────────────────────────────┘
          │ 调用
          ▼
   运行时服务（docreader 文档解析等）
          │
          ▼
   数据存储：PostgreSQL + Redis + 向量库 + 对象存储（+ 可选 Neo4j）
```

各组件职责：

| 组件 | 作用 |
| --- | --- |
| `frontend`（Nginx + UI） | Web 界面，默认 80 端口 |
| `app`（Go 后端） | 核心业务、RAG 流水线、API，默认 8080 端口 |
| `docreader` | 文档解析服务（gRPC，默认 50051），负责把 PDF/Word 等转成可检索内容 |
| PostgreSQL | 元数据：知识库、文档、用户、会话等，默认也是向量库（pgvector） |
| Redis | 任务队列与缓存（asynq 异步任务） |
| 向量库（可选替换） | Milvus / Qdrant / Elasticsearch / OpenSearch / Weaviate 等 |
| 对象存储（可选替换） | 默认本地盘，也可换 MinIO / S3 / 腾讯 COS / 阿里 OSS 等 |
| Neo4j（可选） | 知识图谱 GraphRAG |
| Langfuse（可选） | 调用链追踪与 token 统计 |

## 三、可以集成的数据库和外围软件

WeKnora 的设计原则是"所有后端都可换"，按组件分类如下（v0.8.3）：

| 组件 | 支持选项 |
| --- | --- |
| 大模型 LLM | 29 家内置厂商：OpenAI、Azure OpenAI、Anthropic、DeepSeek、通义千问、智谱、混元、豆包、Gemini、MiniMax、NVIDIA、SiliconFlow、OpenRouter、LiteLLM、Ollama 等 |
| Embedding 向量化 | Ollama、BGE、GTE、智谱、OpenAI 兼容接口 |
| 向量数据库 | PostgreSQL(pgvector，默认)、Elasticsearch、OpenSearch、Milvus、Weaviate、Qdrant、Apache Doris、腾讯 VectorDB |
| 对象存储 | 本地盘（默认）、腾讯 COS、MinIO、AWS S3、火山 TOS、阿里 OSS、金山 KS3、华为 OBS |
| 数据源同步 | 飞书、飞书云文档、Confluence、GitLab、Notion、语雀、钉钉文档、Seafile、RSS 等 |
| IM 渠道 | 企业微信、飞书、QQBot、Slack、Telegram、钉钉、Mattermost、微信、云之家 |
| 网络搜索 | DuckDuckGo、Bing、Google、Tavily、百度、SearXNG、Exa、Metaso 等 |
| 可观测 | Langfuse（追踪、token 统计） |

部署形态也有多种：Docker Compose（标准）、Kubernetes（Helm）、Lite 单二进制（SQLite + 内存队列，低资源）、桌面 App。

## 四、部署前准备（CentOS Stream 9）

WeKnora 标准部署需要 Docker 和 Docker Compose，以及 Git。

### 4.1 安装 Docker 与 Compose

```bash
sudo docker --version
sudo docker compose version
```

没有装的话，参考本博客《CentOS Stream 9 安装 Docker》一文装好 Docker 引擎和 compose 插件。`docker compose`（中间空格）是 v2 写法，WeKnora 依赖它。

### 4.2 安装 Git 并确认资源

```bash
sudo dnf install -y git
free -h
df -h
```

`git` 用于克隆代码仓库；`free -h`、`df -h` 看内存和磁盘。WeKnora 要同时跑前端、后端、docreader、PostgreSQL、Redis 等多个容器，建议内存 8 GB 以上、磁盘预留 20 GB 以上。大模型（LLM/Embedding）可走外部 API 或本机 Ollama，不在这些容器里跑。

## 五、部署 WeKnora

### 5.1 获取代码和配置

```bash
git clone https://github.com/Tencent/WeKnora.git
cd WeKnora
cp .env.example .env
```

`git clone` 下载仓库；`cp .env.example .env` 从示例配置复制出一份真实配置。`.env` 里是大量环境变量（模型、数据库、向量库、存储、密钥等），大部分有默认值，可以开箱即用，但**密钥必须设置**。

### 5.2 生成并填写密钥

生产环境必须设置两个密钥，先各自生成随机值：

```bash
openssl rand -hex 32   # JWT 签名密钥
openssl rand -hex 16   # AES 主密钥（32 字节 ASCII）
```

把生成的两串值填进 `.env`：

```bash
JWT_SECRET=上面第一串
SYSTEM_AES_KEY=上面第二串
```

`JWT_SECRET` 用于登录刷新 Token 的签名；`SYSTEM_AES_KEY` 是 AES-256 主密钥，负责加密数据库里的 API Key、模型密钥、向量库凭证等敏感字段（必须是 32 字节）。**丢失后已加密字段无法解密，要妥善保管**；升级时也必须沿用旧值。

编辑 `.env`：

```bash
vi .env
```

### 5.3 拉取镜像并启动

```bash
docker compose pull
docker compose up -d
```

`docker compose pull` 先把各服务镜像拉下来（前端 `wechatopenai/weknora-ui`、后端 `wechatopenai/weknora-app`、docreader、PostgreSQL、Redis 等）；`up -d` 后台创建并启动所有容器。首次拉镜像要一点时间，国内网络慢可参考 Docker 安装一文配置镜像加速。

查看状态：

```bash
docker compose ps
curl http://127.0.0.1:8080/health
```

`docker compose ps` 列出容器和健康状态；`curl .../health` 访问后端健康检查，正常返回表示后端已就绪。前端健康后，浏览器打开：

```text
http://服务器IP
```

默认端口：Web UI 是 80，后端 API 是 8080。首次打开会进入初始化引导，按提示注册管理员账号即可。

## 六、配置本地 Ollama 模型（可选，推荐离线使用）

如果不想依赖云端大模型，可以接本机的 Ollama（参考本博客《CentOS Stream 9 安装 Ollama》）。WeKnora 的 `.env` 里默认：

```bash
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

`host.docker.internal` 在 Docker Desktop（Mac/Windows）上能直接指向宿主机，但 **Linux 上不一定能解析**。在 CentOS 上，如果 Ollama 就跑在这台机器，推荐两步：

1. 让 Ollama 监听局域网：`OLLAMA_HOST=0.0.0.0:11434` 并重启 ollama。
2. 把 `OLLAMA_BASE_URL` 改成宿主机能被容器访问到的地址，例如 `http://172.17.0.1:11434`（Docker 默认网桥网关）或宿主机的内网 IP。

改完 `.env` 后执行 `docker compose up -d` 重新创建后端容器。进入 Web 界面的模型配置里，把 LLM 和 Embedding 都选 Ollama，填上你已 `ollama pull` 的模型名（例如对话模型和 `qwen3-embedding` 这类向量模型）即可。

## 七、首次使用

1. 浏览器打开 `http://服务器IP`，按引导注册管理员账号、登录。
2. 在"模型"里配置 LLM 和 Embedding：填厂商、模型名、API 地址和密钥（用 Ollama 则填本机地址，不需要密钥）。
3. 新建知识库，上传几篇文档（支持 PDF、Word、PPT、Excel、Markdown、HTML、图片等十多种格式）。
4. 等文档解析、切块、向量化完成后，在对话里提问，答案会带来源引用。

至此，一个本机私有化、可用自然语言问答的知识库就建好了。

## 八、可选组件（profile 方式开启）

WeKnora 的部分组件默认不启动，需要加 `--profile` 开启，多个可组合：

```bash
docker compose --profile neo4j --profile minio up -d
```

| Profile | 增加的组件 |
| --- | --- |
| （默认） | 核心服务：前端、后端、docreader、PostgreSQL、Redis |
| `full` | 全部功能 |
| `neo4j` | Neo4j 知识图谱（GraphRAG） |
| `minio` | MinIO 对象存储 |
| `langfuse` | Langfuse 追踪（Web 界面 3000 端口） |

例如要启用知识图谱，先 `--profile neo4j` 拉镜像并启动，再在 `.env` 里设 `NEO4J_ENABLE=true` 和相关连接信息。

## 九、升级与停止

升级到新版本：先把 `.env` 里的 `WEKNORA_VERSION` 设为目标版本（如 `0.8.3`）或保持 `latest`，再：

```bash
docker compose pull
docker compose up -d
```

`up -d` 会按新镜像重建容器；数据库迁移通常会自动执行。**注意**：直接 `up -d` 会复用本地旧缓存镜像，可能造成前端版本和下载的 release 不一致，所以升级前先 `pull`，并阅读对应版本的 [升级说明](https://weknora.weixin.qq.com/docs/07-releases/v0.8.3)。

停止服务：

```bash
docker compose down
```

`down` 停止并删除容器（保留数据卷），下次 `up -d` 数据还在。

## 十、安全建议

WeKnora 自带登录认证，但官方仍强烈建议：

- 部署在**内网 / 私有网络**，不要直接暴露到公网；
- 配置防火墙和访问控制；
- 及时升级到最新版本；
- 生产环境务必设置 `JWT_SECRET`、`SYSTEM_AES_KEY`，并妥善保管；
- 需要时设 `DISABLE_REGISTRATION=true` 禁止随意注册。

## 十一、常见问题

### 拉镜像很慢

配置 Docker 国内镜像加速器（见 Docker 安装一文），再 `docker compose pull`。

### 打开网页提示后端连不上

用 `docker compose ps` 看各容器健康状态，`curl http://127.0.0.1:8080/health` 确认后端就绪；再看 `docker compose logs app` 排查数据库连接、密钥格式等问题。

### 80 或 8080 端口被占用

在 `.env` 里改 `FRONTEND_PORT` 和 `APP_PORT`，再 `docker compose up -d`。

### 文档解析失败或很慢

确认 `docreader` 容器健康；大文件或扫描件解析耗时较长，可在 `.env` 里调大 `WEKNORA_DOCUMENT_PROCESS_TIMEOUT` 等超时参数。

### Ollama 模型连不上

按第六节检查 `OLLAMA_BASE_URL`，Linux 上 `host.docker.internal` 经常不解析，改成宿主机内网 IP 或 `172.17.0.1`，并确认 Ollama 监听 `0.0.0.0:11434`。

### 想换成 Milvus 做向量库

把 `.env` 里 `RETRIEVE_DRIVER=milvus`，并配置 `MILVUS_ADDRESS`、`MILVUS_COLLECTION` 等（本博客有《CentOS Stream 9 安装 Milvus》可参考），再 `docker compose up -d`。

## 官方资源

- [项目仓库 Tencent/WeKnora](https://github.com/Tencent/WeKnora)
- [官网与文档](https://weknora.weixin.qq.com/docs/)
- [安装指南](https://weknora.weixin.qq.com/docs/01-getting-started/02-installation)
- [配置说明（环境变量与模型）](https://weknora.weixin.qq.com/docs/01-getting-started/04-configuration)
- [v0.8.3 发布说明](https://weknora.weixin.qq.com/docs/07-releases/v0.8.3)

*内容依据 WeKnora 官方 README、docker-compose.yml 与 .env.example 整理，核对日期：2026 年 10 月 19 日。版本、默认端口和环境变量可能随发布变化，请以上述官方文档为准。*
