---
layout: post
title: CentOS Stream 9 使用 Milvus：建库、建表与向量检索（对比关系型数据库）
description: 用 pymilvus 的 MilvusClient 在 Milvus 中创建数据库、集合（表）与字段，插入数据、结构化查询、向量检索、读取和删除，并逐项对比关系型数据库的概念差异。
date: 2026-10-12 00:00:00 +0800
tags: [CentOS Stream 9, Milvus, pymilvus, 向量数据库, 数据库]
---

本文介绍如何在 **CentOS Stream 9** 上实际使用 **Milvus**：创建数据库、创建集合（相当于"表"）、定义字段、插入数据、做结构化查询和向量检索，最后删除数据。全文用 `pymilvus` 的 `MilvusClient` 客户端演示，并和关系型数据库（以 PostgreSQL 为代表）逐项对照，帮你把已有的 SQL 经验迁移过来。

> 前提：已经按上一篇《CentOS Stream 9 安装 Milvus 向量数据库》把 Milvus 跑起来（默认监听 `127.0.0.1:19530`），并已安装 `pymilvus`。示例向量用 2560 维，和《安装 Ollama 并运行 qwen3-embedding:4b》里模型的输出维度一致；实际使用时把随机向量替换成模型生成的向量即可。

## 一、先把概念对上号

Milvus 的概念和关系型数据库大体能一一对应，但也有几个是 SQL 里没有的：

| 关系型数据库（PostgreSQL） | Milvus | 说明 |
| --- | --- | --- |
| Database | Database | 顶层命名空间，里面放多个集合 |
| Schema | 无独立层级 | Milvus 的 database 之下直接就是集合 |
| Table 表 | Collection 集合 | 相当于一张表 |
| Column 列 | Field 字段 | 每个字段有类型、长度等约束 |
| Row 行 | Entity 实体 | 一条记录 |
| 主键 Primary Key | 主键字段 | 必填，类型只能是 `INT64` 或 `VARCHAR` |
| 普通索引（B-tree） | 向量索引（HNSW/IVF/FLAT） | 为向量字段建索引 |
| `SELECT ... WHERE` | `query`（标量过滤） | 按字段值过滤，类似 SQL |
| `ORDER BY 某列` | `search`（向量相似度） | 按"相似度"排序，SQL 无对应 |
| `JOIN` / 外键 / 事务 | 不支持 | Milvus 面向向量检索，不是通用 OLTP |
| 精确等值/范围查询 | 支持 | 用过滤表达式实现 |
| 相似度（余弦/内积/L2） | `metric_type` | Milvus 独有的概念 |

一句话：Milvus 不替代关系型数据库。业务数据（订单、用户、文章内容）照旧放 PostgreSQL，把"语义向量"放进 Milvus 做相似度检索，两边用同一个主键（比如文章 id）关联起来。

## 二、连接 Milvus

```python
from pymilvus import MilvusClient

client = MilvusClient(uri="http://localhost:19530", db_name="default")
print(client.list_databases())
```

`MilvusClient(uri=...)` 创建客户端，指向本机 19530 端口；`db_name="default"` 指定要操作的数据库，`default` 是 Milvus 自带的默认库。`client.list_databases()` 列出所有数据库，首次会看到 `['default']`。这一步相当于 SQL 里连上数据库服务器并 `SHOW DATABASES`。

## 三、创建数据库（database）

```python
client.create_database(db_name="my_blog")
print(client.list_databases())

client.using_database("my_blog")
```

`create_database(db_name=...)` 创建一个名为 `my_blog` 的数据库，对应 SQL 的 `CREATE DATABASE my_blog`。`using_database("my_blog")` 把当前客户端的默认库切到 `my_blog`，对应 SQL 的 `USE my_blog`——之后的集合操作都作用在这个库里。Milvus 的 database 只是集合的命名空间，下面没有 PostgreSQL 那样的 schema 层级。

> 提示：如果你的 Milvus 版本较老（2.3 及以前）不支持多数据库，可以跳过本节，直接在默认库 `default` 里建集合。

## 四、创建集合（collection / 表）

关系型数据库建表要先定列，Milvus 建集合也是先定义 schema（字段结构）：

