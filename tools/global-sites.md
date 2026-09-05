---
layout: default
title: 全球网站汇总
description: 按国家、分类或公司查找知名网站、产品官网与在线服务。
permalink: /tools/global-sites/
---

<section class="tool-page global-sites-page" id="top" data-global-sites>
  <p class="eyebrow">TOOL / 08</p>
  <h1 data-i18n="globalSitesTitle">全球网站 <em>汇总</em></h1>
  <p class="tool-lead" data-i18n="globalSitesLead">按国家与分类发现常用网站，或按公司查看旗下产品官网。</p>

  <div class="global-sites-tool">
    <div class="directory-tabs" role="tablist"><button type="button" class="is-active" data-directory-view="country" data-i18n="globalSitesByCountry">按国家找网站</button><button type="button" data-directory-view="company" data-i18n="globalSitesByCompany">按公司找产品</button></div>
    <section data-directory-panel="country">
      <div class="directory-filters"><label><span data-i18n="globalSitesCountry">国家或地区</span><select data-country-select></select></label><label><span data-i18n="globalSitesSearch">搜索网站</span><input type="search" data-sites-search data-i18n="globalSitesSearchPlaceholder" data-i18n-attr="placeholder" placeholder="例如：视频、AI、ChatGPT"></label></div>
      <div class="directory-categories" data-category-tabs aria-label="网站分类"></div>
      <div class="directory-results" data-sites-results aria-live="polite"></div>
      <p class="directory-empty" data-sites-empty hidden data-i18n="globalSitesEmpty">没有找到匹配的网站，请更换国家、分类或关键词。</p>
    </section>
    <section data-directory-panel="company" hidden>
      <div class="directory-filters directory-company-filter"><label><span data-i18n="globalSitesCompany">选择公司</span><select data-company-select></select></label></div>
      <div class="company-tree" data-company-tree aria-live="polite"></div>
    </section>
    <p class="directory-disclaimer" data-i18n="globalSitesDisclaimer">这是编辑精选的官方站点目录，不代表实时排名、商业推荐或所属公司的背书。所有筛选都在浏览器本地完成。</p>
  </div>
  <div class="tool-notes"><div><span>01</span><h2 data-i18n="globalSitesInfo1Title">按需筛选</h2><p data-i18n="globalSitesInfo1Text">先选择国家，再按分类或关键词快速缩小结果。</p></div><div><span>02</span><h2 data-i18n="globalSitesInfo2Title">产品关系</h2><p data-i18n="globalSitesInfo2Text">公司视图将母公司与其核心产品官网放在一起查看。</p></div><div><span>03</span><h2 data-i18n="globalSitesInfo3Title">便于扩展</h2><p data-i18n="globalSitesInfo3Text">目录数据独立维护，后续可继续添加国家、分类、公司和产品。</p></div></div>
</section>
<script src="{{ '/assets/js/global-sites-data.js' | relative_url }}?v=20260905-1"></script>
<script src="{{ '/assets/js/global-sites.js' | relative_url }}?v=20260905-1"></script>
