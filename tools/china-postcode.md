---
layout: default
title: 全球邮编查询
description: 免费全球邮编查询工具，支持中国本地浏览与美国、欧洲邮编查询。
permalink: /tools/china-postcode/
---

<section class="tool-page postcode-page" id="top" data-postcode-tool>
  <p class="eyebrow">TOOL / 04</p>
  <h1 data-i18n="globalPostcodeTitle">全球 <em>邮编查询</em></h1>
  <p class="tool-lead" data-i18n="globalPostcodeLead">查询中国、美国及欧洲国家的邮政编码与地区信息。</p>

  <div class="postcode-tool">
    <form class="postcode-search" data-postcode-form>
      <label class="sr-only" for="postcode-query" data-i18n="postcodeLabel">地名或邮政编码</label>
      <input id="postcode-query" data-postcode-input type="search" autocomplete="off" data-i18n="postcodePlaceholder" data-i18n-attr="placeholder" placeholder="例如：北京、海淀区、100089" required>
      <button class="button button-primary" type="submit" data-i18n="postcodeSearch">查询</button>
    </form>
    <p class="postcode-tip" data-i18n="postcodeTip">支持省、市、区县名称或至少 3 位邮政编码。</p>
    <p class="postcode-status" data-postcode-status aria-live="polite"></p>
    <div class="postcode-browser">
      <section><h2 data-i18n="postcodeProvince">中国：选择省份</h2><div class="postcode-tabs" data-postcode-provinces></div></section>
      <section><h2 data-i18n="postcodeCity">中国：选择城市</h2><div class="postcode-tabs postcode-city-tabs" data-postcode-cities></div></section>
    </div>
    <div class="postcode-results" data-postcode-results></div>

    <section class="international-postcode">
      <div><h2 data-i18n="internationalPostcodeTitle">美国与欧洲邮编查询</h2><p data-i18n="internationalPostcodeLead">选择国家并输入完整邮编，查询对应城市、州或地区。</p></div>
      <form class="postcode-search international-search" data-international-form>
        <label class="sr-only" for="international-country" data-i18n="internationalCountry">国家或地区</label><select id="international-country" data-international-country></select>
        <label class="sr-only" for="international-query" data-i18n="internationalPostcode">邮政编码</label><input id="international-query" data-international-input type="search" autocomplete="off" data-i18n="internationalPlaceholder" data-i18n-attr="placeholder" placeholder="例如：90210、SW1A、10115" required>
        <button class="button button-primary" type="submit" data-i18n="postcodeSearch">查询</button>
      </form>
      <p class="postcode-tip" data-i18n="internationalPrivacy">国际查询会将国家与邮编发送至公开邮编服务；不会发送其他信息。</p>
      <p class="postcode-status" data-international-status aria-live="polite"></p>
      <div class="postcode-results" data-international-results></div>
    </section>
  </div>

  <div class="tool-notes">
    <div><span>01</span><h2 data-i18n="postcodeLocalTitle">本地查询</h2><p data-i18n="postcodeLocalText">数据随页面加载，不会发送你的搜索内容。</p></div>
    <div><span>02</span><h2 data-i18n="postcodeSearchTitle">双向检索</h2><p data-i18n="postcodeSearchText">既可以按地名找邮编，也可以用邮编反查地区。</p></div>
    <div><span>03</span><h2 data-i18n="postcodeDataTitle">使用提示</h2><p data-i18n="postcodeDataText">行政区划与邮编可能调整，寄件前请以邮政网点信息为准。</p></div>
  </div>
</section>
<script src="{{ '/assets/data/china-postcodes.js' | relative_url }}?v=20260902-1"></script>
<script src="{{ '/assets/js/china-postcode.js' | relative_url }}?v=20260902-2"></script>