```python
from pymilvus import DataType

schema = client.create_schema(auto_id=True, enable_dynamic_field=True)

schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True)
schema.add_field(field_name="title", datatype=DataType.VARCHAR, max_length=512)
schema.add_field(field_name="category", datatype=DataType.VARCHAR, max_length=64)
schema.add_field(field_name="body", datatype=DataType.VARCHAR, max_length=4096)
schema.add_field(field_name="embedding", datatype=DataType.FLOAT_VECTOR, dim=2560)
```

逐行解释：

- `create_schema(auto_id=True, ...)` 创建一个 schema 对象。`auto_id=True` 表示主键由 Milvus 自动生成（相当于自增主键），插入数据时不用自己提供 `id`。
- `enable_dynamic_field=True` 允许之后动态写入 schema 里没定义的额外字段（类似"宽松模式"），方便临时加字段，但规范起见正式字段还是提前定义。
- `add_field(field_name=..., datatype=..., ...)` 定义每个字段。`is_primary=True` 标记主键；`max_length` 给 `VARCHAR` 指定最大长度；`dim=2560` 给 `FLOAT_VECTOR` 指定向量维度。
- `DataType.INT64` 是 64 位整数，`DataType.VARCHAR` 是变长字符串，`DataType.FLOAT_VECTOR` 是浮点向量——这几种是 Milvus 最常用的字段类型。

这相当于 SQL 里的：

```sql
CREATE TABLE articles (
    id        BIGINT PRIMARY KEY,
    title     VARCHAR(512),
    category  VARCHAR(64),
    body      VARCHAR(4096),
    embedding FLOAT_VECTOR(2560)
);
```

定义完字段后，为向量字段建索引，再真正创建集合：

```python
index_params = client.prepare_index_params()
index_params.add_index(
    field_name="embedding",
    index_type="HNSW",
    metric_type="COSINE",
    params={"M": 16, "efConstruction": 200},
)

client.create_collection(
    collection_name="articles",
    schema=schema,
    index_params=index_params,
)

print(client.describe_collection("articles"))
```

`prepare_index_params()` 准备索引配置；`add_index(...)` 给 `embedding` 字段加一个 `HNSW` 类型、`COSINE` 度量的向量索引；`create_collection` 用 schema 和索引配置正式建集合（对应 `CREATE TABLE`）；`describe_collection` 查看集合结构和索引信息（类似 `\d articles`）。

## 五、索引与相似度度量

这是 Milvus 和 SQL 最大的区别：SQL 索引是为了加速"精确匹配/排序"，而 Milvus 的向量索引是为了加速"近似最近邻（ANN）"检索，它不保证绝对精确，而是在速度和精度之间权衡。

常用的 `metric_type`（度量方式，决定"像不像"怎么算）：

| 度量 | 含义 | 值怎么理解 |
| --- | --- | --- |
| `COSINE` | 余弦相似度 | 值在 `[-1, 1]`，越接近 1 越相似；文本向量常用 |
| `IP` | 内积 | 越大越相似；向量归一化后等价于余弦 |
| `L2` | 欧氏距离 | 值越小越相似，0 表示完全相同 |

常用的 `index_type`（索引类型）：

| 索引 | 特点 |
| --- | --- |
| `FLAT` | 暴力全量比对，最精确但最慢，适合小数据量 |
| `IVF_FLAT` | 先聚类分桶再在桶内暴力，内存省、速度快，精度略降 |
| `HNSW` | 基于图，查询快、召回高，内存占用较大 |
| `AUTOINDEX` | 让 Milvus 自动选择，省心 |

示例里的 `params={"M": 16, "efConstruction": 200}` 是 HNSW 的构建参数：`M` 是图中每个节点的连接数，越大召回越高但内存越大；`efConstruction` 是构建时搜索宽度，越大索引质量越高但构建越慢。这两个都属于"按需调优"，入门直接用示例值即可。

## 六、插入数据（insert / upsert）

