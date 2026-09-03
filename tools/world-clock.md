---
layout: default
title: 世界时钟
description: 免费在线世界时钟，选择国家和城市并添加到个人仪表盘，实时查看全球各地时间。
permalink: /tools/world-clock/
---

<section class="tool-page world-clock-page" id="top" data-world-clock>
  <p class="eyebrow">TOOL / 07</p>
  <h1 data-i18n="clockTitle">世界 <em>时钟</em></h1>
  <p class="tool-lead" data-i18n="clockLead">选择国家或代表城市，添加到你的个人仪表盘，实时查看各地时间。</p>
  <div class="world-clock-tool">
    <div class="clock-picker"><label><span data-i18n="clockSearch">搜索国家或城市</span><input type="search" data-clock-search data-i18n="clockSearchPlaceholder" data-i18n-attr="placeholder" placeholder="例如：中国、东京、New York"></label><label><span data-i18n="clockSelect">选择地点</span><select data-clock-select></select></label><button class="button button-primary" type="button" data-clock-add data-i18n="clockAdd">添加到仪表盘</button></div>
    <p class="clock-local" data-i18n="clockLocal">时间基于浏览器内置时区数据计算，不会上传你的选择。</p>
    <div class="clock-board" data-clock-board aria-live="polite"></div>
    <p class="clock-empty" data-clock-empty data-i18n="clockEmpty">还没有时钟。从上方选择一个国家或城市添加吧。</p>
  </div>
  <div class="tool-notes"><div><span>01</span><h2 data-i18n="clockInfo1Title">实时更新</h2><p data-i18n="clockInfo1Text">仪表盘每秒更新一次，并自动处理各地夏令时。</p></div><div><span>02</span><h2 data-i18n="clockInfo2Title">代表城市</h2><p data-i18n="clockInfo2Text">跨多个时区的国家会提供不同代表城市，例如美国和澳大利亚。</p></div><div><span>03</span><h2 data-i18n="clockInfo3Title">保留你的选择</h2><p data-i18n="clockInfo3Text">添加的时钟只保存在当前浏览器，刷新页面后仍会显示。</p></div></div>
</section>
<script src="{{ '/assets/js/world-clock-data.js' | relative_url }}?v=20260904-1"></script>
<script src="{{ '/assets/js/world-clock.js' | relative_url }}?v=20260904-1"></script>
