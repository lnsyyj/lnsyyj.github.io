---
layout: post
title: CentOS Stream 9 安装 Docker：软件源、配置文件与国内镜像加速
description: 在 CentOS Stream 9 上安装 Docker CE（docker-ce、docker-ce-cli、containerd.io 与插件），添加官方或国内软件源，梳理关键配置文件位置，并配置 daemon.json 镜像加速器。
date: 2026-10-12 00:00:00 +0800
tags: [CentOS Stream 9, Docker, Linux, 容器, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上安装 **Docker CE（社区版）**，并完成卸载旧版本、添加软件源（含国内源替换）、安装引擎、设置开机自启、验证安装，以及最常用的两类"国内源"配置：软件仓库镜像与镜像拉取加速器。文章还会汇总 Docker 的关键配置文件位置，方便日常排查和维护。

> 示例命令面向 CentOS Stream 9 的 x86_64 主机。如果 `uname -m` 输出不是 `x86_64`，请把示例中的路径替换为对应架构。安装需要 root 或具有 sudo 权限的账号；下文统一使用 `sudo` 前缀，直接以 root 登录时可省略。

## 一、确认系统信息

先确认发行版、内核和 CPU 架构：

```bash
cat /etc/centos-release
uname -r
uname -m
```

`cat /etc/centos-release` 显示发行版名称与版本，用于确认系统确实是 CentOS Stream 9；`uname -r` 显示内核版本，Docker 依赖较新的内核特性（CentOS Stream 9 默认使用 5.14 内核，已经满足要求）；`uname -m` 显示 CPU 架构，`x86_64` 表示 64 位 x86，可以直接使用本文命令。

## 二、卸载旧版本 Docker（可选但建议）

如果系统里装过旧版 Docker（CentOS 源里的 `docker`、`docker-engine` 等），先卸载，避免和新版 `docker-ce` 冲突：

```bash
sudo dnf remove -y \
  docker \
  docker-client \
  docker-client-latest \
  docker-common \
  docker-latest \
  docker-latest-logrotate \
  docker-logrotate \
  docker-engine
```

`dnf remove` 是卸载命令，`-y` 表示自动确认，行尾的 `\` 是续行符，把多行合并成一条命令。上面列出的都是旧版包名；如果从未安装过，dnf 会提示 `No match for argument`，这属于正常现象，可以忽略，不影响后续安装。

这一步删除的只是软件包，不会删除已有的镜像、容器和 `/var/lib/docker` 数据目录。

## 三、安装 dnf-plugins-core

```bash
sudo dnf install -y dnf-plugins-core
```

`dnf` 是 CentOS 8/9 的包管理器（yum 的继任者）。`dnf-plugins-core` 提供 `dnf config-manager` 等插件命令，后面添加 Docker 软件源要用的 `dnf config-manager --add-repo` 正是由这个包提供的，因此要先安装。

## 四、添加 Docker 软件源

### 4.1 软件源是什么

软件源（repository，简称 repo）是一台存放 rpm 软件包及其元数据（包名、版本、依赖关系、校验和等）的服务器。dnf 安装软件时，会先从源里下载元数据，再根据元数据找到并下载需要的安装包。CentOS Stream 9 自带的源里没有 Docker CE，所以需要额外添加 Docker 官方源。

### 4.2 添加 Docker 官方源

```bash
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

`dnf config-manager --add-repo <URL>` 会下载指定地址的 `.repo` 文件并保存到 `/etc/yum.repos.d/` 目录，生成 `/etc/yum.repos.d/docker-ce.repo`。这个目录是 dnf 读取软件源配置的地方，每个 `.repo` 文件定义一个或多个源。

### 4.3 软件源配置文件位置

- 源配置目录：`/etc/yum.repos.d/`
- Docker 源文件：`/etc/yum.repos.d/docker-ce.repo`

查看文件内容：

```bash
cat /etc/yum.repos.d/docker-ce.repo
```

文件里以 `[docker-ce-stable]` 这样的方括号段落定义源，常见字段含义：

| 字段 | 含义 |
| --- | --- |
| `name` | 源的显示名称 |
| `baseurl` | 软件包下载地址 |
| `gpgcheck=1` | 是否校验软件包 GPG 签名（1 表示校验，建议保持开启） |
| `gpgkey` | GPG 公钥地址，用于校验签名 |
| `enabled=1` | 是否启用该源（1 启用，0 禁用） |

### 4.4 换成国内源

访问 Docker 官方源在国内可能较慢，可以把仓库地址换成国内镜像。两种做法任选其一，推荐第一种：

方式一：直接添加国内镜像的 `.repo` 文件（阿里云）：

```bash
sudo dnf config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

其他可选镜像：

```bash
# 中科大 USTC
sudo dnf config-manager --add-repo https://mirrors.ustc.edu.cn/docker-ce/linux/centos/docker-ce.repo

# 清华大学 TUNA
sudo dnf config-manager --add-repo https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/docker-ce.repo
```

方式二：先添加官方源，再把下载域名替换为国内镜像域名：

```bash
sudo sed -i 's#https://download.docker.com#https://mirrors.aliyun.com/docker-ce#g' /etc/yum.repos.d/docker-ce.repo
```

`sed -i` 表示原地编辑文件，`s#旧内容#新内容#g` 表示全局替换，这里用 `#` 作分隔符是为了避免 URL 里的 `/` 干扰。命令把官方域名整体替换成阿里云镜像域名。

注意：如果官方源和国内源都添加过，会生成多个 `.repo` 文件且可能重复定义同一个源，建议只保留一个。用 `ls /etc/yum.repos.d/` 查看当前有哪些源文件，多余的用 `sudo rm /etc/yum.repos.d/docker-ce.repo`（仅删除源文件本身）移除，或把不用的源设为 `enabled=0`。

## 五、刷新源缓存并确认

```bash
sudo dnf makecache
sudo dnf repolist
```

`dnf makecache` 根据当前源配置下载软件包元数据并生成缓存，相当于"刷新源列表"；`dnf repolist` 列出当前启用的源，正常情况下应能看到 `docker-ce-stable` 等条目，说明源配置成功。

## 六、安装 Docker

```bash
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

各软件包的作用：

| 软件包 | 作用 |
| --- | --- |
| `docker-ce` | Docker 引擎本体，即守护进程 dockerd |
| `docker-ce-cli` | 命令行客户端 docker |
| `containerd.io` | 容器运行时 containerd，真正负责创建和管理容器 |
| `docker-buildx-plugin` | Buildx 插件，用于构建镜像，支持多平台构建 |
| `docker-compose-plugin` | Compose 插件，用 `docker compose` 编排多容器应用 |

安装过程中如果提示导入 GPG 密钥，输入 `y` 确认即可（源配置正确且已缓存密钥时可能不再提示）。

## 七、启动并设置开机自启

```bash
sudo systemctl start docker
sudo systemctl enable --now docker
```

`systemctl start docker` 立即启动 Docker 守护进程 dockerd；`systemctl enable docker` 让 Docker 在开机时自动启动（它在 systemd 的多用户目标下创建启动链接）；`--now` 表示"启用后立即启动"，所以第二条命令等价于 `enable` + `start` 的组合。日常只需保留 `enable --now` 一条即可。

检查运行状态：

```bash
sudo systemctl status docker --no-pager
```

看到 `active (running)` 表示守护进程正常运行。

## 八、验证安装

```bash
sudo docker version
sudo docker run hello-world
```

`docker version` 分别显示客户端（Client）和服务端（Server）的版本信息，两边都能显示说明客户端与守护进程通信正常。`docker run hello-world` 会从镜像仓库拉取一个极小的测试镜像并运行，输出 `Hello from Docker!` 说明"拉取镜像 → 创建容器 → 运行"整条链路都正常。如果这一步拉取镜像很慢或超时，可以先完成后面的国内镜像加速配置再验证。

## 九、让普通用户也能使用 docker（可选）

Docker 守护进程通过本机的 unix socket（`/var/run/docker.sock`）与客户端通信，默认只有 root 和 docker 组的用户可以访问。把普通用户加入 docker 组后，就能免 sudo 运行 docker：

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

`groupadd docker` 创建 docker 组（已存在会报错，可忽略）；`usermod -aG docker $USER` 把当前用户追加到 docker 组（`-a` 表示追加而非覆盖原有组）；`newgrp docker` 让当前 shell 立即生效，或者注销后重新登录。

> 安全提示：能操作 docker 的用户几乎等同于拥有 root 权限，请只把可信用户加入 docker 组。

## 十、Docker 关键配置文件位置汇总

| 内容 | 位置 | 说明 |
| --- | --- | --- |
| 软件源配置 | `/etc/yum.repos.d/docker-ce.repo` | dnf 使用的仓库定义 |
| 守护进程主配置 | `/etc/docker/daemon.json` | dockerd 配置：镜像加速、存储、日志等 |
| 数据目录 | `/var/lib/docker` | 镜像、容器、数据卷、网络等实际数据 |
| systemd 服务单元 | `/usr/lib/systemd/system/docker.service` | 官方默认服务文件，一般不要直接改 |
| systemd 覆盖配置 | `/etc/systemd/system/docker.service.d/*.conf` | `systemctl edit docker` 生成的覆盖配置，优先级更高 |
| 客户端配置 | `~/.docker/config.json` | 当前用户的 docker CLI 配置（认证、上下文等） |

补充说明：

- `daemon.json` 默认不存在，需要时手动创建；修改后必须重启 Docker 才生效。
- 要改服务启动参数，推荐用 `sudo systemctl edit docker`，它会生成 drop-in 覆盖文件，而不是直接修改官方单元文件，升级时更不容易被覆盖。

## 十一、配置国内镜像加速器（registry mirror）

### 11.1 原理

`docker pull` / `docker run` 默认从 Docker Hub（`registry-1.docker.io`）拉取镜像，国内直接访问经常很慢甚至超时。"镜像加速器"是 registry 的镜像/缓存服务，配置后 dockerd 会优先从加速地址拉取镜像。

### 11.2 时效性提示

2024 年起，很多免费公共加速器（如 USTC、网易 163、DaoCloud 等）陆续关停或限制访问。目前相对稳定的是阿里云"容器镜像服务"提供的**个人专属加速地址**（每个账号一个地址）。配置前建议先确认所用加速地址当前仍可用。

获取阿里云加速地址：登录阿里云控制台 → 容器镜像服务 ACR → 镜像工具 → 镜像加速器，页面会显示类似 `https://xxxx.mirror.aliyuncs.com` 的专属地址。

### 11.3 配置方法

创建或编辑 `/etc/docker/daemon.json`：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://xxxx.mirror.aliyuncs.com"
  ]
}
EOF
```

`mkdir -p` 确保 `/etc/docker` 目录存在；`tee` 把标准输入写入文件；`<<-'EOF'` 到 `EOF` 之间是 here-doc，表示把中间这段内容作为标准输入传给 tee。`registry-mirrors` 是数组，可以填多个地址，dockerd 会按顺序尝试。把 `xxxx` 替换成自己的专属地址。

修改后重启 Docker 使其生效：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

验证配置是否生效：

```bash
docker info | grep -A5 "Registry Mirrors"
```

看到列出的加速地址即表示配置成功。

### 11.4 daemon.json 其他常用配置

```json
{
  "registry-mirrors": ["https://xxxx.mirror.aliyuncs.com"],
  "data-root": "/var/lib/docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "insecure-registries": ["192.168.1.100:5000"]
}
```

`data-root` 修改数据目录（磁盘迁移时使用）；`log-driver` 与 `log-opts` 设置容器日志驱动和轮转，防止日志无限增长撑爆磁盘；`insecure-registries` 允许访问未启用 HTTPS 的私有仓库，仅建议测试环境使用。

注意：daemon.json 与命令行参数、环境变量同时配置同一项时，dockerd 启动会报冲突，所以能写进 daemon.json 的配置尽量统一放在这里管理。每次修改 daemon.json 后都要 `systemctl restart docker` 才会生效。

## 十二、常用命令速查

| 操作 | 命令 |
| --- | --- |
| 启动 / 停止 / 重启 / 状态 | `sudo systemctl start/stop/restart/status docker` |
| 查看镜像 | `docker images` |
| 查看容器 | `docker ps`（加 `-a` 包含已停止） |
| 拉取镜像 | `docker pull 镜像名:tag` |
| 运行容器 | `docker run [选项] 镜像名` |
| 查看容器日志 | `docker logs 容器ID` |
| 进入运行中的容器 | `docker exec -it 容器ID bash` |
| 启用 / 禁用开机自启 | `sudo systemctl enable/disable docker` |

## 十三、卸载 Docker

```bash
sudo systemctl stop docker
sudo dnf remove -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
sudo rm -f /etc/yum.repos.d/docker-ce.repo
```

先停止服务，再卸载软件包；`rm -rf /var/lib/docker` 和 `/var/lib/containerd` 会删除所有镜像、容器和数据卷，**不可恢复，执行前请确认已经备份**；最后删除源配置文件。`rm -rf` 是高危命令，请核对路径后再执行。

## 十四、常见问题

### 提示 `No match for argument: docker-ce`

通常是软件源没有配置好或缓存没有刷新。检查 `/etc/yum.repos.d/docker-ce.repo` 是否存在，再执行 `sudo dnf makecache` 后重试。

### 拉取镜像一直超时

优先检查镜像加速器是否配置并重启了 Docker；若使用的是已停服的公共加速地址，请更换为可用的专属加速地址或代理。

### GPG 或 repomd 校验失败

系统时间偏差会导致签名校验失败。用 `timedatectl` 查看并校正系统时间，再执行 `sudo dnf makecache`。

### 普通用户执行 docker 报 permission denied

通常是当前用户不在 docker 组。执行 `sudo usermod -aG docker $USER` 后注销重新登录，或使用 `newgrp docker` 让当前 shell 生效。

### 与 podman / 已有 containerd 冲突

CentOS Stream 9 默认提供 podman。docker 与 podman 一般可以共存，但如果 dnf 提示 `containerd.io` 与系统已装的 `containerd` 或 `runc` 冲突，按提示先移除冲突包再继续安装即可。

### 容器端口映射后外部仍无法访问

先确认容器确实监听在目标端口（`docker ps` 查看端口映射），再检查 firewalld 和云平台安全组。Docker 通常会自行管理 iptables/nftables 规则，正常情况下无需手动放行，但被主机防火墙策略覆盖时可按需放行对应端口。

### `docker compose` 与旧版 `docker-compose` 的区别

本文安装的是 Compose v2 插件，用法是 `docker compose`（中间是空格）。旧的独立二进制是 `docker-compose`（中间是连字符），两者命令基本兼容，但新版本统一使用 `docker compose`。

## 官方文档

- [Docker 官方文档：在 CentOS 上安装 Docker Engine](https://docs.docker.com/engine/install/centos/)
- [Docker 官方文档：Linux 安装后配置](https://docs.docker.com/engine/install/linux-postinstall/)
- [Docker 官方文档：daemon.json 配置参考](https://docs.docker.com/reference/cli/dockerd/)
- [Docker 官方文档：镜像加速 registry-mirrors](https://docs.docker.com/config/daemon/)
- [阿里云容器镜像服务](https://www.aliyun.com/product/acr)

*命令和配置依据 Docker 官方文档整理，核对日期：2026 年 10 月 12 日。软件源、镜像加速地址和客户端界面可能更新，具体以当前官方页面为准。*
