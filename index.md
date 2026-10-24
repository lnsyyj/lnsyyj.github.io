---
layout: default
title: 首页
description: JiangYu 的个人博客，记录 Linux、开发学习与日常思考，并提供免费的 JSON、YAML、XML 在线格式化和转换工具。
---

<section class="home-grid" id="top">

  <div>
    <h1>写下正在搞懂的事，顺手做点能用的工具。</h1>
    <p class="home-lede">Ceph 源码笔记、CentOS 部署步骤、几段踩坑记录；以及一组不用登录、不上传数据的小工具。</p>

    <div class="block-label">
      <h2>最近写的</h2>
      <a href="{{ '/posts/' | relative_url }}">全部 {{ site.posts.size }} 篇 →</a>
    </div>
    <ol class="entries">
      {% for post in site.posts limit: 5 %}
      <li>
        <a href="{{ post.url | relative_url }}">
          <time>{{ post.date | date: '%m.%d' }}</time>
          <span>
            <strong>{{ post.title }}</strong>
            {% if post.description %}<em>{{ post.description | strip | truncate: 44 }}</em>{% endif %}
          </span>
        </a>
      </li>
      {% endfor %}
    </ol>
  </div>

  <div>
    <div class="block-label">
      <h2>工具</h2>
      <a href="{{ '/tools/' | relative_url }}">全部 9 个 →</a>
    </div>
    <ul class="tool-list">
      <li><a href="{{ '/tools/json-formatter/' | relative_url }}"><span>JSON</span>格式互转<small>JSON / YAML / XML</small></a></li>
      <li><a href="{{ '/tools/byte-converter/' | relative_url }}"><span>BYTE</span>字节换算<small>1024 或 1000</small></a></li>
      <li><a href="{{ '/tools/world-clock/' | relative_url }}"><span>TIME</span>世界时钟<small>含夏令时</small></a></li>
      <li><a href="{{ '/tools/china-postcode/' | relative_url }}"><span>ZIP</span>邮编查询<small>中国与欧美</small></a></li>
      <li><a href="{{ '/tools/lottery/' | relative_url }}"><span>DRAW</span>公平抽奖<small>无放回抽取</small></a></li>
    </ul>

    <p class="aside-note">
      我是 JiangYu，做基础设施方向的工作。文章里涉及版本的地方都标了核对日期，命令尽量做到能直接复制就跑。
      <br>
      <a href="{{ '/about/' | relative_url }}">关于这个站点</a> ·
      <a href="{{ '/contact/' | relative_url }}">纠错与联系方式</a>
    </p>
  </div>

</section>
