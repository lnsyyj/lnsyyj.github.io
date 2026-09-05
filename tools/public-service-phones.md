---
layout: default
title: 公共服务电话目录
description: 按国家、类别和关键词查找经过核验的公共服务电话。
permalink: /tools/public-service-phones/
---

<section class="tool-page public-service-phones-page" id="top">
  <p class="eyebrow">TOOL / 09</p>
  <h1 data-i18n="publicPhonesTitle">公共服务 <em>电话目录</em></h1>
  <p class="tool-lead" data-i18n="publicPhonesLead">按国家、类别或关键词查找经过核验的公共服务电话。</p>

  <aside class="public-phone-emergency-warning" role="alert" data-i18n="publicPhonesEmergencyWarning">紧急情况请优先联系当地紧急服务；拨号前请确认你所在的国家或地区。</aside>

  <div class="public-phone-filters">
    <label for="public-phone-country"><span data-i18n="publicPhonesCountry">国家或地区</span><select id="public-phone-country"></select></label>
    <div class="public-phone-category-filter">
      <span data-i18n="publicPhonesCategories">服务类别</span>
      <div id="public-phone-categories" role="group" aria-label="服务类别"></div>
    </div>
    <label for="public-phone-search"><span data-i18n="publicPhonesSearch">搜索电话或服务</span><input id="public-phone-search" type="search" data-i18n="publicPhonesSearchPlaceholder" data-i18n-attr="placeholder" placeholder="例如：警察、银行、95588"></label>
  </div>

  <p id="public-phone-count" aria-live="polite" data-i18n="publicPhonesLoading">正在加载电话目录…</p>
  <section id="public-phone-results" aria-live="polite" aria-label="公共服务电话结果"></section>
</section>

<script src="{{ '/assets/js/public-service-phones-data.js' | relative_url }}"></script>
<script src="{{ '/assets/js/public-service-phones.js' | relative_url }}"></script>
