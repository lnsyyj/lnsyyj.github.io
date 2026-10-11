---
layout: post
title: CentOS Stream 9 安装 PostgreSQL 17：远程连接、用户、数据库与建表指南
description: 在 CentOS Stream 9 单机安装 PostgreSQL 17，配置安全的远程连接，创建数据库账号、密码、数据库和数据表，并连接 DBeaver、pgAdmin、DataGrip。
date: 2026-10-11 00:00:00 +0800
tags: [CentOS Stream 9, PostgreSQL, Linux, 数据库, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上安装 **PostgreSQL 17**，并完成从首次启动到远程使用的基本配置。最终结构是一个 PostgreSQL 实例运行在一台服务器上，客户端通过内网、VPN 或 SSH 隧道连接。

安装使用 PostgreSQL 官方 PGDG 软件源。CentOS Stream 9 自带的软件仓库可能提供不同的 PostgreSQL 主版本；要指定 PostgreSQL 17，应安装 `postgresql17` 系列软件包。[PostgreSQL Red Hat 系列安装说明](https://www.postgresql.org/download/linux/redhat/)

> 示例命令面向 CentOS Stream 9 的 x86_64 主机。请将示例中的服务器 IP、客户端 IP、数据库名、用户名和密码替换成自己的值。以下远程防火墙规则只放行指定客户端 IP，不建议将 PostgreSQL 的 5432 端口开放给所有公网地址。

## 一、确认系统和网络信息

先确认系统版本、CPU 架构和服务器地址：

```bash
cat /etc/centos-release
uname -m
ip -br address
```

`uname -m` 如果输出 `x86_64`，可使用本文的软件源命令。若输出 `aarch64`，请从 [PGDG 官方仓库页面](https://yum.postgresql.org/repopackages/)选择对应架构的仓库 RPM。

还需要知道远程客户端访问服务器时使用的**源 IP 地址**。如果客户端通过公司出口、家庭路由器或 VPN 访问，服务器看到的地址可能是出口地址，而不是电脑的内网地址。下面用 `198.51.100.25/32` 作为示例；请替换成自己的客户端公网 IP 或 VPN 地址。`/32` 表示仅允许这个 IPv4 地址。

## 二、添加 PostgreSQL 官方软件源并安装 PostgreSQL 17

使用 PGDG 的 EL 9 仓库 RPM，禁用系统自带的 PostgreSQL 模块，避免 DNF 选择到其他主版本，然后安装服务器和常用扩展包：

```bash
sudo dnf install -y \
  https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

sudo dnf -qy module disable postgresql
sudo dnf install -y postgresql17-server postgresql17-contrib
```

其中：

- `postgresql17-server`：PostgreSQL 17 服务端和客户端命令。
- `postgresql17-contrib`：PostgreSQL 官方提供的一组常用扩展模块。
- 仓库中的小版本会随 PGDG 更新；本步骤安装的是当前仓库提供的 PostgreSQL 17 系列包。

## 三、初始化数据库并设置开机启动

RPM 安装不会自动初始化数据库，也不会自动开启服务。首次安装时执行一次初始化：

```bash
sudo /usr/pgsql-17/bin/postgresql-17-setup initdb
```

正常情况下会看到初始化成功提示。然后启用并立即启动 PostgreSQL 17：

```bash
sudo systemctl enable --now postgresql-17
sudo systemctl status postgresql-17 --no-pager
```

确认版本和服务状态：

```bash
sudo -iu postgres /usr/pgsql-17/bin/psql -c 'SELECT version();'
sudo -iu postgres /usr/pgsql-17/bin/psql -c 'SHOW data_directory;'
```

PGDG RPM 的默认数据目录通常是 `/var/lib/pgsql/17/data`。后续配置前也可以直接向 PostgreSQL 查询配置文件位置：

```bash
sudo -iu postgres /usr/pgsql-17/bin/psql -Atc 'SHOW config_file; SHOW hba_file;'
```

## 四、配置远程连接

PostgreSQL 默认只监听本机回环地址。远程访问需要同时满足三件事：服务监听服务器网络接口、`pg_hba.conf` 允许指定来源通过密码认证、系统及云平台防火墙放行连接。[PostgreSQL 连接设置文档](https://www.postgresql.org/docs/17/runtime-config-connection.html) [pg_hba.conf 文档](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html)

### 4.1 设置监听地址和密码加密方式

编辑 `postgresql.conf`：

```bash
sudo vi /var/lib/pgsql/17/data/postgresql.conf
```

找到对应设置并调整：

```conf
listen_addresses = '*'
password_encryption = scram-sha-256
```

`listen_addresses = '*'` 让 PostgreSQL 监听所有网络接口，适合不知道服务器内网 IP 或服务器 IP 可能变化的情况。如果服务器有固定内网地址，也可以收紧为只监听本机和内网地址，例如：

```conf
listen_addresses = 'localhost,10.0.0.10'
```

这里的 `10.0.0.10` 要替换为服务器真实内网地址。监听所有地址不等于允许所有人登录；下一步的访问控制和防火墙仍然要配置。

### 4.2 仅允许指定客户端通过密码认证

编辑客户端认证文件：

```bash
sudo vi /var/lib/pgsql/17/data/pg_hba.conf
```

在文件末尾添加一条规则，将来源地址替换成远程客户端的实际 IP：

```conf
# 允许指定客户端使用 SCRAM 密码连接 appdb
host    appdb    appuser    198.51.100.25/32    scram-sha-256
```

字段依次表示连接类型、数据库、数据库用户、客户端来源地址和认证方式。请只允许需要访问的数据库、用户和来源网段。`pg_hba.conf` 按从上到下的顺序匹配规则；如果文件中有更宽泛的拒绝规则，应将允许规则放在它前面。不要使用 `trust` 作为远程认证方式，因为它不要求密码。[PostgreSQL 密码认证说明](https://www.postgresql.org/docs/17/auth-password.html)

如果有一段可信任的内网需要连接，可以把单个地址换成对应网段，例如 `192.168.10.0/24`。不要随手改成 `0.0.0.0/0`，那会匹配所有 IPv4 来源。

### 4.3 配置 CentOS 防火墙

先查看 firewalld 是否运行以及网卡所在区域：

```bash
sudo firewall-cmd --state
sudo firewall-cmd --get-active-zones
```

如果 firewalld 正在运行，在网卡使用的区域添加只允许指定客户端 IP 连接 5432 端口的规则。示例区域为 `public`，若上一步显示的是其他区域，请替换区域名：

```bash
sudo firewall-cmd --permanent --zone=public \
  --add-rich-rule='rule family="ipv4" source address="198.51.100.25/32" port port="5432" protocol="tcp" accept'
sudo firewall-cmd --reload
sudo firewall-cmd --zone=public --list-rich-rules
```

如果 `firewall-cmd --state` 显示 `not running`，先确认服务器是否使用了其他主机防火墙或云平台安全组；不要在远程 SSH 会话中贸然启动或重配防火墙，以免影响现有远程管理连接。

如果服务器在云平台，还要在云安全组或网络 ACL 中添加相同限制：入站 TCP 5432，只允许客户端公网 IP 或 VPN 网段。操作系统防火墙和云安全组是两层独立的规则，都要检查。

### 4.4 重启服务并检查监听

`listen_addresses` 需要重启服务才能生效：

```bash
sudo systemctl restart postgresql-17
sudo systemctl status postgresql-17 --no-pager
sudo ss -lntp | grep 5432
```

看到 `0.0.0.0:5432` 或服务器指定 IP 的 `:5432`，表示正在对应接口监听。若只看到 `127.0.0.1:5432`，说明监听地址没有生效，检查配置文件路径、配置拼写和重启结果。

## 五、创建数据库账号、密码和数据库

PostgreSQL 的数据库角色和 Linux 系统账号是两回事。下面用系统内置的 `postgres` 管理员账号进入 psql：

```bash
sudo -iu postgres /usr/pgsql-17/bin/psql
```

在 `psql` 提示符内创建一个应用账号。这个账号只用于登录，不授予超级用户权限：

```sql
CREATE ROLE appuser LOGIN;
```

接着在 `psql` 中单独执行密码命令：

```text
\password appuser
```

按提示输入两次强密码。`\password` 是 psql 命令，不是 SQL；它会交互式读取密码，避免把明文密码写进 SQL 命令历史。PostgreSQL 支持用该命令设置角色密码。[psql 命令说明](https://www.postgresql.org/docs/17/app-psql.html)

为该账号创建一个数据库，并将数据库所有权交给它：

```sql
CREATE DATABASE appdb OWNER appuser ENCODING 'UTF8';
```

退出管理员会话：

```text
\q
```

这里的 `appuser` 和 `appdb` 是示例名称。不要让日常应用使用 `postgres` 超级用户账号；应用只需要拥有自己的数据库。

## 六、连接数据库并创建第一张表

### 6.1 在服务器上测试账号和数据库

用 TCP 方式连接本机 PostgreSQL，模拟客户端连接：

```bash
/usr/pgsql-17/bin/psql -h 127.0.0.1 -p 5432 -U appuser -d appdb -W
```

`-W` 会提示输入密码。成功后会进入 `appdb=>` 提示符。

### 6.2 创建表、插入和查询数据

在连接到 `appdb` 的 `psql` 提示符中运行：

```sql
CREATE TABLE public.notes (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       varchar(200) NOT NULL,
    body        text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.notes (title, body)
VALUES ('第一条记录', 'PostgreSQL 17 已经可以正常使用。');

SELECT id, title, body, created_at
FROM public.notes
ORDER BY id;
```

常见 psql 命令：

| 命令 | 作用 |
| --- | --- |
| `\l` | 列出数据库 |
| `\du` | 列出数据库角色 |
| `\dt` | 列出当前数据库中的表 |
| `\d public.notes` | 查看表结构 |
| `\conninfo` | 查看当前连接信息 |
| `\q` | 退出 psql |

更多表定义语法可以查看 [PostgreSQL 17 CREATE TABLE 文档](https://www.postgresql.org/docs/17/sql-createtable.html)。

## 七、从另一台电脑远程连接

### 7.1 使用 psql 命令行

从已放行的客户端电脑执行：

```bash
psql -h <服务器IP> -p 5432 -U appuser -d appdb -W
```

例如服务器内网 IP 是 `10.0.0.10`：

```bash
psql -h 10.0.0.10 -p 5432 -U appuser -d appdb -W
```

如果是 Windows 客户端，可以先安装 PostgreSQL 客户端工具，或直接使用下节介绍的图形化工具。连接成功后，执行 `\conninfo` 查看当前连接；执行 `SELECT current_database(), current_user;` 确认使用的是 `appdb` 和 `appuser`。

### 7.2 使用 SSH 隧道连接公网服务器

如果数据库服务器在公网，不希望直接暴露 5432 端口，可以从客户端建立 SSH 隧道：

```bash
ssh -N -L 15432:127.0.0.1:5432 <Linux登录用户>@<服务器IP>
```

隧道保持运行时，客户端工具填写：

- Host：`127.0.0.1`
- Port：`15432`
- Database：`appdb`
- Username：`appuser`
- Password：创建角色时设置的密码

SSH 隧道会把本机 `15432` 转发到服务器的 `127.0.0.1:5432`。使用隧道时，安全组无需向整个互联网开放 PostgreSQL 端口；服务器仍需允许 SSH 访问。若采用此方式，确认 `pg_hba.conf` 保留了本机回环连接规则。

## 八、常用远程图形化客户端

连接时，这些工具的基本字段相同：服务器地址、端口 `5432`、数据库名 `appdb`、用户名 `appuser` 和密码。如果使用 SSH 隧道，填写隧道后的本机地址和端口，或使用工具内置的 SSH 配置。

| 工具 | 适合场景 | 连接方式 |
| --- | --- | --- |
| [DBeaver Community](https://dbeaver.io/download/) | Windows、macOS、Linux 通用；适合同时管理多种数据库 | 新建连接 → PostgreSQL → 填写 Host、Port、Database、Username、Password → Test Connection |
| [pgAdmin 4](https://www.pgadmin.org/download/) | PostgreSQL 官方图形化管理工具；适合查看服务端对象和执行 SQL | Register → Server → Connection 页填写 Host、Port、Maintenance database、Username、Password |
| [DataGrip](https://www.jetbrains.com/datagrip/) | JetBrains 数据库 IDE；适合频繁编写和调试 SQL 的开发者 | New Data Source → PostgreSQL → 填写连接参数并测试 |

首次连接时，工具可能提示下载 PostgreSQL JDBC 驱动，允许下载即可。远程连接如果报超时，先检查客户端源 IP 是否加入 `pg_hba.conf`、firewalld 和云安全组。

## 九、常见问题排查

### `connection refused`

PostgreSQL 服务未运行、端口没有监听，或 `listen_addresses` 没有生效。检查：

```bash
sudo systemctl status postgresql-17 --no-pager
sudo ss -lntp | grep 5432
```

### 连接一直超时

通常是网络层没有放行。确认客户端使用的源 IP、firewalld 活动区域、云安全组、路由/VPN以及服务器公网或内网地址。

### `no pg_hba.conf entry`

来源 IP、数据库名或用户名没有匹配到 `pg_hba.conf` 规则，或者允许规则排在了更早的拒绝规则之后。修改后可重新加载配置：

```bash
sudo systemctl reload postgresql-17
```

### `password authentication failed`

确认连接使用的是 PostgreSQL 角色密码，而不是 Linux 密码；检查用户名、数据库名和密码。若需要重设密码，以 `postgres` 管理员登录后执行 `\password appuser`。

### 命令提示 `psql: command not found`

PGDG 的二进制文件通常位于 `/usr/pgsql-17/bin/`。在服务器上可以用完整路径运行 `/usr/pgsql-17/bin/psql`，或把该目录加入当前 Shell 的 `PATH`。

## 十、简单备份与恢复

安装完成后，建议把备份纳入日常维护。以下命令在客户端或服务器上运行，密码会交互式提示：

```bash
pg_dump -h <服务器IP> -p 5432 -U appuser -d appdb -F c -f appdb.dump
```

`-F c` 创建可由 `pg_restore` 处理的自定义格式备份。恢复到新数据库前先创建目标库，然后执行：

```bash
createdb -h <服务器IP> -p 5432 -U appuser appdb_restore
pg_restore -h <服务器IP> -p 5432 -U appuser -d appdb_restore appdb.dump
```

将备份保存在数据库服务器之外，并定期实际演练恢复；仅看到备份文件存在，并不能证明数据可以恢复。

## 配置清单

完成后可按此检查：

- PostgreSQL 17 服务已设为开机启动，当前状态为 `active (running)`。
- `listen_addresses` 监听了预期网卡，默认端口为 `5432`。
- `pg_hba.conf` 只允许指定数据库、账号和客户端 CIDR，并使用 `scram-sha-256`。
- firewalld 与云安全组只放行可信客户端来源。
- 应用使用单独的普通登录账号，不使用超级用户 `postgres`。
- 公网环境优先使用 VPN 或 SSH 隧道；直接连接时应另行配置 TLS 并限制来源地址。
- 已完成一次备份，并确认可以恢复。

## 官方文档

- [PostgreSQL Linux 下载：Red Hat 系列](https://www.postgresql.org/download/linux/redhat/)
- [PGDG 仓库 RPM](https://yum.postgresql.org/repopackages/)
- [PostgreSQL 17 连接设置](https://www.postgresql.org/docs/17/runtime-config-connection.html)
- [PostgreSQL 17 客户端认证文件 pg_hba.conf](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html)
- [PostgreSQL 17 密码认证](https://www.postgresql.org/docs/17/auth-password.html)
- [PostgreSQL 17 CREATE ROLE](https://www.postgresql.org/docs/17/sql-createrole.html)
- [PostgreSQL 17 CREATE DATABASE](https://www.postgresql.org/docs/17/sql-createdatabase.html)
- [PostgreSQL 17 CREATE TABLE](https://www.postgresql.org/docs/17/sql-createtable.html)
- [DBeaver PostgreSQL 连接说明](https://dbeaver.com/docs/dbeaver/Database-driver-PostgreSQL/)
- [pgAdmin 连接服务器](https://www.pgadmin.org/docs/pgadmin4/latest/connect_to_server.html)
- [DataGrip 数据库连接](https://www.jetbrains.com/help/datagrip/connecting-to-a-database.html)

*命令和配置依据 PostgreSQL 官方文档及 PGDG 仓库说明整理，核对日期：2026 年 10 月 11 日。软件源和客户端界面可能更新，具体以当前官方页面为准。*
