---
layout: post
title: Python Frida 库：动态插桩原理与实战
description: 介绍 Frida 动态插桩的原理（Python 控制器 + 注入进程的 JS Agent + Gum 引擎），在 CentOS Stream 9 上安装 Python frida 库，通过 hook 一个 C 程序的函数完成完整 Demo，并介绍 frida-tools 命令行用法。
date: 2026-10-15 00:00:00 +0800
tags: [Python, Frida, 逆向工程, 动态分析, 安全]
---

本文介绍 **Frida** 及其 **Python 绑定库 `frida`**：Frida 是一套动态插桩（dynamic instrumentation）工具，能在程序运行时注入脚本、挂钩函数、查看和改写内存与参数。文章先讲原理，再讲在 **CentOS Stream 9** 上的安装、Python API 用法，最后用一个完整 Demo 挂钩一个 C 程序，每一步都有解释。

> Frida 只应用于分析你**自己拥有或已获授权**的软件；用于未授权程序、绕过正版校验或外挂等场景是不被支持的，请遵守相关法律法规。

## 一、原理：Frida 是如何工作的

Frida 的核心是往目标进程里**注入一个 JavaScript 引擎**，再通过 JavaScript 调用插桩能力。整体分三层：

| 层 | 作用 |
| --- | --- |
| 控制器（Python 等） | 你的脚本，负责连接目标、下发 JS、收发消息 |
| Frida Core | 注入器与通信层，把 JS Agent 注入目标进程并建立通道 |
| JS Agent + Gum | 在目标进程内运行：Gum 是底层插桩引擎，负责挂钩、读写内存、调用函数 |

一次挂钩的执行流程大致是：

1. Python 通过 `frida` 库连接本地设备或远程设备（`frida-server`）。
2. 选定目标进程，把一段 JavaScript 注入进去，进程里就有了 Frida 的 JS 运行环境。
3. JS 用 `Interceptor.attach` 找到目标函数并挂钩，设定 `onEnter`（进函数时）和 `onLeave`（返回时）回调。
4. 目标函数被调用时，Gum 触发这些回调，JS 可以读参数、读内存、改返回值。
5. JS 用 `send()` 把结果发给 Python，Python 在 `on('message')` 回调里接收；也可以反向 `recv()` 接收 Python 发来的数据。

关键点：**本机进程直接 attach，不需要额外服务**；只有分析手机（Android/iOS）这类远程设备时，才需要把和架构匹配的 `frida-server` 推到设备上运行。Python 的 `pip install frida` 会随包带上本机架构的 Frida 核心，所以桌面/服务器上开箱即用。

## 二、安装

### 2.1 安装 Python 绑定和命令行工具

```bash
python3 -m pip install frida frida-tools
```

`frida` 是 Python 绑定库，`frida-tools` 额外提供 `frida`、`frida-ps`、`frida-trace` 等命令行工具。确认版本：

```bash
python3 -c "import frida; print(frida.__version__)"
frida --version
```

### 2.2 准备编译工具（Demo 会用到）

Demo 需要编译一个 C 程序，先装 gcc：

```bash
sudo dnf install -y gcc
```

`gcc` 是 C 编译器；没有 `Development Tools` 全套时，单独装它即可。

### 2.3 本机 attach 的权限

Linux 上向其他进程注入受 ptrace 权限约束。如果提示 `Failed to attach`，检查：

```bash
cat /proc/sys/kernel/yama/ptrace_scope
```

输出 `1` 表示受限（默认值）：普通用户只能 attach 自己或子进程，root 不受限。本地做实验直接用 root，或临时把它改成 0：`sudo sysctl -w kernel.yama.ptrace_scope=0`（重启失效）。

## 三、Python API 基本流程

用 Python 操作 Frida 的固定套路是"选设备 → 选进程 → 建脚本 → 收消息"：

```python
import frida

device = frida.get_local_device()          # 获取本机设备
for p in device.enumerate_processes():     # 列出所有进程
    print(p.pid, p.name)
```

`frida.get_local_device()` 返回本机设备对象；`enumerate_processes()` 列出进程，每项有 `pid` 和 `name`。接着附加到某个进程：

