---
layout: post
title: 一次 S3 写入的完整旅程：从 SDK 到 RGW、OSD 再到磁盘落盘
description: 基于 Ceph v21.1.2 源码，追踪一次 S3 PUT 的全链路：SDK 签名与 HTTP、RGW 前端与 S3 处理、librados Objecter、Messenger、OSD 的 mClock 队列、PG 复制与 BlueStore 落盘，并逐一列出每一级队列的生产者与消费者。
date: 2026-10-23 00:00:00 +0800
categories: [ceph]
tags: [Ceph, RGW, S3, OSD, Objecter, 消息队列, 时序图]
---

这篇文章追踪**一个 S3 用户在客户端上传一个对象，直到数据真正落到 OSD 磁盘**的完整过程。它会横跨七个层次：S3 SDK、RGW 前端、RGW 请求处理与桶索引、librados(Objecter)、Messenger、OSD、BlueStore。重点是**每一层都有哪些队列、谁在生产、谁在消费**，以及 **mon 在中间扮演什么角色**。基于 **Ceph v21.1.2 源码**。

## 〇、先看一张全景图

```mermaid
flowchart TB
    CLIENT["S3 客户端 SDK<br/>SigV4 签名 + HTTPS PUT"] -->|HTTP| FRONT["RGW 前端 Beast<br/>rgw_asio_frontend"]
    FRONT --> PROC["RGW 请求处理<br/>RGWProcess / S3 handler"]
    PROC --> SAL["SAL Object::write<br/>rgw_rados"]
    SAL --> OBJ["librados Objecter<br/>op_submit"]
    OBJ --> MSG["Messenger AsyncMessenger<br/>out_q"]
    MSG -->|TCP| OSD["目标 OSD<br/>ms_fast_dispatch"]
    OSD --> PG["PrimaryLogPG<br/>do_request"]
    PG --> BS["BlueStore queue_transactions"]
    BS --> DISK["裸盘"]
    MON["Monitor<br/>osdmap + cephx 认证"] -.->|osdmap| OBJ
    PROC -.->|桶索引 cls_rgw OMap| IDX["桶索引对象<br/>经 OSD"]
```

一句话：客户端只跟 RGW 说话，RGW 通过 librados 跟整个 RADOS 集群说话；对象数据写一个 RADOS 对象，元数据（桶索引）写另一个 RADOS 对象。

## 阅读准备：先认识这些名词（是什么 + 为什么）

| 名词 | 是什么 | 为什么这样做 / 作用 |
| --- | --- | --- |
| 哈希 hash | 把任意长度数据压成固定长度"指纹"的函数 | 用定长值代表任意数据，便于均匀分配和校验 |
| HMAC | 带密钥的哈希：`HMAC(密钥, 内容)` | 只有持同一密钥的人能算出同样结果，既证明"内容没被改"，又证明"是你" |
| sha256 | 一种哈希算法，输出 256 位 | 签名、校验和都用它，碰撞概率极低 |
| access key / secret key | 一对钥匙：access key 公开，secret key 保密 | 用 access key 找到"你是谁"，用 secret key 算签名证明"你有钥匙" |
| credential scope | 签名的作用范围：日期/区域/服务/aws4_request | 把签名绑死在"某天某区域某服务"，防止被搬到别处或过期后重用 |
| SignedHeaders | 声明"哪些 Header 参与了签名" | 双方只保证这些字段没被改，其它 Header 可自由增减 |
| pool | RADOS 存储池，可配副本数、CRUSH 规则 | 隔离不同数据、按需设置冗余策略 |
| PG（Placement Group） | pool 里的一组对象，分布与复制的基本单位 | 把海量对象聚成有限 PG，便于管理和定位 |
| primary OSD | 一个 PG 里负责接读写、协调复制的那个 OSD | 让"同一份数据的入口"唯一，避免并发写乱序 |
| osdmap | 描述"所有 pool/PG/OSD 拓扑"的地图 | 客户端和 OSD 都靠它算数据去哪、主备是谁 |
| CRUSH | 用哈希 + 权重 + 故障域规则把 PG 映射到一组 OSD 的算法 | 去中心化：任何节点都能独立算出同样结果，节点增减只迁移少量数据 |
| mon | 集群"大脑"，存 osdmap 等状态、发认证票据 | 提供一致状态视图和门禁，但不参与数据读写 |
| librados | 客户端访问 RADOS 的库，核心是 Objecter | 把"对象读写"翻译成"给哪个 OSD 发消息" |
| MOSDOp | 发给 OSD 的"对象操作"消息 | 承载一次对象读写的具体指令 |
| mClock | OSD 里基于预留/权重/上限的 I/O 调度器 | 公平分配磁盘/队列资源，防止某类流量饿死其它 |
| extent / onode / OMap | BlueStore 里"数据在哪"的元数据 | 把逻辑偏移映射到磁盘位置、存放对象名下的键值 |
| WAL / memtable / fsync | RocksDB 写路径：先写日志、再写内存、日志落盘才确认 | 日志先行保证崩溃可恢复，fsync 保证"确认过就是真持久" |

