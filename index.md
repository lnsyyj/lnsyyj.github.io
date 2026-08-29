---
layout: default
title: 首页
---

<section class="hero" id="top">
  <p class="eyebrow">HELLO, I'M LIN</p>
  <h1>把灵感、代码与<br><em>日常思考</em>放在一起。</h1>
  <p class="hero-copy">这是我的个人角落。记录正在学习的事，也分享一些让生活更顺手的小工具。</p>
  <div class="hero-actions">
    <a class="button button-primary" href="{{ '/tools/' | relative_url }}">探索工具箱 <span>↗</span></a>
    <a class="text-link" href="#notes">阅读近况 ↓</a>
  </div>
</section>

<section class="section" id="notes">
  <div class="section-heading">
    <div><p class="eyebrow">LATEST NOTES</p><h2>最新文章</h2></div>
    <a class="text-link" href="{{ '/posts/' | relative_url }}">查看全部 →</a>
  </div>
  {% if site.posts.size > 0 %}
  <div class="post-list">
    {% for post in site.posts limit: 3 %}
    <a class="post-card" href="{{ post.url | relative_url }}">
      <p>{{ post.date | date: '%Y.%m.%d' }}</p><h3>{{ post.title }}</h3>
      <span>阅读全文 →</span>
    </a>
    {% endfor %}
  </div>
  {% else %}
  <div class="empty-state"><span>✦</span><p>文章正在酝酿中。这里很快会长出新的想法。</p></div>
  {% endif %}
</section>

<section class="tool-feature">
  <div><p class="eyebrow">TINY, USEFUL THINGS</p><h2>小工具，<br>解决小麻烦。</h2></div>
  <div class="tool-feature-copy"><p>无需注册，没有追踪。每一个工具都只做一件事，并把它做好。</p><a class="tool-spotlight" href="{{ '/tools/json-formatter/' | relative_url }}"><span class="tool-icon">{ }</span><span><strong>JSON 格式化</strong><small>格式化、校验与压缩 JSON</small></span><b>→</b></a></div>
</section>