```python
session = device.attach("进程名或PID")     # 附加到已在运行的进程
```

`attach` 连接一个已运行的进程。如果要"以调试方式启动"目标，用 `spawn` + `resume`（下一节 Demo 演示）。拿到 `session` 后创建脚本：

```python
script = session.create_script(js_code)    # js_code 是要注入的 JS 字符串
script.on("message", on_message)           # 注册消息回调
script.load()                              # 注入并执行 JS
```

`create_script` 传入一段 JavaScript 源码；`on("message", ...)` 处理 JS 里 `send()` 发来的消息；`load()` 才真正把脚本注入目标进程执行。用完 `session.detach()` 断开。

## 四、完整 Demo：挂钩一个 C 程序

### 4.1 编写目标程序

```bash
cat > demo_target.c <<'EOF'
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main(void) {
    int result = add(2, 3);
    printf("2 + 3 = %d\n", result);
    return 0;
}
EOF
```

这是一个最简单的 C 程序：`add(2, 3)` 计算结果，再用 `printf` 打印。我们一会儿要挂钩它自己的 `add` 函数和 libc 的 `printf`。

编译（加 `-g` 保留符号，方便按函数名找地址）：

```bash
gcc -g -o demo_target demo_target.c
./demo_target
```

`-g` 生成调试符号；`./demo_target` 直接运行，正常输出 `2 + 3 = 5`，作为对照。

### 4.2 编写 Frida Python 脚本

```bash
cat > hook_demo.py <<'EOF'
import frida
import time

JS_CODE = r"""
// 1) 挂钩 libc 的 printf：进入时读格式化串，返回时读返回值
var printfPtr = Module.findExportByName(null, "printf");
Interceptor.attach(printfPtr, {
  onEnter: function (args) {
    this.fmt = args[0].readUtf8String();   // args[0] 是格式化串指针
    console.log("[printf] 格式化串:", this.fmt);
  },
  onLeave: function (retval) {
    console.log("[printf] 返回(打印的字符数):", retval.toInt32());
  }
});

// 2) 挂钩目标程序自己的 add：记录参数、把返回值改写成 100
var addPtr = DebugSymbol.getFunctionByName("add");
if (addPtr) {
  Interceptor.attach(addPtr, {
    onEnter: function (args) {
      var a = args[0].toInt32();
      var b = args[1].toInt32();
      console.log("[add] 入参 a =", a, "b =", b);
      send({ type: "add_called", a: a, b: b });   // 发消息给 Python
    },
    onLeave: function (retval) {
      console.log("[add] 原返回值:", retval.toInt32());
      retval.replace(ptr(100));                    // 强制改成 100
      console.log("[add] 已改写为 100");
    }
  });
} else {
  console.log("[!] 未找到 add 符号");
}
"""

def on_message(message, data):
    if message.get("type") == "send":
        print("[Python 收到]", message["payload"])
    else:
        print("[消息]", message)

def main():
    device = frida.get_local_device()
    pid = device.spawn(["./demo_target"])   # 以挂起方式启动目标
    session = device.attach(pid)            # 附加到它
    script = session.create_script(JS_CODE)
    script.on("message", on_message)
    script.load()                            # 注入 JS
    device.resume(pid)                       # 恢复目标运行
    time.sleep(2)                            # 等目标跑完
    session.detach()

if __name__ == "__main__":
    main()
EOF
```

逐段解释：

- `Module.findExportByName(null, "printf")`：在导出符号表里找 `printf`，`null` 表示在所有模块里找；返回它的地址。
- `Interceptor.attach(地址, {onEnter, onLeave})`：挂钩该函数。`args` 是参数数组（`NativePointer`），`args[0].readUtf8String()` 把第一个参数当 C 字符串读出来；`retval.toInt32()` 把返回值转成整数。
- `DebugSymbol.getFunctionByName("add")`：靠编译时 `-g` 留下的调试符号找目标程序自己的 `add` 函数（不是导出符号，也能按名字定位）。
- `send({...})`：把字典发给 Python，对应 Python 侧 `on_message` 里 `message["payload"]`。
- `retval.replace(ptr(100))`：把函数返回值改成 100，`ptr(100)` 构造一个指向数值 100 的指针。
- Python 侧 `device.spawn([...])` 以挂起方式启动目标（先不执行），`attach` 后 `load()` 注入脚本，再 `resume(pid)` 放行——这样能钩住程序最开始的调用，不会漏。

