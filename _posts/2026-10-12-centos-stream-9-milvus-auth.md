---
layout: post
title: CentOS Stream 9 配置 Milvus 账号密码：启用认证与 RBAC 权限管理
description: 在 CentOS Stream 9 上为 Milvus 单机版启用身份认证，修改 root 默认密码，创建用户与角色，用 RBAC 做最小权限授权，并通过读写测试验证权限，每步都有解释。
date: 2026-10-12 00:00:00 +0800
tags: [CentOS Stream 9, Milvus, 安全, 权限, 运维]
---

本文介绍如何在一台 **CentOS Stream 9** 服务器上为 **Milvus 单机版**启用账号密码认证，并完成用户与角色（RBAC）管理：启用认证、修改 `root` 默认密码、创建普通用户、按最小权限授权，最后用不同账号实际读写验证。每一步都会解释命令和参数的含义。

> 前提：已按《CentOS Stream 9 安装 Milvus 向量数据库》用 Docker Compose 跑起 Milvus（默认监听 `127.0.0.1:19530`），并已安装 `pymilvus`。下文沿用《使用 Milvus》一文里创建的 `articles` 集合做权限演示。

## 一、先理解 Milvus 的账号体系

Milvus 内置了一套"用户—角色—权限"的 RBAC 模型，但**默认是关闭认证的**：任何人只要能连上 19530 端口就能读写，相当于没有账号密码。启用后，所有请求都要先验证身份，再按角色检查权限。

几个关键概念：

| 概念 | 说明 |
| --- | --- |
| 用户（user） | 登录账号，有用户名和密码 |
| 角色（role） | 一组权限的集合，可以授予用户 |
| 权限（privilege） | 对某类对象（全局、集合等）的某类操作（查询、插入、删集合等） |
| `root` 用户 | 内置超级管理员，默认密码是 `Milvus`，拥有最高权限 |
| `admin` 角色 | 内置角色，拥有全部权限 |
| `public` 角色 | 内置角色，只读权限，会自动分配给每个用户 |

注意区分：Milvus 的 `root`/`Milvus` 是 Milvus 自己的账号，和 compose 里 MinIO 的 `minioadmin`/`minioadmin` 是两套东西，不要混用。

## 二、启用认证

认证由配置项 `common.security.authorizationEnabled` 控制，默认 `false`。把它改成 `true` 有两种方式。

### 2.1 方式一：环境变量（推荐，最简单）

编辑 Docker Compose 文件里的 `standalone` 服务，在 `environment` 下加一行：

```yaml
  standalone:
    ...
    environment:
      MINIO_REGION: us-east-1
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
      COMMON_SECURITY_AUTHORIZATION_ENABLED: "true"
```

Milvus 的配置项可以映射成环境变量：把点号 `.` 换成下划线 `_` 并全大写。所以 `common.security.authorizationEnabled` 对应 `COMMON_SECURITY_AUTHORIZATION_ENABLED`，值 `"true"` 表示开启认证。

然后让容器按新配置重建：

```bash
sudo docker compose up -d
```

`docker compose up -d` 会检测到服务定义变化，自动重建 `standalone` 容器使环境变量生效（只是重启不一定会重建，所以用 `up -d`）。

### 2.2 方式二：挂载 milvus.yaml 配置文件

适合需要同时改多个配置项的场景。先创建配置目录和文件：

```bash
mkdir -p configs
cat > configs/milvus.yaml <<'EOF'
common:
  security:
    authorizationEnabled: true
EOF
```

`mkdir -p` 创建 `configs` 目录；`cat > ... <<'EOF' ... EOF` 把中间内容写入 `milvus.yaml`。然后在 compose 的 `standalone` 服务里增加挂载：

```yaml
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/milvus:/var/lib/milvus
      - ./configs/milvus.yaml:/milvus/configs/milvus.yaml
```

这条把宿主机 `./configs/milvus.yaml` 挂载到容器内的 `/milvus/configs/milvus.yaml`，覆盖默认配置。保存后同样执行 `sudo docker compose up -d`。

### 2.3 验证认证已开启

