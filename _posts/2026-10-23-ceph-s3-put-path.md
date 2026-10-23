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

### 1.1 SDK 侧：怎么算出这个签名

SigV4 的套路是"把请求规范成一串固定文本，再对它做 HMAC"。SDK 分四步：

1. **规范化请求（CanonicalRequest）**：把请求压成固定文本——HTTP 方法、规范化 URI、规范化 Query、`SignedHeaders` 里列出的那些 Header、签名的 Header 名列表，最后是 body 的 sha256（十六进制）；
2. **待签字符串（StringToSign）**：`"AWS4-HMAC-SHA256" + 时间戳 + credential scope + hex(sha256(CanonicalRequest))`；
3. **派生签名密钥（SigningKey）**：用 secret key 按日期/区域/服务逐级 HMAC——`HMAC("AWS4"+secret, date)` → `HMAC(..., region)` → `HMAC(..., service)` → `HMAC(..., "aws4_request")`；
4. **签名**：`Signature = hex(HMAC(SigningKey, StringToSign))`，写进 `Authorization` 头：

```text
Authorization: AWS4-HMAC-SHA256 Credential=AKID/20261023/us-east-1/s3/aws4_request,
  SignedHeaders=host;x-amz-date, Signature=...
```

### 1.2 RGW 侧：怎么验证

RGW 的验证在 `src/rgw/rgw_auth_s3.cc`：

1. **解析**：`parse_v4_auth_header`（425 行附近）把 `Authorization` 拆成 `Credential` / `SignedHeaders` / `Signature` 三件套；
2. **校验 credential scope**：`Credential` 必须是 `access_key/YYYYMMDD/region/service/aws4_request` 四段、以 `aws4_request` 结尾（571–609 行），拆出 access key id 和 scope；
3. **找 secret**：用 access key id 查出该用户的 secret key；
4. **重算**：RGW 按同样规则重建 CanonicalRequest 和 StringToSign，用 `get_v4_signing_key`（1012 行；先 `transform_secret_key` 在 secret 前拼上 `AWS4`，987 行，再逐级 HMAC）算出 SigningKey，`get_v4_signature`（1053 行）算出期望签名；
5. **比对**：把算出的签名和请求里的 `Signature` 比较（常量时间比较防时序攻击），同时校验 `x-amz-date` 在允许的时间窗内（防重放）。

因为签名覆盖了请求内容，任何人改一个字节（方法、路径、Header、body）都会让重算出的签名对不上，所以 SigV4 同时做到了"你是谁"和"请求没被改"。

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