```python
import random

def rand_vec():
    return [random.random() for _ in range(2560)]

base = rand_vec()

rows = [
    {
        "title": "Milvus 入门",
        "category": "教程",
        "body": "介绍如何在 CentOS Stream 9 上安装和使用 Milvus。",
        "embedding": [v + random.uniform(-0.02, 0.02) for v in base],
    },
    {
        "title": "Ollama 向量模型",
        "category": "教程",
        "body": "使用 qwen3-embedding:4b 生成 2560 维文本向量。",
        "embedding": [v + random.uniform(-0.02, 0.02) for v in base],
    },
    {
        "title": "关系型数据库对比",
        "category": "笔记",
        "body": "Milvus 与 PostgreSQL 的概念对照。",
        "embedding": rand_vec(),
    },
]

res = client.insert(collection_name="articles", data=rows)
print(res)
```

`client.insert(collection_name=..., data=...)` 插入一批数据，`data` 是一个字典列表，每个字典是一条记录，键名要和你定义的字段名一致。因为建表时开了 `auto_id=True`，这里没有提供 `id`，由 Milvus 自动生成；返回结果里能看到插入条数和生成的主键列表。

这里前两条的 `embedding` 是用同一个 `base` 向量加少量噪声生成的，第三条是随机向量，目的是让后面检索时前两条彼此更"相似"。**实际项目里，`embedding` 应该用模型对 `body` 文本生成的向量**（例如 qwen3-embedding:4b 的输出），而不是随机数——随机数只是为了让示例跑起来。

对应 SQL 的 `INSERT INTO articles (title, category, body, embedding) VALUES (...)`。如果要"存在就覆盖、不存在就插入"，用 `client.upsert(...)`（参数和 `insert` 相同），对应 SQL 的 `ON DUPLICATE KEY UPDATE` / `ON CONFLICT DO UPDATE`；普通 `insert` 遇到重复主键会报错。

## 七、结构化查询（query + filter）

Milvus 的 `query` 相当于"按字段值过滤"的 `SELECT ... WHERE`：

```python
result = client.query(
    collection_name="articles",
    filter="category == '教程'",
    output_fields=["id", "title", "category"],
    limit=10,
)
for row in result:
    print(row)
```

`filter` 是过滤表达式，语法和 SQL 的 `WHERE` 很像，支持 `==`、`!=`、`>`、`<`、`>=`、`<=`、`in`、`like`、`and`、`or`、`not` 等。例如 `filter="category == '教程'"` 对应 `WHERE category = '教程'`；`filter="id in [1,2,3] and title like 'Milvus%'"` 对应 `WHERE id IN (1,2,3) AND title LIKE 'Milvus%'`。`output_fields` 指定要返回哪些字段（向量字段体积大，默认不返回，需要时才列出来）；`limit` 限制返回条数。

这等价于：

```sql
SELECT id, title, category FROM articles WHERE category = '教程' LIMIT 10;
```

## 八、向量检索（search）

`search` 是 Milvus 的核心能力，SQL 没有直接对应物——它不是按某列值排序，而是按"向量之间的距离"排序：

```python
query_vec = base  # 用第一条文档的向量作为查询

results = client.search(
    collection_name="articles",
    data=[query_vec],
    limit=3,
    output_fields=["title", "category"],
    search_params={"metric_type": "COSINE", "params": {"ef": 64}},
)

for hits in results:
    for h in hits:
        print(h["id"], h["distance"], h["entity"]["title"])
```

解释：

- `data=[query_vec]` 是一个"查询向量列表"，可以一次传多个查询向量，每个查询向量各返回一组结果。
- `limit=3` 表示每个查询返回最相似的 3 条，类似 SQL 的 `LIMIT 3`，但排序依据是相似度。
- `output_fields` 指定每条命中记录附带返回哪些标量字段。
- `search_params` 里 `metric_type` 要和建索引时一致，`ef` 是 HNSW 的查询参数，越大召回越高、越慢（构建时的 `efConstruction` 管建索引，查询时的 `ef` 管搜索）。
- 结果里 `h["distance"]` 是距离/相似度：`COSINE` 度量下越接近 1 越相似；`h["entity"]` 是命中的标量字段。

如果用 SQL 打比方，可以想象成：`SELECT * FROM articles ORDER BY 与查询向量相似度 DESC LIMIT 3`，只是这个"相似度"是向量计算出来的，SQL 本身表达不了。这也正是语义搜索的关键——你甚至可以用一条意思相近但用词完全不同的句子，命中另一条相关文档。