```python
from pymilvus import MilvusClient

try:
    bad = MilvusClient(uri="http://localhost:19530")
except Exception as e:
    print("无凭据连接被拒绝：", e)

client = MilvusClient(uri="http://localhost:19530", user="root", password="Milvus")
print(client.list_users())
```

第一个连接不传账号密码，启用认证后会抛异常；第二个连接用默认管理员 `root`/`Milvus` 登录成功，`list_users()` 列出所有用户，初始应只有 `root`。

## 三、修改 root 默认密码

`root` 的默认密码是公开的 `Milvus`，启用认证后第一件事就是改掉：

```python
client.update_password(
    user_name="root",
    old_password="Milvus",
    new_password="RootPass123!",
)
```

`update_password` 把指定用户的密码从旧值改成新值：`user_name` 是目标用户，`old_password` 是它当前的密码，`new_password` 是新密码。这里改的是 root 自己，所以要知道旧密码。把 `RootPass123!` 换成你自己的强密码。

改完后，旧密码立即失效，后续操作都要用新密码重新连接：

```python
client = MilvusClient(
    uri="http://localhost:19530",
    user="root",
    password="RootPass123!",
)
```

## 四、创建普通用户

```python
client.create_user(user_name="app_writer", password="WriterPass123!")
client.create_user(user_name="app_reader", password="ReaderPass123!")

print(client.list_users())
```

`create_user(user_name=..., password=...)` 创建用户。`app_writer` 后面会被授予写权限，`app_reader` 只读。`list_users()` 确认现在有三个用户：`root`、`app_writer`、`app_reader`。

查看某个用户的信息和它的角色：

```python
print(client.describe_user("app_writer"))
```

`describe_user` 返回用户名、已授予的角色等。新用户默认会自动带上内置的 `public` 只读角色。

## 五、角色与权限（RBAC）

### 5.1 内置角色

- `admin`：拥有全部权限，`root` 用户默认拥有它。
- `public`：只读权限（可以 `query`、`search`、查看结构等），**自动分配给所有用户**，所以新用户默认能读、不能写。

### 5.2 创建自定义角色并授权

给"写数据"这个职责建一个角色 `writer`，只授予 `articles` 集合的插入和删除权限：

```python
client.create_role(role_name="writer")

client.grant_privilege(
    role_name="writer",
    object_type="Collection",
    privilege="Insert",
    object_name="articles",
    db_name="default",
)
client.grant_privilege(
    role_name="writer",
    object_type="Collection",
    privilege="Delete",
    object_name="articles",
    db_name="default",
)
```

`create_role` 创建一个空角色。`grant_privilege` 给角色加一条权限：`object_type` 是对象类型（`Collection` 表示集合），`privilege` 是具体操作（`Insert` 插入、`Delete` 删除），`object_name` 是对象名（`articles`），`db_name` 是数据库名（默认库 `default`）。这样 `writer` 角色就只对 `default.articles` 有插入和删除权限，其他操作、其他集合都没有权限。

把角色授予用户：

```python
client.grant_role(user_name="app_writer", role_name="writer")

print(client.describe_role("writer"))
print(client.describe_user("app_writer"))
```

`grant_role` 把 `writer` 角色授予 `app_writer` 用户。`describe_role` 查看角色包含哪些权限，`describe_user` 查看用户现在有哪些角色。常见的权限取值还有：`Search`（向量检索）、`Query`（标量查询）、`CreateIndex`、`Load`、`Release`、`Flush`，以及全局级的 `CreateCollection`、`DropCollection`、`CreateUser`、`DropUser` 等。

## 六、用不同账号验证权限

### 6.1 写用户：能插入，但不能删集合

```python
import random

writer = MilvusClient(uri="http://localhost:19530", user="app_writer", password="WriterPass123!")

writer.insert(
    collection_name="articles",
    data=[{
        "title": "权限测试",
        "category": "测试",
        "body": "用 app_writer 写入的一条数据。",
        "embedding": [random.random() for _ in range(2560)],
    }],
)
print("插入成功")

try:
    writer.drop_collection("articles")
except Exception as e:
    print("删除集合被拒绝：", e)
```