## 贯穿全文的一个实例

为了下面每一站都有具体数字，我们约定这样一个场景：

- 用户 `alice` 用 S3 SDK 上传一张 **5MB（5242880 字节）的图片**，对象 key 为 `photos/cat.jpg`，目标桶为 `mybucket`；
- 该桶的 bucket marker（创建桶时生成的唯一 id）记为 `8f3e2c1d-...`；
- 桶的数据池是 `default.rgw.buckets.data`，索引池是 `default.rgw.buckets.index`（默认配置，可用 `rgw_bucket_default_data_pool` / `rgw_bucket_default_index_pool` 修改）。

这条 5MB 的数据流会依次穿过：HTTPS → RGW → librados → Messenger → 主 OSD → BlueStore → 裸盘，下面一段一段看它走到哪、变成了什么。

## 一、第一站：S3 SDK 做了什么

SDK（boto3 / AWS SDK 等）本身不在 Ceph 代码库里，但这一步是整个旅程的起点。它做两件事：

1. **把对象封装成 HTTPS PUT 请求**：URL 是 `https://<rgw-host>/<bucket>/<key>`，Header 里带 `Content-Length`、`Content-MD5`、`x-amz-*` 元数据。
2. **SigV4 签名**：用 access key / secret key 对请求算一个 `Authorization` 签名，RGW 凭它验证身份和防篡改。

> 先澄清一个常见误解：**SigV4 是"签名"，不是"加密"**。签名只生成一个校验值贴在请求上，证明"没被改 + 是你发的"，数据本体不被 SigV4 变换。真正做"加密"的是另外两层：传输层的 **HTTPS/TLS**（网络上传时加密），以及可选的 **SSE 服务端加密**（落盘时加密，本文不展开）。下文说的"签名前后"，指的是请求多了一个 `Authorization` 头前后的变化。

### 1.1 一个能亲手验算的完整签名（含具体 AK/SK）

我们给实例补上具体的 AK/SK、endpoint 和请求参数（AK/SK 用 AWS 文档公开的示例密钥，方便你对照验算）：

| 项 | 值 |
| --- | --- |
| endpoint | `https://rgw.example.com` |
| bucket / key | `mybucket` / `photos/cat.jpg` |
| access key（AK，公开） | `AKIAIOSFODNN7EXAMPLE` |
| secret key（SK，保密） | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| region / service | `us-east-1` / `s3` |
| 请求时间 | `20261023T123456Z` |
| 方法 | `PUT` |
| 参与签名的 Header | `content-type`、`host`、`x-amz-content-sha256`、`x-amz-date` |

> 为了让每一步的哈希值都能真实算出来，下面 body 用**空串**举例（`x-amz-content-sha256` 取空串的 sha256）。真实上传 5MB 文件时，只需把这个值换成"5MB 字节的 sha256"，其余步骤完全相同。

**第 0 步，算 body 哈希**：这一步把"数据内容"浓缩成一个 64 位十六进制指纹，之后签名只认这个指纹，不用再碰整个 body。

