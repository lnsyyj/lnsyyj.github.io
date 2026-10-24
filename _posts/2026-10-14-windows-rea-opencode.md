---
layout: post
title: Windows 安装与配置 REA，并接入 OpenCode
description: 在 Windows 上安装 REA（Node.js 前置、npx/全局安装），把 REA 的 MCP 服务注册到 OpenCode，配置 Ghidra/IDA 原生分析引擎，并验证使用，每步都有解释。
date: 2026-10-14 00:00:00 +0800
categories: [技术, 逆向工程]
tags: [Windows, REA, MCP, OpenCode, 逆向工程, AI Agent]
---

本文介绍如何在 **Windows** 上安装 **REA（Reverse Engineer Anything）**，并把它的 MCP 服务接入 **OpenCode** 这个终端 AI Agent。每一步都会解释命令和配置的含义。

> 上一篇《CentOS Stream 9 安装与使用 REA》讲了 REA 的原理和基本用法，本文侧重 Windows 安装与 OpenCode 对接。核对日期：2026 年 10 月 14 日，npm 包 `rea-agents` 当时约 6.4.0，具体以 [npm 页面](https://www.npmjs.com/package/rea-agents) 为准。

## 一、Windows 上的支持情况

REA 官方支持 Windows，但分场景：

- **JavaScript/Electron 与 .NET 静态分析**：Windows 上开箱即用，不需要反汇编引擎。
- **原生二进制分析**：可用 **Ghidra**（官方标注为实验性支持）或 **IDA**（带可选的本地 MCP 桥接）。**Hopper 在 Windows 上不可用**，setup 不会在 Windows 上安装它。
- **Android APK**：需要 headless JADX + 完整 JDK，支持 Windows x64。

## 二、准备工作

### 2.1 安装 Node.js

REA 要求 **Node.js 22.x（≥22.19）、24.x（≥24.11）或 26+**，并自带 npm。注意 23、25 以及预发布版不受支持。

```powershell
node -v
npm -v
```

没装的话到 [nodejs.org](https://nodejs.org/) 下载 Windows 安装包装 LTS 版本，或用 [nvm-windows](https://github.com/coreybutler/nvm-windows) 管理多个版本。装完重新打开 PowerShell，确认版本在支持范围内。

### 2.2 安装 OpenCode

OpenCode 是一个终端里的 AI 编程 Agent。用 npm 装最省事：

```powershell
npm install -g opencode-ai
opencode --version
```

`npm install -g` 全局安装，`opencode --version` 确认可执行。也可以走官方脚本（以 [opencode.ai](https://opencode.ai/docs/) 当前页面为准）：

```powershell
irm https://opencode.ai/install.ps1 | iex
```

## 三、安装 REA

### 3.1 推荐：交互式安装向导

```powershell
npx rea-agents@latest setup
```

`npx rea-agents@latest setup` 用 npx 拉取最新版并进入向导。向导会列出检测到的受支持 Agent，让你勾选；**在列表里选中 OpenCode** 即可。它会在写文件前先展示要改动的路径和内容，确认后才真正写入，并自动备份现有配置。装完按提示**重启 OpenCode**。

### 3.2 非交互地只配 OpenCode

想跳过选择界面，直接用 `--client` 指定：

```powershell
npx rea-agents@latest setup --client opencode
```

OpenCode 在 REA 里的客户端 ID 是 `opencode`。先只读演练看计划、不真正改动：

```powershell
npx rea-agents@latest setup --client opencode --dry-run
```

`--dry-run` 返回一份 `planned` 状态的可读计划、退出码 0，不会写任何文件，适合在自动化和 CI 里先确认。

### 3.3 全局命令行工具（可选）

想在 PowerShell 里直接敲 `rea` 命令：

```powershell
npm install -g rea-agents
rea --help
```

`rea --help` 能输出命令列表说明全局安装成功。

### 3.4 验证安装

```powershell
rea doctor --json
```

`rea doctor` 是只读健康检查，会审计 Node 运行时、OpenCode 注册、skill 和分析引擎。只查 OpenCode 注册用 `rea doctor --client opencode --json`。

## 四、把 REA 接入 OpenCode

### 4.1 setup 自动写入了什么

setup 为 OpenCode 写的是 **V1 的 `mcp.rea` 条目**（OpenCode V1、V2 都能加载）；如果你的配置已经用了 OpenCode V2 原生的 `mcp.servers` 表，setup 会改写到那里并替换旧的 REA 条目。它还会处理 Windows 上的启动命令包装（用 `cmd.exe /d /c` 包住 `npx`）。

OpenCode 的配置文件位置：全局配置通常在 `~/.config/opencode/opencode.json`（Windows 上即 `%USERPROFILE%\.config\opencode\opencode.json`），支持 JSONC；REA 还尊重 `OPENCODE_CONFIG_DIR` 和 `OPENCODE_CONFIG` 两个环境变量，JSON 和 JSONC 同时存在时取后加载的那个。所以**交给 setup 自动定位最稳妥**，不必手算路径。

### 4.2 手动注册参考

如果不想用向导，也可以手动在 OpenCode 配置里加一个 `local` 类型的 MCP 服务。V2 形式的示意：

```json
{
  "mcp": {
    "servers": {
      "rea": {
        "type": "local",
        "command": ["npx", "-y", "rea-agents@6.4.0", "mcp"],
        "enabled": true
      }
    }
  }
}
```

V1 形式（老版本兼容）则直接放在 `mcp` 下：

```json
{
  "mcp": {
    "rea": {
      "type": "local",
      "command": ["npx", "-y", "rea-agents@6.4.0", "mcp"],
      "enabled": true
    }
  }
}
```

`command` 数组就是启动命令：`npx -y rea-agents@6.4.0 mcp` 表示以 stdio 方式启动 REA 的 MCP 服务，`-y` 自动确认 npx 下载。如果 Windows 下 `npx` 直接启动失败，把 `command` 改成 `["cmd", "/d", "/c", "npx", "-y", "rea-agents@6.4.0", "mcp"]`——这正是 setup 在 Windows 上做的事。建议固定具体版本号而不是 `@latest`，保证行为可复现。

> 以上 JSON 是参考形态，字段以你安装的 OpenCode 版本和 `rea setup` 实际生成的为准。

### 4.3 重启并验证

改完配置后，**完全退出并重新打开 OpenCode**，让新的 MCP 注册生效。然后在 OpenCode 的终端里确认工具已加载（不同版本界面不同，通常在 MCP 列表或对话中可见 `rea` 工具），并在 PowerShell 里跑：

```powershell
rea doctor --client opencode --json
```

`doctor` 检查的是配置文件和前置条件，不检查"正在运行的 OpenCode 会话"；如果工具没出现，先重启/重连 OpenCode，再看 doctor 结果。

## 五、配置原生分析引擎（可选）

只做 JavaScript/.NET 静态分析可跳过本节。要分析原生二进制，Windows 上推荐 **Ghidra 12.1.x + JDK 21**。

先确认 Java：

```powershell
java -version
javac -version
```

没有就装一个 64 位 JDK 21（如 Temurin）。然后在 PowerShell 里告诉 REA 它们的位置：

```powershell
$env:GHIDRA_INSTALL_DIR = "C:\tools\ghidra_12.1.4_PUBLIC"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
rea doctor --json
rea providers --json
```

`GHIDRA_INSTALL_DIR` 指向解压后的 Ghidra 目录，`JAVA_HOME` 指向 JDK 21（如果 `java`/`javac` 已在 PATH 可省略）。`rea doctor --json` 验证引擎是否就绪，`rea providers --json` 列出可用分析引擎。Windows 上的 Ghidra 支持是实验性的，官方细节见 [windows-ghidra-p0 文档](https://github.com/morluto/rea/blob/main/docs/windows-ghidra-p0.md)；IDA 另有 [ida-provider 文档](https://github.com/morluto/rea/blob/main/docs/ida-provider.md)。

> 注意：这些 `$env:` 只在当前 PowerShell 会话生效。要让 OpenCode 启动的 MCP 进程也拿到它们，应通过 setup 把环境写进注册配置，而不是只改一个无关终端的变量。

## 六、使用

### 6.1 在 OpenCode 里用自然语言

重启 OpenCode 后直接提问：

```text
理解一下目标应用里的搜索功能是怎么实现的，给出证据，并帮我的项目实现一个类似的。
```

把"目标应用"换成你要分析的程序。OpenCode 会通过 REA 打开目标、静态分析或反汇编、追踪相关代码，返回带证据和局限性的结论，你再继续追问或让它实现。

### 6.2 命令行使用

```powershell
rea analyze-javascript-application "D:\apps\example" --json
```

`analyze-javascript-application` 对解包后的 JavaScript/Electron 应用目录做静态分析，`--json` 输出结构化结果。用 npx 一次性执行则写成 `npx -y rea-agents@latest analyze-javascript-application "D:\apps\example" --json`。

## 七、更新与卸载

全局 CLI 更新：

```powershell
rea update
```

通过 npx 集成的 OpenCode 重新跑向导刷新注册：

```powershell
npx rea-agents@latest setup --client opencode
```

按提示确认后重启 OpenCode。

卸载：

```powershell
rea uninstall
rea uninstall --purge-data
```

`rea uninstall` 移除 REA 拥有的 Agent 注册和 skill 文件；`--purge-data` 额外清掉 `~/.rea` 下的缓存和状态。Hopper、Node.js、分析结果等会保留。

## 八、常见问题

### 报 Node.js 版本不支持

REA 只支持 Node.js 22.x（≥22.19）、24.x（≥24.11）、26+，23、25 及预发布版不支持。`node -v` 确认后换到支持的大版本。

### OpenCode 里看不到 REA 的工具

通常是配置没生效或没重启。先 `rea doctor --client opencode --json` 看注册是否健康，再完全退出重开 OpenCode；工具加载不出来时检查注册里的启动命令在 Windows 下能否单独跑通。

### Windows 上启动 REA 失败、提示找不到 npx

把 MCP 的 `command` 用 `cmd /d /c` 包装（见 4.2），或确认 Node/npm 已加入系统 PATH，并重开终端。

### Ghidra 分析原生二进制报 provider_unavailable

确认 `GHIDRA_INSTALL_DIR` 指向 Ghidra 12.1.x、JDK 是 64 位且 `javac` 可用，并确保这些环境变量被写进了 OpenCode 启动的 REA 进程环境（用 setup 配置，而不是只改临时终端）。Windows 的 Ghidra 支持是实验性的，先读 windows-ghidra-p0 文档。

### 想固定某个 REA 版本

注册里写死版本号（如 `rea-agents@6.4.0`），别用 `@latest`；之后要升级时重新跑 `setup --client opencode` 并确认改动。

## 官方资源

- [项目仓库 morluto/rea](https://github.com/morluto/rea)
- [官网 rea.tools](https://rea.tools/)
- [npm 包 rea-agents](https://www.npmjs.com/package/rea-agents)
- [安装与配置文档](https://github.com/morluto/rea/blob/main/docs/installation.md)
- [客户端配置（OpenCode 等）](https://github.com/morluto/rea/blob/main/docs/client-configuration.md)
- [Windows Ghidra 支持](https://github.com/morluto/rea/blob/main/docs/windows-ghidra-p0.md)
- [OpenCode 官网](https://opencode.ai/)

*内容依据 morluto/rea 官方文档整理，核对日期：2026 年 10 月 14 日。REA 迭代较快，客户端 ID、配置字段和版本可能变化，请以上述官方文档为准。*