`app_writer` 有 `articles` 的 `Insert` 权限，所以 `insert` 成功；但它没有 `DropCollection` 权限，所以 `drop_collection` 会抛权限错误。这正体现了最小权限：只能写数据，不能做删库级操作。

### 6.2 读用户：能查询，但不能写

```python
reader = MilvusClient(uri="http://localhost:19530", user="app_reader", password="ReaderPass123!")

res = reader.query(
    collection_name="articles",
    filter="title == '权限测试'",
    output_fields=["id", "title"],
    limit=10,
)
print("查询成功：", res)

try:
    reader.insert(
        collection_name="articles",
        data=[{
            "title": "越权写入",
            "category": "测试",
            "body": "不应成功。",
            "embedding": [random.random() for _ in range(2560)],
        }],
    )
except Exception as e:
    print("写入被拒绝：", e)
```

`app_reader` 只带了内置的 `public` 只读角色，所以 `query` 成功、`insert` 被拒绝。如果希望读者能"向量检索"但连标量字段也不能随便查，可以再建一个只授予 `Search` 权限的角色，按同样的方式收窄。

## 七、修改密码与删除用户

用户自己改密码用 `update_password`（需要旧密码）。删除用户用 `drop_user`：

```python
client.drop_user(user_name="app_reader")
print(client.list_users())
```

`drop_user` 删除指定用户，删除后该用户无法再登录。对应地，删除角色用 `drop_role(role_name="writer")`，收回用户角色用 `revoke_role(user_name=..., role_name=...)`，收回角色的某条权限用 `revoke_privilege(...)`。

## 八、安全建议

- **立即修改 root 默认密码**，并为不同用途创建独立账号，按最小权限授予角色。
- **区分读写**：写库的账号和读库的账号分开，避免程序里用一个高权限账号到处跑。
- **不要暴露公网**：即便开了密码认证，19530 端口也应只在内网、VPN 或 SSH 隧道里访问；必要时给连接配 TLS。
- **同时改掉 MinIO 默认密码**：compose 里 `minioadmin`/`minioadmin` 是对象存储账号，和 Milvus 用户是两套，都要处理。
- **定期轮换密码**，并在生产环境把敏感凭据放进密钥管理系统而不是硬编码在代码里。

## 九、常见问题

### 启用认证后所有客户端都连不上了

先确认容器真的按新配置重建了（`docker compose up -d` 而不是只 restart），再用 root/Milvus 登录试试。检查 `docker compose logs standalone` 里有没有配置报错。

### 报权限错误（not authorized / permission denied）

用 `describe_user` 看用户有哪些角色，再用 `describe_role` 看角色有哪些权限，确认 `object_type`、`privilege`、`object_name`、`db_name` 都对。常见问题是 `db_name` 没写或写错。

### 新用户默认就能读数据吗

会。所有用户自动带内置 `public` 只读角色。如果连读都不想让某用户看到，需要自定义角色并只授予所需的最小权限，同时注意 `public` 的只读范围。

### 忘记 root 密码怎么办

参考 Milvus 官方文档的密码重置流程（管理员通常可借助 `reset_password` 或临时调整配置里的超级用户设置）。建议改密后立即把新密码妥善保存。

### MinIO 控制台（9001）登录失败

那是 MinIO 自己的账号 `minioadmin`/`minioadmin`，和 Milvus 的 root 用户无关，不要用 Milvus 账号去登 MinIO。

## 官方文档

- [Milvus 认证与授权（RBAC）](https://milvus.io/docs/users_and_roles.md)
- [Milvus 配置说明](https://milvus.io/docs/configure-docker.md)
- [pymilvus 用户与角色管理](https://milvus.io/docs/install-pymilvus.md)
- [Milvus 权限列表](https://milvus.io/docs/users_and_roles.md)

*命令和代码依据 Milvus v3.x 与 pymilvus 官方文档整理，核对日期：2026 年 10 月 12 日。配置项、默认密码和客户端 API 可能随版本变化，具体以官方文档为准。*
