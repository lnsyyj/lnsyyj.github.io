---
layout: default
title: 中国邮编查询
description: 免费中国邮编查询工具，支持按省、市、区县地名或邮政编码本地查询。
permalink: /tools/china-postcode/
---

<section class="tool-page postcode-page" id="top" data-postcode-tool>
  <p class="eyebrow">TOOL / 04</p>
  <h1 data-i18n="postcodeTitle">中国 <em>邮编查询</em></h1>
  <p class="tool-lead" data-i18n="postcodeLead">输入省、市、区县名称或邮政编码，快速找到对应信息。查询完全在本地完成。</p>

  <div class="postcode-tool">
    <form class="postcode-search" data-postcode-form>
      <label class="sr-only" for="postcode-query" data-i18n="postcodeLabel">地名或邮政编码</label>
      <input id="postcode-query" data-postcode-input type="search" autocomplete="off" data-i18n="postcodePlaceholder" data-i18n-attr="placeholder" placeholder="例如：北京、海淀区、100089" required>
      <button class="button button-primary" type="submit" data-i18n="postcodeSearch">查询</button>
    </form>
    <p class="postcode-tip" data-i18n="postcodeTip">支持省、市、区县名称或至少 3 位邮政编码。</p>
    <p class="postcode-status" data-postcode-status aria-live="polite"></p>
    <div class="postcode-results" data-postcode-results></div>
  </div>

  <div class="tool-notes">
    <div><span>01</span><h2 data-i18n="postcodeLocalTitle">本地查询</h2><p data-i18n="postcodeLocalText">数据随页面加载，不会发送你的搜索内容。</p></div>
    <div><span>02</span><h2 data-i18n="postcodeSearchTitle">双向检索</h2><p data-i18n="postcodeSearchText">既可以按地名找邮编，也可以用邮编反查地区。</p></div>
    <div><span>03</span><h2 data-i18n="postcodeDataTitle">使用提示</h2><p data-i18n="postcodeDataText">行政区划与邮编可能调整，寄件前请以邮政网点信息为准。</p></div>
  </div>
</section>
<script src="{{ '/assets/data/china-postcodes.js' | relative_url }}?v=20260902-1"></script>
<script src="{{ '/assets/js/china-postcode.js' | relative_url }}?v=20260902-1"></script>