```text
x-amz-content-sha256 = sha256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

**第 1 步，构造 CanonicalRequest**：把请求压成一段有固定换行的文本，这就是"签名前"要保护的原始内容。

```text
PUT
/mybucket/photos/cat.jpg

content-type:application/octet-stream
host:rgw.example.com
x-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
x-amz-date:20261023T123456Z

content-type;host;x-amz-content-sha256;x-amz-date
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

对它做 sha256：

```text
hex(sha256(CanonicalRequest)) = 76c3594580cb7d5533f78efa4c31852780afdd169621c34c19f3ad72a2815d48
```

**第 2 步，拼 StringToSign**："待签字符串"，把"什么协议、什么时间、什么范围、签的哪份文本"固定下来。

```text
AWS4-HMAC-SHA256
20261023T123456Z
20261023/us-east-1/s3/aws4_request
76c3594580cb7d5533f78efa4c31852780afdd169621c34c19f3ad72a2815d48
```

**第 3 步，用 SK 派生 SigningKey**：四级 HMAC，每一级都用上一级的结果当新密钥，这样签名密钥同时绑定了密钥、日期、区域、服务。

```text
date_k    = HMAC("AWS4" + SK, "20261023")
region_k  = HMAC(date_k,      "us-east-1")
service_k = HMAC(region_k,    "s3")
signing_k = HMAC(service_k,   "aws4_request")
          = d7f95bd2b07ede86baf950294ee76c961290cbcc4c02dee95e7eeb2843aba24d
```

**第 4 步，算签名并贴进请求头**："签名后"多出来的就是这个头。

```text
signature = hex(HMAC(signing_k, StringToSign))
          = 23523b145dbab10a2f42148130ecf05e7f19614e5f02f7fb7e3cadb1dd239f7d

Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20261023/us-east-1/s3/aws4_request,
  SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date,
  Signature=23523b145dbab10a2f42148130ecf05e7f19614e5f02f7fb7e3cadb1dd239f7d
```

### 1.2 RGW 侧：怎么逐层校验（接着上面的值）

RGW 收到请求后，在 `src/rgw/rgw_auth_s3.cc` 里把"你算签名的过程"反向重跑一遍，每一步都用上面这组值核对：

1. **拆头**：`parse_v4_auth_header`（425 行附近）从 `Authorization` 拆出三件套——`Credential=AKIAIOSFODNN7EXAMPLE/20261023/us-east-1/s3/aws4_request`、`SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date`、`Signature=23523b...9f7d`；
2. **验 scope**：`Credential` 必须四段、以 `aws4_request` 结尾（571–609 行）——这里拆出 AK `AKIAIOSFODNN7EXAMPLE` 和 scope `20261023/us-east-1/s3/aws4_request`；
3. **查 SK**：用 AK 查出用户的 SK `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`；
4. **重算请求哈希**：按 `SignedHeaders` 重建同样的 CanonicalRequest，得到同样的 `76c35945...5d48`，拼出同样的 StringToSign；
5. **重算签名**：`transform_secret_key`（987 行）给 SK 拼 `AWS4` → `get_v4_signing_key`（1012 行）四级 HMAC 得到同样的 signing key `d7f95bd2...a24d` → `get_v4_signature`（1053 行）算出期望签名；
6. **比对**：期望签名与请求里的 `Signature` 一致 → 认证通过；`x-amz-date` 与当前时间差超过允许窗口 → 拒绝（防重放）。

RGW 拿到的"逐层结果"就是这条链上的每一个哈希值——只要 body、Header、时间、AK/SK 任何一处对不上，第 4/5 步算出的值就和请求里不一致，认证失败。所以 SigV4 同时回答了两个问题：**你是谁**（有 SK 才能算对）和**请求没被改**（改了哈希就对不上）。

### 1.3 签名与验证时序图

