---
layout: post
title: CentOS Stream 9 安装 Node.js 环境
description: 在 CentOS Stream 9 上安装 Node.js：对比 dnf 模块、官方二进制包和 nvm 三种方式，配置 npm 国内镜像，编写并运行第一个 Node 程序，每步都有解释。
date: 2026-10-12 00:00:00 +0800
tags: [CentOS Stream 9, Node.js, npm, 开发环境, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上搭建 **Node.js** 运行与开发环境：对比几种安装方式、配置 npm 国内镜像、验证安装并运行第一个程序。每一步都会解释命令和配置项的含义。

> 示例以 Node.js 24 LTS（v24.21.0，代号 Krypton，2026 年 10 月 12 日核对）为准；当前最新主线是 v26.11.1。版本号会随官方发布变化，动手前建议到 [nodejs.org](https://nodejs.org/) 确认。

## 一、确认系统和已有环境

```bash
uname -m
node -v
npm -v
which -a node
```

`uname -m` 确认 CPU 架构，`x86_64` 就用下文的 linux-x64 安装包（`aarch64` 对应 linux-arm64）。`node -v`、`npm -v` 检查是否已经装过 Node.js 和 npm（报 `command not found` 表示没装）；`which -a node` 列出所有 `node` 可执行文件路径，如果存在多个，说明可能有多套 Node，后面会提到如何排查。

## 二、选择安装方式

CentOS Stream 9 装 Node.js 主要有四种方式：

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| nvm（版本管理器） | 多版本随意切换、无需 root、适合开发 | 需要单独初始化，对服务自启脚本不直观 |
| 官方二进制包（nodejs.org） | 版本最新、干净可控 | 需手动下载、解压、配 PATH |
| dnf 模块 | 一条命令、随系统包管理更新 | 版本受发行版仓库限制，通常不是最新 |
| NodeSource 仓库 | 通过 dnf 装到较新版本 | 第三方仓库，需信任其脚本 |

日常开发、经常切换版本选 **nvm**；服务器上只装一个固定版本选 **官方二进制包**。下面详细讲这两种，dnf 模块作为最省事的备选简单说明。

## 三、方法一：nvm 安装（推荐给开发环境）

nvm（Node Version Manager）能在一个系统里安装多个 Node.js 版本并按需切换，而且装在用户目录下、不需要 root。

### 3.1 安装 nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
```

`curl -o- ... | bash`：`-o-` 表示把下载内容输出到标准输出（而不是写文件），再用管道 `|` 交给 `bash` 执行。脚本会克隆 nvm 到 `~/.nvm`，并在 `~/.bashrc` 末尾追加初始化代码。执行完重新加载 shell 配置：

```bash
source ~/.bashrc
```

验证 nvm：

```bash
nvm --version
```

`nvm --version` 输出 nvm 版本号说明安装成功。国内访问 raw.githubusercontent.com 慢的话，可以先配置镜像（见 3.3），或给 `curl` 加代理。

### 3.2 安装并切换 Node.js 版本

这里以安装 **Node.js 22**（一个主版本号）为例，整段复制执行：

```bash
nvm install 22
nvm use 22
nvm alias default 22
```

- `nvm install 22`：安装 22 主版本线里最新的一个版本（例如 v22.23.3）。`22` 是主版本号，nvm 会自动选该线最新版。
- `nvm use 22`：在当前终端切换到 22。
- `nvm alias default 22`：把默认版本设为 22 主版本线，以后新开终端自动使用 22 系最新已装版本。

如果你想要"最新 LTS"而不是固定 22，把上面的 `22` 换成 `--lts` 即可：`nvm install --lts`、`nvm use --lts`。

注意不要写成带通配符的形式，例如 `nvm alias default 'lts/*'` 或 `nvm alias default '22.23.3/*'`：`nvm alias` 的第二个参数应该是一个能解析到的具体版本、主版本号或内置别名（`node`、`stable`），通配符写法会生成一个无法解析的默认别名（`nvm ls` 里会显示 `default -> xxx (-> N/A)`）。

查看已装版本和当前使用的版本：

```bash
nvm ls
node -v
```

`nvm ls` 列出已安装的所有版本，带 `->` 箭头的是当前使用的，`default ->` 显示默认版本。项目里也可以放一个 `.nvmrc` 文件写明版本号（内容是 `22`），进入目录后执行 `nvm use` 就会自动切到对应版本。

### 3.3 国内镜像加速下载

nvm 下载 Node.js 安装包时默认从 nodejs.org 拉取，国内可以换成 npmmirror 的镜像：

```bash
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
nvm install 24
```

`NVM_NODEJS_ORG_MIRROR` 是 nvm 读取的镜像地址环境变量，设置后 `nvm install` 就从镜像站下载。想永久生效，把这条 `export` 写进 `~/.bashrc`。

## 四、方法二：官方二进制包（推荐给服务器）

服务器一般只装一个固定版本，用官方二进制包最干净。

### 4.1 下载并校验

```bash
curl -fLO https://nodejs.org/dist/v24.21.0/node-v24.21.0-linux-x64.tar.xz
echo "fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6  node-v24.21.0-linux-x64.tar.xz" | sha256sum -c -
```

`curl` 的 `-f` 表示出错即失败、`-L` 跟随重定向、`-O` 按 URL 文件名保存；`sha256sum -c -` 按标准输入给出的"校验和 + 文件名"核对完整性，输出 `OK` 表示文件没被篡改或损坏。校验值要和 [nodejs.org](https://nodejs.org/) 上的一致，换版本号时校验值也会变。

### 4.2 解压并加入 PATH

```bash
sudo tar -C /usr/local --strip-components=1 -xJf node-v24.21.0-linux-x64.tar.xz
```

`tar` 的 `-C /usr/local` 指定解压到 `/usr/local`；`--strip-components=1` 去掉压缩包里最外层的目录（`node-v24.21.0-linux-x64/`），这样 `bin/node`、`lib/` 等会直接落到 `/usr/local/` 下；`-xJf` 中 `x` 解压、`J` 表示 xz 压缩、`f` 指定文件。解压后 `node` 二进制位于 `/usr/local/bin/node`。

确认 `/usr/local/bin` 在 `PATH` 里（一般发行版默认包含），不在的话在 `~/.bashrc` 追加：

```bash
export PATH=$PATH:/usr/local/bin
source ~/.bashrc
```

## 五、方法三：dnf 模块（最省事）

CentOS Stream 9 的 AppStream 源里带 Node.js 模块，可以先看有哪些版本流：

```bash
sudo dnf module list nodejs
```

`dnf module list nodejs` 列出可用的模块流（如 `18`、`20`、`22` 等）及其默认档。选一个安装：

```bash
sudo dnf module install -y nodejs:22/common
```

`nodejs:22/common` 表示 22 版本的 `common` 档，会一起装上 node 和 npm，并由 dnf 统一管理升级。缺点是版本受发行版仓库限制、通常落后于官方最新版，但追求"随系统包管理维护"的生产环境常用这种方式。

## 六、配置 npm 国内镜像

npm 是 Node.js 自带的包管理器，默认从官方仓库 `registry.npmjs.org` 下载依赖，国内访问常偏慢。先看当前地址：

```bash
npm config get registry
```

换成 npmmirror 的镜像（原淘宝镜像的官方新域名，旧的 `registry.npm.taobao.org` 已停用）：

```bash
npm config set registry https://registry.npmmirror.com
```

`npm config set 键 值` 会写入用户级配置 `~/.npmrc`，对所有项目生效。再确认一下：

```bash
npm config get registry
```

输出 `https://registry.npmmirror.com/` 即配置成功。如果只是某个项目想用镜像，可以在该项目根目录放一个 `.npmrc` 写 `registry=https://registry.npmmirror.com`，作用范围更小。

## 七、验证并运行第一个程序

```bash
node -v
npm -v
```

`node -v` 显示 Node.js 版本，`npm -v` 显示 npm 版本，两者都能输出说明环境就绪。

写一个最简单的脚本：

```bash
cat > hello.js <<'EOF'
console.log("Hello, Node.js on CentOS Stream 9!");
EOF
node hello.js
```

`cat > hello.js <<'EOF' ... EOF` 把中间内容写入 `hello.js`；`node hello.js` 用 Node 解释执行这个文件，输出一行文本。Node.js 既是运行环境也是解释器，`node 文件名` 就是运行一段 JavaScript。

说明一下 npm 和 npx 的区别：`npm` 用来安装、管理依赖（如 `npm install 包名`），`npx` 用来临时执行一个包而不必先全局安装（如 `npx 某工具`）。Node 16.9 起还内置了 `corepack`，用来统一管理 pnpm、yarn 等包管理器的版本。

## 八、常用命令速查

| 命令 | 作用 |
| --- | --- |
| `node -v` / `npm -v` | 查看版本 |
| `node 脚本.js` | 运行脚本 |
| `npm init -y` | 初始化项目，生成 package.json |
| `npm install 包名` | 安装依赖（`-g` 全局，`--save-dev` 开发依赖） |
| `npm run 脚本名` | 执行 package.json 里定义的脚本 |
| `npx 工具名` | 临时运行一个包 |
| `nvm install/use/ls 版本` | nvm 装/切/查版本 |

## 九、卸载方法

nvm 卸载某个版本：`nvm uninstall 24`；彻底移除 nvm 则删除 `~/.nvm` 目录并去掉 `~/.bashrc` 里 nvm 相关的初始化行。

官方二进制包解压到 `/usr/local` 后文件比较分散，卸载时删除相关目录即可（**执行前确认路径**）：

```bash
sudo rm -rf /usr/local/bin/node /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
sudo rm -rf /usr/local/lib/node_modules /usr/local/include/node
```

dnf 模块安装的直接 `sudo dnf module remove nodejs` 即可。

## 十、常见问题

### `node: command not found`

`node` 不在 `PATH` 里。nvm 方式先 `source ~/.bashrc`；二进制包方式确认 `/usr/local/bin` 在 `PATH` 中。用 `which -a node` 排查。

### 全局安装 npm 包报 `EACCES: permission denied`

把包装到系统目录需要权限。优先用 nvm 这类用户级安装（全局包落在用户目录，无需 sudo）；如果必须 sudo，注意别和用户级安装混用，避免权限混乱。

### npm 安装依赖很慢或超时

确认 `npm config get registry` 已指向 `https://registry.npmmirror.com`，并检查网络/代理。

### 系统里有多套 Node，版本混乱

用 `which -a node` 看有哪些路径，再用 `node -v` 结合当前 `PATH` 判断实际用的是哪个。nvm 用户可用 `nvm use 版本` 明确切换；同时存在 dnf 安装和 nvm 安装时，注意 `PATH` 的先后顺序决定谁生效。

### 报 `registry.npm.taobao.org` 相关错误

淘宝老镜像域名已经停用，把 registry 换成 `https://registry.npmmirror.com` 即可。

## 官方文档

- [Node.js 官方下载页](https://nodejs.org/en/download)
- [Node.js 通过包管理器安装](https://nodejs.org/en/download/package-manager)
- [nvm（Node Version Manager）](https://github.com/nvm-sh/nvm)
- [npm 文档](https://docs.npmjs.com/)
- [npmmirror 镜像站](https://npmmirror.com/)

*命令和配置依据 Node.js 官方文档整理，版本与校验值核对日期：2026 年 10 月 12 日。版本号和校验和会随官方发布变化，请以 nodejs.org 当前页面为准。*
