---
layout: post
title: 
description: 
date: 2026-08-31 22:45:00 +0800
tags: [Linux, ceph, shaman]
---

项目地址： https://github.com/ceph/

A REST API that serves as the source of truth for the state of repositories on chacra nodes. It can be queried to get information on what branches and sha1's are built and available for ceph.
这是一个 REST API，作为 Chacra 节点上仓库状态的权威数据源。可以通过查询该 API 获取有关 Ceph 已构建和可用的分支及 SHA1 值的信息。

It also acts as an orchestration service for a pool of chacra nodes, allowing for horizontal scalability.
它还充当一组 chacra 节点的编排服务，从而实现水平扩展。

### 入口文件
这个项目的“应用入口”不是一个标准的 main.py，而是基于 Pecan 的配置入口：
```shell
应用配置在 dev.py             # 
网页/接口入口控制器在 root.py  # 定义了 RootController，并挂载了 API、repos、nodes、search 等路由

```

### 如何启动
```shell
# 安装依赖
pip install -r requirements.txt

# 运行 Pecan 服务
pecan serve config/dev.py

# 访问地址
http://localhost:8080

```

### 部署方式
1) 本地开发部署
用 dev.py 启动，适合开发和调试。

2) Docker / OpenShift 部署
项目提供了专门的镜像文件 Dockerfile.ocp 和启动脚本 entrypoint.sh。