## 九、读取与删除（get / delete）

按主键精确读取，相当于 `SELECT ... WHERE id = ...`：

```python
res = client.query(
    collection_name="articles",
    filter="title == 'Milvus 入门'",
    output_fields=["id"],
)
aid = res[0]["id"]

got = client.get(collection_name="articles", ids=[aid], output_fields=["title", "body"])
print(got)
```

`client.get(ids=[...])` 按主键批量读取，比 `query` 更快，适合"已知主键拿记录"的场景。

删除数据：

```python
client.delete(collection_name="articles", ids=[aid])
```

`delete` 可以按主键 `ids=[...]` 删除，也可以按条件 `filter="category == '笔记'"` 删除，对应 SQL 的 `DELETE FROM articles WHERE id = ...`。删除后数据会先从可查询结果里移除，物理清理由后台完成。

## 十、删除集合与数据库

```python
client.drop_collection(collection_name="articles")
client.drop_database(db_name="my_blog")
```

`drop_collection` 删除集合（对应 `DROP TABLE`），`drop_database` 删除数据库（对应 `DROP DATABASE`）。两者都会把数据永久删掉，**执行前确认已备份**。删库前通常需要先删掉其中的集合，或先 `using_database("default")` 切走再删。

## 十一、与关系型数据库的核心差异总结

| 维度 | 关系型数据库 | Milvus |
| --- | --- | --- |
| 主要目的 | 精确读写业务数据 | 按相似度检索向量 |
| 数据模型 | 表 + 行 + 列 | 集合 + 实体 + 字段（含向量字段） |
| 查询方式 | SQL（精确过滤、JOIN、聚合） | 标量过滤 + 向量 ANN 检索 |
| 排序 | 按列值排序 | 按向量距离排序 |
| 事务/外键/JOIN | 支持 | 不支持 |
| 全文/语义搜索 | 依赖额外引擎 | 原生向量语义检索 |
| 扩展方式 | 分库分表、读写分离 | 单机 standalone 或集群（K8s） |

所以实际项目常见做法是"双库配合"：PostgreSQL 存文章正文和业务字段，Milvus 存文章的向量和主键；用户提问时，先用向量模型把问题转成向量，在 Milvus 里搜出最相关的几个主键，再回 PostgreSQL 拿全文，最后交给大模型组织回答。

## 十二、常见问题

### 集合建好后还能改字段吗

Milvus 集合的 schema 基本不可变更（不能随意增删字段或改维度）。规划阶段就要定好字段和向量维度；临时字段可以用 `enable_dynamic_field=True` 动态写入，或新建集合迁移数据。

### 向量维度对不上报错

写入的向量维度必须和集合定义一致。本文示例是 2560 维，对应 `qwen3-embedding:4b`；如果换模型或尺寸，先 `ollama show 模型名` 确认 `embedding length`，再按它建集合。

### `search` 结果的距离看不懂

取决于 `metric_type`：`COSINE` 越接近 1 越相似；`IP` 越大越相似；`L2` 越小越相似。注意 `metric_type` 在索引、查询两端要一致。

### filter 表达式报错

检查字符串值是否用单引号包裹、字段名是否写对、运算符是否支持。复杂条件用 `and` / `or` 组合，并用小括号明确优先级。

### 集合已经删了但磁盘没释放

Milvus 的删除是异步物理清理的，空间会延迟释放，属正常现象。需要立即回收可查官方文档的压缩/回收说明。

## 官方文档

- [Milvus 核心概念：集合、字段、索引](https://milvus.io/docs/glossary.md)
- [pymilvus MilvusClient 参考](https://milvus.io/docs/manage_databases.md)
- [Milvus 过滤表达式语法](https://milvus.io/docs/boolean.md)
- [Milvus 索引与度量类型](https://milvus.io/docs/metric.md)
- [Milvus 快速开始](https://milvus.io/docs/quickstart.md)

*命令和代码依据 pymilvus 与 Milvus v3.x 官方文档整理，核对日期：2026 年 10 月 12 日。客户端 API 和默认行为可能随版本变化，具体以官方文档为准。*
