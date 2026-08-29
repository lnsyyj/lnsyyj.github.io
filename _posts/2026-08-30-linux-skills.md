---
layout: post
title: Linux 常用配置｜Useful Linux Shell Configurations
description: 让终端提示符和命令历史更实用的基础配置｜A practical setup for your shell prompt and command history.
date: 2026-08-29 12:00:00 +0800
---

Linux 终端看似简单，但只需两项配置，就能显著提升日常效率：在提示符前显示当前时间，以及在历史命令中保留执行时间。

The Linux terminal is simple by design, but two small changes can make it much more useful: show the current time in your prompt and record timestamps for command history.

## 在提示符前显示当前时间

默认提示符通常只显示用户名、主机名和当前目录。当你同时处理多个任务，或者回看终端截图时，时间信息会非常有帮助。

By default, your prompt normally shows only your user name, host name, and current directory. Adding a timestamp is helpful when you switch between tasks or review terminal output later.

## 为历史命令记录执行时间

`history` 命令可以列出之前执行过的命令。设置 `HISTTIMEFORMAT` 后，列表会同时显示每条命令的时间，方便你定位“某个操作是什么时候做的”。

The `history` command lists commands you have run before. With `HISTTIMEFORMAT` configured, every entry also includes its execution time, making it easier to trace when an action happened.

## 配置步骤｜Setup

{% raw %}
```shell
# 1. 编辑 Bash 配置文件｜Edit the Bash configuration file
vim ~/.bashrc

# 2. 添加以下配置｜Add the following settings
export PS1='[\D{%Y-%m-%d %H:%M:%S}] \u@\h:\w\$ '
export HISTTIMEFORMAT='[%Y-%m-%d %H:%M:%S] '

# 3. 重新加载配置｜Reload the configuration
source ~/.bashrc
```
{% endraw %}

保存文件后执行 `source ~/.bashrc`，新配置会立即在当前终端生效；重新打开终端时也会自动加载。

After saving the file, run `source ~/.bashrc` to apply the changes to the current terminal immediately. They will also load automatically in future terminal sessions.

配置完成后，提示符会类似下面这样：

After configuration, your prompt will look similar to this:

```text
[2026-08-30 10:30:00] jiangyu@server:~/project$
```

历史命令也会带上时间：

Your command history will include timestamps as well:

```text
  128  [2026-08-30 10:18:42] git status
  129  [2026-08-30 10:19:05] git commit -m "update shell config"
```

## 注意事项｜Notes

以上配置针对 Bash。如果你使用的是 Zsh，应修改 `~/.zshrc`；如果是 Fish，则需要使用 Fish 自己的配置语法。修改前也可以先备份配置文件：

These settings are for Bash. If you use Zsh, edit `~/.zshrc` instead. Fish uses its own configuration syntax. It is also a good habit to back up the file before making changes:

```shell
cp ~/.bashrc ~/.bashrc.backup
```

这两个小设置不改变命令本身的行为，却能让排查问题、回顾操作和日常使用都更从容。

These two small settings do not change how commands work, but they make troubleshooting, reviewing work, and everyday terminal use much easier.