```mermaid
sequenceDiagram
    participant SDK as S3 SDK
    participant RGW as RGW auth_s3
    participant US as RGW 用户存储

    SDK->>SDK: 构造 CanonicalRequest
    SDK->>SDK: 生成 StringToSign
    SDK->>SDK: 派生 SigningKey 并算 Signature
    SDK->>RGW: HTTPS PUT + Authorization 头
    RGW->>RGW: parse_v4_auth_header 拆 Credential SignedHeaders Signature
    RGW->>RGW: 校验 credential scope 格式
    RGW->>US: 用 access key 查 secret key
    US-->>RGW: secret key
    RGW->>RGW: 重建 CanonicalRequest 与 StringToSign
    RGW->>RGW: get_v4_signing_key 与 get_v4_signature
    RGW->>RGW: 常量时间比对签名并校验时间窗
    RGW-->>SDK: 认证通过 继续处理
```

然后数据以流式方式（可能分块、可能 TLS 加密）发往 RGW。SDK 内部有自己的连接池和重试，但这不是 Ceph 的范畴，不展开。

## 二、第二站：RGW 前端与请求处理

### 2.1 HTTP 前端

RGW 的 HTTP 服务默认用 **Beast**（`src/rgw/rgw_asio_frontend.cc`，入口在 `rgw_main.cc`）。每个连接上的请求被解析成一个 `RGWRequest`，交给请求处理线程池。

```text
生产者：客户端 TCP 连接（Beast acceptor 接收）
消费者：RGW 工作线程（线程数由 rgw_thread_pool_size 控制）
```

### 2.2 请求分发与认证

请求进入 `RGWRados::handle_request`（`src/rgw/rgw_process.cc` / `rgw_rest.cc`）：

1. 根据 URL 路由到 S3 处理器：PUT Object 对应 `RGWPutObj_ObjStore_S3`（`src/rgw/rgw_rest_s3.cc`）；
2. 认证：`rgw_auth_s3` 校验 SigV4 签名，把请求关联到租户/用户；
3. 鉴权：检查该用户对这个桶的写权限。

### 2.3 对象写与桶索引

`RGWPutObj_ObjStore::write_data`（实现于 `src/rgw/driver/rados/rgw_rados.cc`）通过 **SAL（Storage Abstraction Layer）** 把数据写入一个 RADOS 对象。与此同时，RGW 维护**桶索引（bucket index）**：`RGWRados::Bucket::UpdateIndex`（`index_op`）以 `CLS_RGW_OP_ADD` 把"对象名 → 位置"写进索引对象（`cls/rgw/cls_rgw.cc`，上一篇文章讲过它底层是 OMap）。

也就是说：一次 S3 PUT，在 RADOS 层面会产生**两类写**——数据对象写 + 桶索引对象写。前者是这次的主干，后者通常异步合并。

桶索引对象本身也是一个 RADOS 对象（在 `bucket.index` 池里，每个桶按 shard 拆成若干索引对象），它几乎没有"数据"，全靠 **OMap** 存条目。以对象 `photos/cat.jpg` 为例，索引对象里的 OMap 大致是：

| OMap key | 值（解码后） |
| --- | --- |
| `photos/cat.jpg` | `rgw_bucket_dir_entry`：key.name=cat.jpg、ver.pool/epoch、locator、meta{size、etag、mtime、owner、category、storage_class} |
| `0_<...>` | 桶日志索引（bi log，多 zone 同步 / reshard 用） |
| `1000_<...>` | 对象实例索引（多版本时每个 instance 一条） |
| `1001_<...>` | OLH（object locator header）数据索引 |
| `2001_<...>` | reshard 日志索引 |

普通对象条目**直接用对象名当 OMap key**，value 是编码后的 `rgw_bucket_dir_entry`（`src/cls/rgw/cls_rgw_types.h`），关键字段有 `cls_rgw_obj_key key`（名字 + instance）、`rgw_bucket_entry_ver ver`（pool + epoch）、`locator`（placement 定位）、`meta`（size / etag / mtime / owner / content_type / storage_class 等）。特殊条目用前缀区分（`0_`、`1000_`、`1001_`、`2001_`，见 `cls_rgw.cc` 的 `bucket_index_prefixes`），首字节 `0x80` 标识"特殊条目"。桶的版本状态等元数据放在索引对象的 **omap header** 里。这也解释了为什么对象很多的桶，`bucket.index` 池 OSD 的 RocksDB 会非常大：每个对象至少一条 OMap，写对象改 OMap、列对象扫 OMap。