### 4.3 运行

```bash
python3 hook_demo.py
```

预期输出类似：

```text
[add] 入参 a = 2 b = 3
[Python 收到] {'type': 'add_called', 'a': 2, 'b': 3}
[add] 原返回值: 5
[add] 已改写为 100
[printf] 格式化串: 2 + 3 = %d
[printf] 返回(打印的字符数): 9
2 + 3 = 100
```

注意最后一行：程序原本该打印 `2 + 3 = 5`，因为我们把 `add` 的返回值改成了 100，所以最终打印 `2 + 3 = 100`。这直观展示了 Frida 能"在运行时修改程序行为"，同时两端的日志说明了 hook 的触发顺序和消息往返。

## 五、常用 JS API 速查

| API | 作用 |
| --- | --- |
| `Module.findExportByName(模块, "函数名")` | 按导出符号找函数地址（`模块` 可为 `null`） |
| `Module.getBaseAddress("模块名")` | 获取模块基址，配合偏移定位函数 |
| `Interceptor.attach(地址, {onEnter, onLeave})` | 挂钩函数，不改原逻辑 |
| `Interceptor.replace(地址, new NativeCallback(...))` | 完全替换函数实现 |
| `NativeFunction(地址, 'int', ['int','int'])` | 把地址包装成可调用的 C 函数 |
| `ptr(0x1234)` / `args[i].readUtf8String()` | 构造指针 / 读内存 |
| `send(obj)` / `recv(type, cb)` | 发消息给 Python / 从 Python 收消息 |

`Interceptor.attach` 是"旁路观察"，原函数照常执行；`Interceptor.replace` 是"整个替换"，原逻辑不再执行，适合彻底改写行为。

## 六、frida-tools 命令行用法

除了 Python，命令行工具也很常用：

```bash
frida-ps                     # 列出本机进程
frida-trace -i "printf" ./demo_target   # 跟踪某函数的调用
frida -l hook.js ./demo_target          # 用 JS 文件挂钩并启动目标
```

`frida-ps` 列进程；`frida-trace -i` 自动给指定函数打点，打印每次调用的参数和返回值（不用手写 JS）；`frida -l` 加载一个独立 JS 脚本。把 JS 逻辑抽到 `hook.js` 里，用 `frida -l hook.js ./demo_target` 就能脱离 Python 跑同样的 hook。

## 七、常见问题

### `Failed to attach` / `Unable to attach`

多为 ptrace 权限限制。确认以 root 运行，或临时 `sysctl -w kernel.yama.ptrace_scope=0`；目标进程是别人启动的普通进程时尤其常见。

### 找不到目标函数符号

先确认函数名正确；C++ 会有名字修饰（name mangling），需要脱壳后的符号。应用自己的静态函数可用 `-g` 编译配合 `DebugSymbol.getFunctionByName`，或先 `nm` 拿到偏移再用 `Module.getBaseAddress` + 偏移。

### 分析 Android/iOS 时连不上

远程设备需要先推送与设备架构匹配的 `frida-server` 并运行，Python 侧改用 `frida.get_usb_device()` 或 `frida.get_device(id)`。本机桌面程序则不需要 frida-server。

### 目标检测到 Frida

部分程序有反调试/反 Frida 检测。这是攻防对抗问题，需要配合隐藏、修改指纹等手段，且仅在你有权分析该软件的前提下进行。

## 官方文档

- [Frida 官网](https://frida.re/)
- [Frida 文档](https://frida.re/docs/home/)
- [JavaScript API 参考](https://frida.re/docs/javascript-api/)
- [Python 绑定](https://github.com/frida/frida-python)
- [frida-tools](https://github.com/frida/frida-tools)

*命令和代码依据 Frida 官方文档整理，核对日期：2026 年 10 月 15 日。Frida 版本迭代较快，API 细节可能变化，请以官方文档为准。*
