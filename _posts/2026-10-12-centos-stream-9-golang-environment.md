---
layout: post
title: CentOS Stream 9 搭建 Go 编译环境
description: 在 CentOS Stream 9 上安装官方 Go 工具链、配置 GOROOT/GOPATH/GOPROXY 等环境变量、启用国内模块代理，并编写、编译、交叉编译第一个 Go 程序，每步都有解释。
date: 2026-10-12 00:00:00 +0800
tags: [CentOS Stream 9, Go, 编译, 开发环境, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上搭建完整的 **Go 编译环境**：下载并安装官方工具链、配置环境变量（`GOROOT`、`GOPATH`、`GOPROXY` 等）、启用国内模块代理，并完成第一个程序的编写、编译、运行和交叉编译。每一步都会解释命令和配置项的含义。

> 示例以 Go 1.27.2 为准（2026 年 10 月 12 日核对时的最新稳定版），安装包 sha256 校验值也取自官方下载页。Go 版本更新较快，动手前建议到 [go.dev/dl](https://go.dev/dl/) 确认最新版本并替换下文中的版本号。

## 一、确认系统和已有环境

```bash
uname -m
go version
which go
```

`uname -m` 确认 CPU 架构，输出 `x86_64` 就用下文的 linux-amd64 安装包；若是 `aarch64`，下载地址里的 `amd64` 要换成 `arm64`。`go version` 检查是否已经装过 Go（报 `command not found` 表示没装）；`which go` 显示 `go` 命令的实际路径，如果系统已经通过别的渠道装过，先看清楚版本再决定要不要覆盖。

## 二、选择安装方式

CentOS Stream 9 装 Go 主要有两种方式：

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| 官方二进制包（go.dev） | 版本最新、干净可控、多版本可共存 | 需要手动下载、配置 PATH |
| `dnf install golang` | 一条命令、自动进 PATH | 发行版源里的版本通常较旧 |

推荐使用官方二进制包，这也是 Go 官方文档的标准做法。下文按这种方式展开。

## 三、下载并安装官方工具链

### 3.1 下载安装包

```bash
curl -fLO https://go.dev/dl/go1.27.2.linux-amd64.tar.gz
```

`curl` 的 `-f` 表示遇到 HTTP 错误直接失败，`-L` 跟随重定向，`-O` 按 URL 里的文件名保存（得到 `go1.27.2.linux-amd64.tar.gz`）。这个文件约 70 MB。

### 3.2 校验文件完整性

```bash
echo "ecbadb99091a3f46e31f5f934b068b1864eafa7995211b39eaddf76996045fe5  go1.27.2.linux-amd64.tar.gz" | sha256sum -c -
```

`sha256sum -c -` 根据标准输入给出的"校验和 + 文件名"清单逐项核对，匹配会输出 `go1.27.2.linux-amd64.tar.gz: OK`。这一步能确认下载的文件没有被篡改或损坏；校验和要与 [go.dev/dl](https://go.dev/dl/) 页面上的值一致，版本不同校验和也不同。

### 3.3 解压到 /usr/local

```bash
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.27.2.linux-amd64.tar.gz
```

`sudo rm -rf /usr/local/go` 先删掉可能存在的旧版 Go 目录（Go 的官方安装位置就是 `/usr/local/go`，重复解压会混入旧文件）；`tar -C /usr/local -xzf` 把压缩包解压到 `/usr/local`，生成 `/usr/local/go` 目录。**注意**：`rm -rf` 是高危命令，这里针对的是 Go 的安装目录，执行前请确认路径，且该目录里没有你自己放的东西。

解压后，Go 的二进制在 `/usr/local/go/bin/go`，标准库和工具链在 `/usr/local/go/` 下，这个目录就是后文要说的 `GOROOT`。

## 四、配置环境变量

Go 用一组环境变量控制工具链行为，常用几个：

| 环境变量 | 作用 | 默认值 |
| --- | --- | --- |
| `GOROOT` | Go 安装目录（工具链和标准库所在） | 通常自动推断，无需手设 |
| `PATH` | 让 shell 找到 `go` 命令 | 需手动加入 `/usr/local/go/bin` |
| `GOPATH` | 工作区：模块缓存、`go install` 输出等 | `$HOME/go` |
| `GOPROXY` | 模块下载代理（国内加速的关键） | `https://proxy.golang.org,direct` |
| `GOSUMDB` | 模块校验和数据库 | `sum.golang.org` |
| `GO111MODULE` | 是否启用模块模式 | Go 1.16 起默认 `on`，无需设置 |

对当前用户生效，编辑 `~/.bashrc`，在末尾追加：

```bash
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
export GOPROXY=https://goproxy.cn,direct
```

解释：

- `export PATH=$PATH:/usr/local/go/bin` 把 Go 的 bin 目录追加到 `PATH`，这样 shell 才能直接敲 `go`。`$PATH` 表示保留原有路径，冒号是分隔符。
- `export GOPATH=$HOME/go` 设置工作区。Go 1.11 引入模块后 `GOPATH` 的作用变小，但仍然是模块缓存（`$GOPATH/pkg/mod`）和 `go install` 安装工具（默认到 `$GOPATH/bin`）的位置，建议显式设置。
- `export PATH=$PATH:$GOPATH/bin` 把 `$GOPATH/bin` 也加进 `PATH`，这样用 `go install` 装的命令行工具（如 `gopls`）也能直接调用。
- `export GOPROXY=https://goproxy.cn,direct` 设置模块代理，下一节详说。

让配置立即生效：

```bash
source ~/.bashrc
```

`source` 在当前 shell 里重新执行 `~/.bashrc`，不用重新登录。如果想让这台机器上**所有用户**都生效，可以把同样的 `export` 行写进 `/etc/profile.d/go.sh`（需要 `sudo`），每个用户登录时都会自动加载。

## 五、验证安装

```bash
go version
go env GOROOT GOPATH GOPROXY
```

`go version` 显示 Go 版本，应看到 `go version go1.27.2 linux/amd64`。`go env GOROOT GOPATH GOPROXY` 打印指定环境变量的**实际生效值**，用来确认配置有没有被读到——注意 `go env` 显示的是 Go 工具链看到的最终值，和 shell 环境变量是两套，可以互相印证。

## 六、配置国内模块代理（GOPROXY）

Go 从 1.11 开始用"模块"管理依赖：每个项目根目录有一个 `go.mod` 文件声明模块路径和依赖，构建时 Go 按需下载依赖。默认情况下，公开模块从官方代理 `proxy.golang.org` 拉取，国内访问经常很慢甚至超时。

`GOPROXY` 就是模块下载代理。它支持逗号分隔的多个地址，按顺序尝试，`direct` 表示最后回退到直接从源码仓库（GitHub 等）拉取：

```bash
go env -w GOPROXY=https://goproxy.cn,direct
```

`go env -w KEY=VALUE` 是 Go 原生的持久化写法，会写入用户级配置文件（Linux 下是 `~/.config/go/env`），对所有后续 `go` 命令生效，比写在 `~/.bashrc` 里更统一。`goproxy.cn` 是七牛提供的国内镜像；其他可选值还有 `https://goproxy.io,direct` 或阿里云的 `https://mirrors.aliyun.com/goproxy/`。

配合把校验和数据库也换成国内可达地址：

```bash
go env -w GOSUMDB=sum.golang.google.cn
```

`GOSUMDB` 用来校验下载的模块内容是否和公开记录一致，防止被篡改。默认 `sum.golang.org` 国内可能访问不畅，换成 Google 的国内镜像 `sum.golang.google.cn`。不建议直接设 `GOSUMDB=off`，那会关掉校验，牺牲安全性。

确认已生效：

```bash
go env GOPROXY GOSUMDB
```

> 如果公司内部有私有模块（如 `git.corp.com/...`），可以用 `go env -w GOPRIVATE=git.corp.com` 让这些模块跳过公开代理和校验和数据库，直接从内网拉取。

## 七、第一个程序

### 7.1 初始化模块

```bash
mkdir -p ~/projects/hello && cd ~/projects/hello
go mod init example.com/hello
```

`mkdir -p` 创建项目目录，`cd` 进入。`go mod init 模块路径` 初始化模块并生成 `go.mod` 文件；模块路径相当于这个项目的"命名空间"，本机练习用 `example.com/hello` 即可，发布到 GitHub 的项目通常写成 `github.com/用户名/仓库名`。

### 7.2 编写代码

```bash
cat > main.go <<'EOF'
package main

import "fmt"

func main() {
	fmt.Println("Hello, Go on CentOS Stream 9!")
}
EOF
```

`cat > main.go <<'EOF' ... EOF` 是 here-doc 写法，把中间内容写入 `main.go`。代码里 `package main` 声明这是可执行程序的入口包；`import "fmt"` 引入格式化输出的标准库；`func main()` 是程序入口，`fmt.Println` 打印一行文本。

### 7.3 运行与编译

```bash
go run .
go build -o hello .
./hello
```

`go run .` 直接编译并运行当前目录的代码，不留下可执行文件，适合调试；`go build -o hello .` 编译生成名为 `hello` 的可执行文件，`-o` 指定输出文件名；`./hello` 运行编译产物。依赖更复杂的项目编译后可以用 `go mod tidy` 自动补全和清理 `go.mod` / `go.sum` 里的依赖记录。

## 八、常用命令速查

| 命令 | 作用 |
| --- | --- |
| `go version` | 查看 Go 版本 |
| `go env` | 查看环境变量（`go env -w` 修改） |
| `go mod init 路径` | 初始化模块 |
| `go mod tidy` | 整理依赖，补全/清理 go.mod、go.sum |
| `go run .` | 编译并运行 |
| `go build` | 编译，生成可执行文件 |
| `go test ./...` | 运行测试 |
| `go fmt ./...` | 格式化代码 |
| `go vet ./...` | 静态检查 |
| `go install 包路径@版本` | 安装命令行工具 |

## 九、交叉编译

Go 的一大优势是交叉编译：在一台机器上就能编出给其他操作系统、架构用的程序，通过 `GOOS`（目标系统）和 `GOARCH`（目标架构）控制：

```bash
GOOS=linux GOARCH=amd64 go build -o hello-linux .
GOOS=windows GOARCH=amd64 go build -o hello.exe .
GOOS=linux GOARCH=arm64 go build -o hello-arm64 .
```

`GOOS` 可取 `linux`、`windows`、`darwin`（macOS）等，`GOARCH` 可取 `amd64`、`arm64` 等。纯 Go 代码（不依赖 cgo）交叉编译基本开箱即用。如果某些包依赖 cgo（C 代码），需要先装 gcc 并设置 `CGO_ENABLED`，详见下节常见问题。

## 十、卸载 Go

```bash
sudo rm -rf /usr/local/go
```

删除安装目录即可，再顺手把 `~/.bashrc`、`/etc/profile.d/go.sh` 里追加的 `export` 行，以及 `~/.config/go/env` 里的 `go env -w` 配置清理掉。**注意**：`rm -rf /usr/local/go` 会永久删除 Go 工具链，确认无误再执行。

## 十一、常见问题

### `go: command not found`

`PATH` 里没有 `/usr/local/go/bin`。检查 `~/.bashrc` 里是否写了 `export PATH=$PATH:/usr/local/go/bin`，然后 `source ~/.bashrc` 重新加载。

### 下载依赖很慢或超时

把 `GOPROXY` 换成国内镜像：`go env -w GOPROXY=https://goproxy.cn,direct`。如果报校验错误，再检查 `GOSUMDB` 是否可达。

### 报 `missing go.sum entry` 或校验和不匹配

运行 `go mod tidy` 重新生成 `go.sum`；仍失败则确认 `GOSUMDB` 配置正确，或用 `GOPRIVATE` 排除私有模块。

### 编译某些包报 `cgo: C compiler "gcc" not found`

这个包依赖 cgo（需要 C 编译器）。安装编译工具：`sudo dnf install -y gcc`，Linux amd64 上 `CGO_ENABLED` 默认开启。纯 Go 项目一般不会遇到。

### 用 `dnf install golang` 装的版本太旧

这是发行版源的通病。按本文方式装官方二进制包即可；`dnf` 装的可以用 `sudo dnf remove golang` 卸载，避免两套 `go` 命令路径混乱（用 `which -a go` 查看有几个）。

## 官方文档

- [Go 官方下载页](https://go.dev/dl/)
- [Go 官方安装说明（Linux）](https://go.dev/doc/install)
- [Go Modules 参考](https://go.dev/ref/mod)
- [GOPROXY 环境变量说明](https://go.dev/ref/mod#module-proxy)
- [goproxy.cn（七牛 Go 模块代理）](https://goproxy.cn/)

*命令和配置依据 Go 官方文档整理，版本与校验值核对日期：2026 年 10 月 12 日。版本号和校验和会随官方发布变化，请以 go.dev/dl 当前页面为准。*