### 2.4 另一种入口：librgw

除了 HTTP 服务（Beast 前端），RGW 还能以**库的形式**嵌入进程，这就是 **librgw**。它不走 HTTP/SigV4，而是提供一套文件式 API（公开头文件 `src/include/rados/rgw_file.h`，实现 `src/rgw/rgw_file.cc`，前端 `src/rgw/rgw_lib_frontend.h`），典型用途是 **NFS-Ganesha** 通过 librgw 把对象存储以 NFS 协议暴露出去。librgw 模式下，请求从文件 API 直接进入 RGW op，后续的 SAL 写对象、桶索引等链路和 HTTP 模式完全一致，只是"入口"和"认证"不同。

## 三、第三站：librados Objecter

RGW 通过 **librados** 与集群通信，核心是 `Objecter`（`src/osdc/Objecter.cc`）。它相当于"RADOS 客户端"：

1. `op_submit`：把一次对象写包装成一个 `Op`；
2. `_op_submit` → `_calc_target`：**用 osdmap 计算目标**——
   - 对象名 + pool → 哈希 → `pgid`；
   - 由 pgid 查 `osdmap` 得到该 PG 的 **primary OSD**；
3. `_send_op`：构造 `MOSDOp` 消息，交给目标 OSD 的连接。

其中 `_calc_target` 里"对象 → PG → OSD"这一步值得展开，它是整条链路最核心的数学：

```mermaid
flowchart LR
    O["对象名 photos/cat.jpg"] --> H["hash_key rjenkins 哈希 32bit"]
    H --> PS["raw hash ps 全精度"]
    PS --> PG["raw_hash_to_pg 按 pg_num 收窄"]
    PG --> PPS["raw_pg_to_pps 生成 placement seed"]
    PPS --> CRUSH["CRUSH do_rule 按 pool 的 rule"]
    CRUSH --> LIST["有序 OSD 列表"]
    LIST --> PRI["primary = 列表第一个"]
```

逐步对应源码：

1. **哈希**：`OSDMap::map_to_pg`（`src/osd/OSDMap.cc` 2710 行）调用 `pool->hash_key(name, nspace)`，本质是 `ceph_str_hash(object_hash, ...)`（`src/osd/osd_types.cc` 1820 行）——对"namespace + 对象名（或 locator key）"做 rjenkins 哈希，得到 32 位 `ps`；
2. **得到 raw PG**：`*pg = pg_t(ps, poolid)`，此时 `ps` 还是全精度；
3. **收窄到实际 PG 号**：`pg_t::raw_hash_to_pg(v)`（`src/osd/osd_types.h` 1961 行）按池的 `pg_num` 把 `ps` 取到实际 PG 号（pg_num 为 2 的幂时即取低 N 位，否则取模）；
4. **生成 placement seed**：`raw_pg_to_pps` 用全精度 ps（并混入 pool id）作为 CRUSH 的输入种子；
5. **CRUSH 选 OSD**：`OSDMap::_pg_to_osds`（`src/osd/OSDMap.cc` 2791 行）执行 `crush->do_rule(rule_id, pps, osds, size, weights, pool)`，按池绑定的 CRUSH rule 在桶（host / rack / ...）里算出**有序**的 OSD 列表；
6. **主 OSD**：列表第一个就是 primary（`_pg_to_up_acting_osds`，3143 行，再结合 up/acting 集合修正）。

为什么这么做：rjenkins 哈希能保证对象在 PG 间**均匀分布**，且同一对象总是算出同一个 PG（可复现）；CRUSH 让**任何节点**都能用同一份 osdmap 独立算出同样的 OSD 列表（去中心化），并通过"故障域规则"把副本分散到不同主机/机架——一台机器挂了副本还在；osdmap 缓存则避免每次写都去问 mon，减少不必要的网络往返。

