---
layout: default
title: 首页
---

<section class="home-overview" id="top">
  <div class="intro-inline">
    <p class="eyebrow" data-i18n="homeEyebrow">JIANGYU'S SPACE</p>
    <h1 data-i18n="homeTitle">把灵感、代码与 <em>日常思考</em>放在一起。</h1>
    <p data-i18n="homeIntro">这是我的个人角落。记录正在学习的事，也分享一些让生活更顺手的小工具。</p>
  </div>
  <div class="home-highlights">
    <section class="home-panel">
      <div class="panel-heading"><h2 data-i18n="latestPosts">最新文章</h2><a href="{{ '/posts/' | relative_url }}" target="_blank" rel="noopener noreferrer" data-i18n="all">全部 →</a></div>
      {% if site.posts.size > 0 %}
        {% for post in site.posts limit: 2 %}<a class="home-post" href="{{ post.url | relative_url }}" target="_blank" rel="noopener noreferrer"><span>{{ post.date | date: '%Y.%m.%d' }}</span><strong>{{ post.title }}</strong><b>→</b></a>{% endfor %}
      {% else %}<p class="muted">文章正在酝酿中。</p>{% endif %}
    </section>
    <section class="home-panel tools-panel">
      <div class="panel-heading"><h2 data-i18n="toolbox">小工具</h2><a href="{{ '/tools/' | relative_url }}" target="_blank" rel="noopener noreferrer" data-i18n="all">全部 →</a></div>
      <a class="home-tool" href="{{ '/tools/json-formatter/' | relative_url }}" target="_blank" rel="noopener noreferrer"><span>{ }</span><div><strong data-i18n="jsonName">JSON 格式化</strong><small data-i18n="jsonDesc">格式化、校验与压缩</small></div><b>→</b></a>
      <a class="home-tool" href="{{ '/tools/yaml-formatter/' | relative_url }}" target="_blank" rel="noopener noreferrer"><span>YML</span><div><strong data-i18n="yamlName">YAML 格式化</strong><small data-i18n="yamlDesc">格式化、校验与转为 JSON</small></div><b>→</b></a>
    </section>
    <section class="home-panel shop-panel">
      <div class="panel-heading"><h2>网店</h2><a href="https://shop64575492.taobao.com/category.htm?spm=pc_detail.30350276.shop_block.dshopinfo.6dc971fdRBQYOB" target="_blank" rel="noopener noreferrer">进入网店 →</a></div>
      <a class="home-tool" href="https://shop64575492.taobao.com/category.htm?spm=pc_detail.30350276.shop_block.dshopinfo.6dc971fdRBQYOB" target="_blank" rel="noopener noreferrer"><span>SHOP</span><div><strong>精选好物</strong><small>商品正在陆续上架</small></div><b>→</b></a>
    </section>
  </div>
</section>
