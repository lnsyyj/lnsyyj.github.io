---
layout: default
title: 首页
description: JiangYu 的个人博客，记录 Linux、开发学习与日常思考，并提供免费的 JSON、YAML、XML 在线格式化和转换工具。
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
      <a class="home-tool" href="{{ '/tools/life-countdown/' | relative_url }}" target="_blank" rel="noopener noreferrer"><span>LIFE</span><div><strong data-i18n="lifeName">人生倒计时</strong><small data-i18n="lifeCard">实时生命时长与生日提醒</small></div><b>→</b></a>
      <a class="home-tool" href="{{ '/tools/china-postcode/' | relative_url }}" target="_blank" rel="noopener noreferrer"><span>ZIP</span><div><strong data-i18n="globalPostcodeName">全球邮编查询</strong><small data-i18n="globalPostcodeCard">中国本地浏览与国际邮编查询</small></div><b>→</b></a>
      <a class="home-tool" href="{{ '/tools/lottery/' | relative_url }}" target="_blank" rel="noopener noreferrer"><span>DRAW</span><div><strong data-i18n="lotteryName">公平抽奖系统</strong><small data-i18n="lotteryCard">安全随机抽取、动画展示与结果下载</small></div><b>→</b></a>
      <a class="home-tool" href="{{ '/tools/byte-converter/' | relative_url }}" target="_blank" rel="noopener noreferrer"><span>BYTE</span><div><strong data-i18n="byteName">字节转换</strong><small data-i18n="byteCard">常见存储单位实时换算</small></div><b>→</b></a>
      <a class="home-tool" href="{{ '/tools/world-clock/' | relative_url }}" target="_blank" rel="noopener noreferrer"><span>TIME</span><div><strong data-i18n="clockName">世界时钟</strong><small data-i18n="clockCard">选择全球地点并实时查看时间</small></div><b>→</b></a>
      <a class="home-tool" href="{{ '/tools/global-sites/' | relative_url }}" target="_blank" rel="noopener noreferrer"><span>WEB</span><div><strong data-i18n="globalSitesName">全球网站汇总</strong><small data-i18n="globalSitesCard">按国家、分类与公司发现知名网站</small></div><b>→</b></a>
    </section>
    <section class="home-panel shop-panel">
      <div class="panel-heading"><h2>网店</h2><a href="https://shop64575492.taobao.com/category.htm?spm=pc_detail.30350276.shop_block.dshopinfo.6dc971fdRBQYOB" target="_blank" rel="noopener noreferrer">进入网店 →</a></div>
      <a class="home-tool" href="https://shop64575492.taobao.com/category.htm?spm=pc_detail.30350276.shop_block.dshopinfo.6dc971fdRBQYOB" target="_blank" rel="noopener noreferrer"><span>SHOP</span><div><strong>精选好物</strong><small>商品正在陆续上架</small></div><b>→</b></a>
    </section>
  </div>
</section>