注意：这里被哈希的"对象名"不是 S3 的 `photos/cat.jpg`，而是 RGW 落到数据池里的 **RADOS 对象名**——RGW 会在前面拼上 bucket marker（`src/rgw/rgw_common.h` 的 `prepend_bucket_marker`：`oid = bucket.marker + "_" + obj.get_oid()`）。所以本实例里真正参与哈希的是 `8f3e2c1d-..._photos/cat.jpg`，它在 pool `default.rgw.buckets.data` 里被算出 PG 和 primary。

举一个具体例子：pool `default.rgw.buckets.data` 有 64 个 PG、副本 3；对象 `8f3e2c1d-..._photos/cat.jpg` 哈希后得到 `ps`，低 6 位（64 个 PG）算出 PG 号，CRUSH 按 rule 算出有序列表 `[osd.12, osd.35, osd.8]`，那么 **primary 就是 osd.12**，副本是 osd.35 和 osd.8。Objecter 把 MOSDOp 发给 osd.12，由它再复制给另外两个。

这里的关键是 **osdmap**：它是"数据往哪个 OSD 走"的唯一依据。Objecter 缓存一份 osdmap，只有缺 map、epoch 落后或 pool 变化时，才通过 `MonClient` 向 **mon** 要最新版（`monc->get_version("osdmap", ...)`）。

```text
生产者：RGW 线程（调用 Objecter::op_submit）
消费者：无（Objecter 不排队，直接算目标后塞进 messenger）
```

## 四、第四站：Messenger

`MOSDOp` 消息进入 **AsyncMessenger**（`src/msg/async/AsyncMessenger.cc`）。它基于事件循环（EventCenter）+ 工作线程：

```text
生产者：Objecter::_send_op → Connection::send_message → 连接上的 out_q（发送队列）
消费者：async worker 线程，把 out_q 里的字节写到 socket
```

对端 OSD 的 messenger 收到字节后，反序列化出 `MOSDOp`，`ms_deliver_*` 把它投递给已注册的 dispatcher——也就是 OSD 自己。

```text
生产者：对端连接的收包线程
消费者：OSD dispatcher（OSD::ms_dispatch / ms_fast_dispatch）
```

## 五、第五站：OSD 的入队与调度

`MOSDOp` 到达 OSD 后（`src/osd/OSD.cc`）：

1. `OSD::ms_fast_dispatch`：对普通 client op 走"快速分发"路径，绕过完整 dispatch；
2. `OSD::enqueue_op(spg_t pg, OpRequestRef&& op, epoch_t epoch)`（约 9920 行）：把 op 按 PG 塞进 **`op_shardedwq`（ShardedOpWQ）**；
3. `ShardedOpWQ` 是按 PG 分片的线程池工作队列，内部用调度器排序：`osd_op_queue` 可选 **mclock_scheduler**（默认）或 **wpq**（加权优先队列），每个 op 有 `OpSchedulerItem::OpQueueable` 和代价 cost；
4. `ShardedOpWQ::_process`（约 11114 行）由 op 工作线程执行，按调度顺序取出 op，投给对应 PG。

为什么这么做：按 PG 分片是为了**并发与隔离**——不同 PG 的操作互不阻塞，而同一个 PG 的操作被串行化、保证顺序；mClock 调度按"预留 / 权重 / 上限"给不同类别（客户端 IO、快照、恢复等）分配资源，避免某类流量把队列挤满、饿死其它。

```text
生产者：OSD 收包 dispatcher（enqueue_op）
队列：op_shardedwq（按 PG 分片，mClock/WPQ 调度）
消费者：OSD op 工作线程（osd_op_num_shards × osd_op_num_threads_per_shard）
```

## 六、第六站：PG 复制与提交

op 进入 PG 后（`src/osd/PrimaryLogPG.cc`）：

1. `PrimaryLogPG::do_request`（1824 行）→ `do_op`（2588 行）：构造 `OpContext`，把写变成对象事务；
2. `issue_repop`（11702 行）：生成 `RepGather` 追踪这次提交，并**把事务复制到副本 OSD**（ReplicatedBackend）；
3. `ReplicatedBackend::submit_transaction`（`src/osd/ReplicatedBackend.cc` 591 行）→ `parent->queue_transactions`（675 行）：调用 `ObjectStore::queue_transactions` 把事务交给本地 objectstore；
4. 副本各自 `queue_transactions` 落盘后回 ack，主 PG 等"自己 + 多数派副本"都提交后，才向客户端返回成功。

