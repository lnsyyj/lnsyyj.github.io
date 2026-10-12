---
layout: post
title: CentOS Stream 9 SSH 配置详解：连接数、root 远程登录与安全加固
description: 详解 CentOS Stream 9 的 OpenSSH 服务端配置：修改 SSH 连接数与认证限流、允许 root 远程登录、更换端口、密钥登录与常用安全加固选项，逐步解释每个配置项的含义。
date: 2026-10-12 00:00:00 +0800
tags: [CentOS Stream 9, SSH, Linux, 安全, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上配置 OpenSSH 服务端（sshd），覆盖最常见的几类需求：修改 SSH 连接数与认证限流、允许 root 用户远程登录、更换默认端口，以及一批常用的安全加固选项。每个配置项都会解释它的含义、默认值和取值。

> 示例命令面向 CentOS Stream 9，使用其自带的 OpenSSH 8.7。SSH 是远程管理服务器的入口，改错配置可能把自己锁在服务器外面，因此强烈建议按"先备份、先验证、保持一个会话"的方式操作，并在确认新配置生效前不要关闭现有的 SSH 连接。

## 一、SSH 配置文件在哪里

服务端（sshd）读取的配置主要有两处：

- 主配置文件：`/etc/ssh/sshd_config`
- 片段目录：`/etc/ssh/sshd_config.d/*.conf`

CentOS Stream 9 的 `/etc/ssh/sshd_config` 很精简，里面有一行 `Include /etc/ssh/sshd_config.d/*.conf`，表示会自动读取片段目录下所有 `.conf` 文件。官方推荐把自定义配置放到片段目录里（而不是直接改主文件），这样系统升级时不容易覆盖你的改动，也便于按用途拆分多个文件。

查看主配置文件：

```bash
sudo cat /etc/ssh/sshd_config
```

查看当前最终生效的配置（含默认值）：

```bash
sudo sshd -T
```

`sshd -T` 会把"主文件 + 片段 + 编译默认值"合并后的最终结果打印出来，是排查"我配了为什么没生效"最直接的办法。后面每改完一个配置，都可以用 `sudo sshd -T | grep 关键字` 确认最终生效值。

配置优先级：sshd 按顺序读取配置，对于大多数关键字，**先出现的值生效**（first match wins）。因此自定义片段建议用排序靠前的文件名，例如 `/etc/ssh/sshd_config.d/00-security.conf`，确保它先被读取。具体以 `sshd -T` 输出为准。

## 二、修改前的安全准备

改远程登录配置有"把自己锁在门外"的风险，先做三件事：

1. 备份配置：

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F)
```

`cp` 复制一份带日期的备份；`$(date +%F)` 会替换成当天日期（如 2026-10-12）。

2. 保持一个已登录的会话不关闭。改完配置后用这个会话验证；万一新配置有问题，还能在旧会话里修复。

3. 每次改动后先用 `sudo sshd -t` 做语法检查，再重启服务。

`sshd -t` 检查配置文件语法是否合法：输出为空且退出码为 0 表示没问题；有问题会打印出错位置。它不会中断正在运行的服务，可以放心执行。

## 三、允许 root 用户远程登录

控制 root 登录的是 `PermitRootLogin`，它的取值如下：

| 取值 | 含义 |
| --- | --- |
| `yes` | 允许 root 用密码或密钥登录 |
| `prohibit-password` | 只允许 root 用密钥登录，禁止密码（新写法） |
| `without-password` | 与 `prohibit-password` 等价（旧写法，已不推荐） |
| `forced-commands-only` | 只允许 root 执行被强制指定的命令，不给登录 shell |
| `no` | 禁止 root 通过 SSH 登录 |

CentOS Stream 9 的默认生效值是 `prohibit-password`，即默认允许密钥登录、禁止密码登录。确认当前值：

```bash
sudo sshd -T | grep -i permitrootlogin
```

如果你确实需要 root 用密码远程登录，创建（或编辑）一个片段文件：

```bash
sudo vi /etc/ssh/sshd_config.d/00-security.conf
```

写入：

```conf
PermitRootLogin yes
```

同时确认密码认证是开启的（默认开启）：

```conf
PasswordAuthentication yes
```

`PasswordAuthentication` 控制是否允许密码登录（对所有用户生效，不只是 root）。如果你希望 root 只用密钥登录、普通用户仍能用密码，则写 `PermitRootLogin prohibit-password` 加 `PasswordAuthentication yes`。

安全建议：直接对公网开放 root 密码登录风险很高（账号固定、容易成为暴力破解目标）。更稳妥的做法是保持 `PermitRootLogin prohibit-password`，给 root 配置密钥登录，或先用普通用户登录再 `sudo -i` 切到 root。必须开 root 密码登录时，务必配合强密码、`AllowUsers` 白名单和 Fail2Ban 等防护。

保存后验证并重启：

```bash
sudo sshd -t
sudo systemctl restart sshd
```

注意 CentOS Stream 9 的服务名是 `sshd`（`systemctl restart sshd`），不是 Debian 系常用的 `ssh`。

## 四、SSH 连接数相关配置

"连接数"不是一个单独开关，而是由多个选项共同控制，分别对应不同阶段：

| 选项 | 控制什么 | 默认值 |
| --- | --- | --- |
| `MaxStartups` | 同时处于"未认证"状态的连接上限 | `10:30:100` |
| `MaxSessions` | 单条 TCP 连接上允许的最大会话数 | `10` |
| `MaxAuthTries` | 每个连接允许的认证尝试次数 | `6` |
| `LoginGraceTime` | 完成认证的最长时间 | `2m` |
| `ClientAliveInterval` / `ClientAliveCountMax` | 检测并断开空闲、失联会话 | `0` / `3` |

### 4.1 MaxStartups：限制并发未认证连接

```conf
MaxStartups 10:30:100
```

它的格式是 `start:rate:full`：允许最多 `start` 个未认证连接；超过后开始按概率随机丢弃新连接，丢弃概率随并发数上升，直到并发数达到 `full` 时拒绝所有新连接；`rate` 表示丢弃概率的增长速率（如 30 表示"每 100 个连接丢弃 30 个"的斜率）。这个参数主要用来抵御暴力破解和连接洪水——攻击者往往发起大量半开连接尝试登录，`MaxStartups` 能把它们挡在认证之前。

### 4.2 MaxSessions：单连接会话数

```conf
MaxSessions 10
```

SSH 支持"连接复用"：一条 TCP 连接上可以跑多个会话（多个 shell/命令）。`MaxSessions` 限制的是每一条连接上最多同时打开的会话数，而不是服务器总连接数。默认 10 对大多数情况够用；调大可以支持更多复用会话，调小可以限制单个客户端占用的资源。

### 4.3 MaxAuthTries：认证尝试次数

```conf
MaxAuthTries 6
```

限制每个连接最多允许尝试多少次认证（输错密码、密钥被拒都计入）。达到上限后连接被断开，客户端必须重新建立连接再试。适当调小（如 3）可以增加暴力破解的成本，但调太小会让偶尔输错密码的人频繁被断开。

### 4.4 LoginGraceTime：认证时限

```conf
LoginGraceTime 2m
```

限制客户端从建立连接到完成认证的最长时间，超时仍未认证成功就断开。调小可以释放被长时间占用的未认证连接（配合 `MaxStartups` 使用），默认 2 分钟。

### 4.5 ClientAliveInterval / ClientAliveCountMax：空闲与失联断开

```conf
ClientAliveInterval 300
ClientAliveCountMax 3
```

`ClientAliveInterval` 是服务端每隔多少秒向客户端发一次探测包；`ClientAliveCountMax` 是连续多少次无响应后判定失联并断开。上面例子表示每 300 秒探测一次，连续 3 次（约 900 秒）没响应就断开。这能自动清理"客户端直接关机/断网"留下的死连接，释放会话和资源。`ClientAliveInterval 0` 表示不探测（默认）。

把上面这些按需写进 `/etc/ssh/sshd_config.d/00-security.conf` 即可。没有单独的"服务器总连接数"硬上限选项；总并发能力由系统资源（文件描述符、内存）和上述限流参数共同决定。

## 五、修改 SSH 端口

默认 22 端口是无差别扫描的重灾区，改一个非默认端口能挡掉大量自动扫描：

```conf
Port 2222
```

注意：改端口不能替代密码/密钥等真正的安全措施，只是降低噪音。改完端口后还需要完成下面两处配置，否则会登录失败。

### 5.1 SELinux 放行新端口

CentOS Stream 9 默认开启 SELinux，sshd 只能监听标记为 `ssh_port_t` 的端口。给新端口打标签：

```bash
sudo dnf install -y policycoreutils-python-utils
sudo semanage port -a -t ssh_port_t -p tcp 2222
```

`policycoreutils-python-utils` 提供 `semanage` 命令；`semanage port -a` 添加端口标签，`-t ssh_port_t` 指定 ssh 端口类型，`-p tcp` 指定协议。如果提示端口已存在，把 `-a` 换成 `-m`（修改）。确认：

```bash
sudo semanage port -l | grep ssh
```

### 5.2 firewalld 放行新端口

```bash
sudo firewall-cmd --permanent --add-port=2222/tcp
sudo firewall-cmd --reload
```

`--permanent` 写入持久配置（重启后仍有效），`--add-port=2222/tcp` 放行 TCP 2222，`--reload` 立即生效。如果只想允许特定来源访问，改用 rich rule 指定来源 IP 更安全。

务必先用新端口成功建立一次连接，再处理旧端口，避免把自己锁在门外。确认新端口稳定可用后，再移除 22 端口的防火墙规则。

## 六、其他重要安全配置

### 6.1 密码与密钥认证开关

```conf
PubkeyAuthentication yes
PasswordAuthentication yes
PermitEmptyPasswords no
```

`PubkeyAuthentication` 控制是否允许公钥认证（默认开）；`PasswordAuthentication` 控制密码认证；`PermitEmptyPasswords` 禁止空密码账号登录（默认禁止，保持即可）。如果所有用户都已配置密钥，可以把 `PasswordAuthentication` 设为 `no` 彻底关闭密码登录，这是最有效的防爆破手段。

### 6.2 限制允许登录的用户

```conf
AllowUsers alice bob
AllowGroups admins
DenyUsers root
DenyGroups guests
```

`AllowUsers` / `AllowGroups` 是白名单，只允许列出的用户/组登录；`DenyUsers` / `DenyGroups` 是黑名单。白名单优先：同时配置时先按白名单放行，再排除黑名单。生产环境推荐用白名单把登录范围收窄到必要的人。

### 6.3 关闭反向 DNS 与 GSSAPI，加快登录

```conf
UseDNS no
GSSAPIAuthentication no
```

`UseDNS` 控制是否对客户端 IP 做反向域名解析，关闭后登录不再卡在 DNS 查询上；`GSSAPIAuthentication` 是 Kerberos 认证，没有部署 Kerberos 的环境把它关掉可以避免无谓的协商等待。这两项是"SSH 登录慢"最常见的元凶。

### 6.4 登录提示与日志

```conf
Banner /etc/ssh/banner
LogLevel VERBOSE
```

`Banner` 指定登录前展示的横幅文件路径，常用于放法律警示；`LogLevel` 控制 sshd 写日志的详细程度，`VERBOSE` 能记录每次登录使用的认证方式（密码/密钥）和来源，便于审计排查。

### 6.5 转发与 X11

```conf
X11Forwarding no
AllowTcpForwarding no
```

`X11Forwarding` 允许客户端把图形程序显示回本地，不需要时关闭；`AllowTcpForwarding` 允许用户通过 SSH 隧道转发 TCP 端口，如果用户不该拿服务器当跳板，关掉它更安全（但会影响合法的隧道用途，按需决定）。

### 6.6 其他常用项

```conf
StrictModes yes
LoginGraceTime 1m
MaxAuthTries 3
```

`StrictModes` 检查用户主目录、`.ssh` 目录和 `authorized_keys` 的权限是否过于宽松，权限不对会拒绝密钥登录，保持开启即可。

## 七、配置密钥登录

密钥登录比密码更安全，也更方便自动化。在**客户端**生成密钥对：

```bash
ssh-keygen -t ed25519 -C "你的备注"
```

`-t ed25519` 使用 Ed25519 算法（现代、高效、安全）；`-C` 加一段备注，方便识别这把密钥。命令会在 `~/.ssh/` 生成私钥 `id_ed25519` 和公钥 `id_ed25519.pub`。私钥留在客户端，绝不外传。

把公钥上传到服务器：

```bash
ssh-copy-id 用户@服务器IP
```

`ssh-copy-id` 会把公钥追加到服务器的 `~/.ssh/authorized_keys`，并自动设置好权限。之后登录就无需密码（前提是 `PubkeyAuthentication yes`）。

手工配置时注意权限：`~/.ssh` 目录应为 `700`，`authorized_keys` 应为 `600`，且属主是自己，否则 `StrictModes yes` 会拒绝使用该密钥。把 root 的密钥登录与 `PermitRootLogin prohibit-password` 搭配，是兼顾安全与远程管理的常用方案。

## 八、应用并验证

每次修改后按这个流程走一遍：

```bash
sudo sshd -t
sudo systemctl restart sshd
sudo systemctl status sshd --no-pager
```

`sshd -t` 做语法检查；`systemctl restart sshd` 重启服务使配置生效（已建立的会话一般不会断，旧连接继续沿用旧配置）；`status` 确认服务为 `active (running)`。

确认最终生效值（以 `PermitRootLogin` 等为例）：

```bash
sudo sshd -T | grep -Ei 'permitrootlogin|passwordauthentication|maxstartups|maxsessions|maxauthtries'
```

然后用**新的会话**（不要用正在用的那个）测试登录，确认符合预期：root 能否登录、密码/密钥是否按预期工作、新端口能否连通。验证通过后再关闭旧端口或收尾。

## 九、常见问题排查

### 改完配置 root 登录被拒绝

确认 `PermitRootLogin` 与 `PasswordAuthentication` 的最终值：`sudo sshd -T | grep -Ei 'permitrootlogin|passwordauthentication'`。同时检查改动是写在片段目录还是主文件、是否被后面的配置覆盖（先出现的值生效）。

### 提示 `Permission denied, please try again`

密码错误、账号不在 `AllowUsers` 白名单、被 `DenyUsers` 拦截、或账号被锁定都可能触发。查看日志定位：`sudo journalctl -u sshd` 或 `sudo tail -f /var/log/secure`。

### 新端口连不上

三处都要检查：sshd 的 `Port` 配置、SELinux 端口标签（`semanage port -l | grep ssh`）、firewalld 规则（`firewall-cmd --list-ports`）。用 `sudo ss -lntp | grep 2222` 确认 sshd 是否真的在监听新端口。

### 密钥登录失败（`Permission denied (publickey)`）

检查服务器 `~/.ssh/authorized_keys` 是否包含正确公钥、权限是否为 600、目录是否为 700，以及 `StrictModes` 与 `PubkeyAuthentication` 的设置。客户端可用 `ssh -v` 查看详细握手过程定位问题。

### 重启服务后自己掉线了

`systemctl restart sshd` 一般不会断开已有连接；真正掉线通常是配置错误导致新连接进不来、同时旧会话也因某些规则失效。这也是为什么强烈建议始终保持一个已登录会话，并在关掉旧端口、旧登录方式前先验证新方式可用。

## 官方文档

- [OpenSSH sshd_config(5) 手册](https://man.openbsd.org/sshd_config)
- [Red Hat 文档：使用 OpenSSH 在两个系统之间安全通信](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_basic_system_settings/assembly_configuring-secure-communication-between-two-systems-with-openssh_configuring-basic-system-settings)
- [Red Hat 文档：保护 OpenSSH](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/securing_networks/assembly_securing-secure-communication-with-openssh_securing-networks)
- [OpenSSH 官方站点](https://www.openssh.com/)

*命令和配置依据 OpenSSH 8.7 与 Red Hat Enterprise Linux 9 文档整理，核对日期：2026 年 10 月 12 日。各选项默认值可能随版本变化，具体以服务器上 `sshd -T` 的输出为准。*
