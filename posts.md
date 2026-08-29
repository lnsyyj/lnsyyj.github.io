---
layout: default
title: 文章
permalink: /posts/
---

<section class="page-intro" id="top">
  <p class="eyebrow">ALL NOTES</p><h1>留下的<br><em>思考痕迹。</em></h1>
</section>
<section class="section">
  <div class="post-list post-list-all">
  {% for post in site.posts %}
    <a class="post-card" href="{{ post.url | relative_url }}"><p>{{ post.date | date: '%Y.%m.%d' }}</p><h3>{{ post.title }}</h3><span>阅读全文 →</span></a>
  {% else %}
    <div class="empty-state"><span>✦</span><p>第一篇文章正在路上。</p></div>
  {% endfor %}
  </div>
</section>