为什么这么做："先复制到多数派、再回 ack"是为了**数据冗余**——任何一个副本所在的盘或机器坏了，其它副本还能顶上，这次写才算不丢。

```text
生产者：PrimaryLogPG（issue_repop）
队列：副本之间走 messenger 的 repop 复制；本地走 ObjectStore 的提交队列
消费者：副本 OSD 的 PG / 本地 BlueStore
```

## 七、第七站：BlueStore 落盘

`BlueStore::queue_transactions` 之后就是前面系列文章讲过的过程。这里结合 5MB 的例子，重点看**这 5MB 数据最终被写在磁盘的哪些位置、这个位置是怎么被记住的**：

1. **分配空间**：BlueStore 向分配器（RocksDB 里的 `PREFIX_ALLOC` 空闲空间表）要若干块连续空间，分配粒度是 `bluestore_min_alloc_size`（v21.1.2 里 HDD 和 SSD 默认都是 4KB）。5MB 会被切成若干 extent；
2. **写数据**：每个 extent 通过 `BlockDevice` 的 aio 写到对应盘偏移；
3. **记位置**：BlueStore 给对象建/更新 onode，把"对象逻辑偏移 → extent → blob → 物理 pextent(offset,length)"这条链写进 extent map（见《Ceph 如何实现 extent map》），onode 连同 extent map 编码后作为 `O` 前缀 key 写进 RocksDB；
4. **元数据持久**：RocksDB 先写 WAL（BlueFS 的 `db.wal`）再写 memtable，WAL fsync 后 onode 才算持久；
5. **事务提交**：元数据 + 数据都完成后，事务提交，经 PG 的 commit queue（`store->set_collection_commit_queue` 设置的 `context_queue`）回调完成。

为什么这么做：RocksDB 先写 WAL 是"日志先行"——万一写完数据、还没更新 onode 时崩溃，重启后能靠 WAL 重放恢复；分配器 + extent map 这套"记账"是为了知道盘上哪里空闲、对象数据在哪，这是 BlueStore 区别于"一把梭写满磁盘"的关键。

```mermaid
flowchart LR
    W["5MB 数据"] --> A["分配器 给 extent"]
    A --> D["aio 写盘 offset+length"]
    D --> E["extent map 记录<br/>逻辑偏移→blob→pextent"]
    E --> O["onode 写 RocksDB O 前缀"]
```

所以"写入 object 的位置是如何定位的"答案是两句话：**数据位置由分配器临时给、由 extent map 永久记**——下次读 `photos/cat.jpg` 时，先查 RocksDB 里的 onode 拿到 extent map，再按 map 去盘上把 5MB 拼回来。

```text
生产者：ReplicatedBackend / PG（queue_transactions）
队列：BlueStore kv_sync 队列 + 每 PG 的 context_queue
消费者：BlueStore 的 kv_sync_thread、aio 线程；以及 PG 的 commit 线程
```

## 八、回程：ack 一路返回

落盘完成后，ack 沿原路返回：

```text
BlueStore 完成 → PG commit queue → PrimaryLogPG → OSD → messenger
  → Objecter::handle_osd_op_reply → librados 完成回调 → RGW
```

RGW 收到对象写成功后再完成桶索引更新（如果之前是异步合并），最后向客户端回 **HTTP 200**。

## 九、mon 在整条链路里的角色

mon 不参与数据面，但它是"地图"和"门卫"：

- **osdmap**：Objecter / OSD 都用它做 pgid → primary OSD 的映射；有变化才向 mon 拉取；
- **cephx 认证**：客户端/RGW 和集群之间建立会话时的密钥与票据；
- **集群状态**：monmap、pgmap 等（本文不展开）。

所以一次普通 PUT 通常**不直接打 mon**——Objecter 用缓存 osdmap 直接算目标 OSD；只有 map 落后、pool 不存在或认证票据过期时，才会出现 mon 相关的往返。

## 十、队列全景表：谁在生产，谁在消费

| 位置 | 队列/结构 | 生产者 | 消费者 |
| --- | --- | --- | --- |
| RGW 前端 | Beast 连接 + 请求线程池 | 客户端 TCP / acceptor | RGW 工作线程 |
| Objecter | （无排队，直接投递） | RGW 线程 | —— |
| Messenger 发送侧 | Connection::out_q | Objecter `_send_op` | async worker 写 socket |
| Messenger 接收侧 | 事件循环投递 | 对端连接收包 | OSD dispatcher |
| OSD 入队 | op_shardedwq（mClock/WPQ） | OSD `enqueue_op` | OSD op 工作线程 |
| PG 提交 | repop 复制 + ObjectStore 队列 | PrimaryLogPG `issue_repop` | 副本 PG / BlueStore |
| BlueStore | kv_sync 队列 + aio | ReplicatedBackend | kv_sync_thread / aio 线程 |
| PG 完成 | context_queue | BlueStore 完成回调 | PG commit 处理 |

## 十一、完整时序图

```mermaid
sequenceDiagram
    participant SDK as S3 SDK
    participant FE as RGW 前端 Beast
    participant RG as RGW S3 handler
    participant OB as librados Objecter
    participant MS as Messenger
    participant MON as Monitor
    participant OSD as Primary OSD
    participant PG as PrimaryLogPG
    participant BS as BlueStore
    participant DISK as 磁盘

    SDK->>FE: HTTPS PUT SigV4 签名
    FE->>RG: 请求分发
    RG->>RG: 认证与鉴权
    RG->>OB: SAL write 数据对象
    OB->>OB: 查缓存 osdmap 算 pgid 与 primary
    OB-->>MON: 仅当 map 落后时拉 osdmap
    OB->>MS: _send_op 发 MOSDOp
    MS->>OSD: TCP 投递 MOSDOp
    OSD->>OSD: ms_fast_dispatch enqueue_op
    OSD->>PG: op_shardedwq 调度后投递
    PG->>PG: do_request 构造事务 issue_repop
    PG->>BS: queue_transactions
    BS->>DISK: 元数据写 RocksDB 数据写裸盘
    DISK-->>BS: 完成
    BS-->>PG: commit queue 回调
    PG-->>OSD: ack
    OSD-->>MS: MOSDOpReply
    MS-->>OB: 完成
    OB-->>RG: 写成功
    RG->>RG: 更新桶索引 cls_rgw OMap
    RG-->>FE: 200
    FE-->>SDK: HTTP 200
```

## 十二、总结

一次 S3 PUT 的本质是：**SDK 用 HTTP 把数据交给 RGW，RGW 用 librados 把"数据对象 + 桶索引对象"两份写发给 RADOS，Objecter 靠 osdmap 定位目标 OSD，OSD 用 mClock 队列调度、PG 复制到副本、BlueStore 把元数据写 RocksDB、数据写裸盘，最后 ack 原路返回。** mon 只在"要地图/要票据"时登场，不在数据面上。

理解了这条链路，再去看 RGW 的桶索引瓶颈、Objecter 的 map 抖动、OSD 的 mClock 调优、BlueStore 的 WAL/DB 分层，就都有了坐标系。

## 参考

- 源码：`src/rgw/rgw_asio_frontend.cc`、`src/rgw/rgw_rest_s3.cc`、`src/rgw/driver/rados/rgw_rados.cc`、`src/cls/rgw/cls_rgw.cc`、`src/osdc/Objecter.cc`、`src/msg/async/AsyncMessenger.cc`、`src/osd/OSD.cc`、`src/osd/PrimaryLogPG.cc`、`src/osd/ReplicatedBackend.cc`
- [Ceph 官方文档：RGW](https://docs.ceph.com/en/latest/radosgw/)
- [Ceph 官方文档：OSD 调度 mClock](https://docs.ceph.com/en/latest/rados/configuration/mclock-config-ref/)

*内容依据 Ceph v21.1.2 源码（commit b6f98ed07f4）阅读整理，核对日期：2026 年 10 月 23 日。代码结构可能随版本演进，具体以对应版本源码为准。*
