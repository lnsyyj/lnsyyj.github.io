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

    <section class="international-postcode" data-world-postcodes-url="{{ '/assets/data/world-postcodes/' | relative_url }}">
      <div><h2 data-i18n="internationalPostcodeTitle">美国与欧洲邮编查询</h2><p data-i18n="internationalPostcodeLead">选择国家并输入完整邮编，查询对应城市、州或地区。</p></div>
      <form class="postcode-search international-search" data-international-form>
        <label class="sr-only" for="international-country" data-i18n="internationalCountry">国家或地区</label><select id="international-country" data-international-country></select>
        <label class="sr-only" for="international-query" data-i18n="internationalPostcode">邮政编码</label><input id="international-query" data-international-input type="search" autocomplete="off" data-i18n="internationalPlaceholder" data-i18n-attr="placeholder" placeholder="例如：90210、SW1A、10115" required>
        <button class="button button-primary" type="submit" data-i18n="postcodeSearch">查询</button>
      </form>
      <p class="postcode-tip" data-i18n="internationalPrivacy">国际查询使用随站点加载的本地数据，不会发送你的搜索内容。</p>
      <p class="postcode-status" data-international-status aria-live="polite"></p>
      <div class="postcode-browser international-browser">
        <section><h2 data-international-region-label data-i18n="internationalRegion">选择行政区</h2><div class="postcode-tabs" data-international-regions></div></section>
        <section><h2 data-international-place-label data-i18n="internationalPlace">选择城市或地区</h2><div class="postcode-tabs postcode-city-tabs" data-international-places></div></section>
      </div>
      <div class="postcode-results" data-international-results></div>
      <p class="postcode-data-credit" data-i18n="internationalDataCredit">国际本地邮编数据：GeoNames（CC BY 4.0）。英国、荷兰等国家可能仅提供邮编前段。</p>
    </section>
  </div>

  <div class="tool-notes">
    <div><span>01</span><h2 data-i18n="postcodeLocalTitle">本地查询</h2><p data-i18n="postcodeLocalText">数据随页面加载，不会发送你的搜索内容。</p></div>
    <div><span>02</span><h2 data-i18n="postcodeSearchTitle">双向检索</h2><p data-i18n="postcodeSearchText">既可以按地名找邮编，也可以用邮编反查地区。</p></div>
    <div><span>03</span><h2 data-i18n="postcodeDataTitle">使用提示</h2><p data-i18n="postcodeDataText">行政区划与邮编可能调整，寄件前请以邮政网点信息为准。</p></div>
  </div>

  <section class="tool-guide" data-lang-block>
    <div data-lang="zh-CN">
    <h2>一、怎么用</h2>
    <ul>
      <li><strong>按地名查</strong>：在搜索框输入省、市、区县名（如"海淀区"），或输入至少 3 位邮编（如"100089"）；</li>
      <li><strong>按层级浏览</strong>：先点省份，再点城市，逐级看到下辖区县的邮编；</li>
      <li><strong>查国外</strong>：在下方「美国与欧洲邮编查询」里选国家，输入完整邮编，可反查对应的城市或州。</li>
    </ul>
    <p>所有筛选都在浏览器里完成，输入的内容不会发送到服务器。</p>

    <h2>二、中国邮编的 6 位是怎么排的</h2>
    <p>中国邮政编码采用六位数字，逐级缩小范围，可以理解成"六层地址"：</p>
    <table>
      <thead><tr><th>位数</th><th>含义</th><th>举例（100089）</th></tr></thead>
      <tbody>
        <tr><td>第 1 位</td><td>大区（华北、东北、华东…）</td><td>1 = 北京及周边</td></tr>
        <tr><td>第 2 位</td><td>省 / 直辖市</td><td>0 = 北京</td></tr>
        <tr><td>第 3 位</td><td>邮区（通常对应地级市）</td><td>0 = 北京城区</td></tr>
        <tr><td>第 4 位</td><td>县 / 区</td><td>0 = 城区范围</td></tr>
        <tr><td>第 5-6 位</td><td>投递局（所）</td><td>89 = 具体投递局</td></tr>
      </tbody>
    </table>
    <p>所以"100"开头基本就是北京，看到前两位就能大致判断省份——这是邮编最初的设计意图：让人（和分拣机）不用查表也能快速分流。</p>

    <h2>三、美国与英国邮编有什么不同</h2>
    <ul>
      <li><strong>美国 ZIP</strong>：5 位数字，前 3 位定位到分拣中心，后 2 位定位到邮局；扩展形式 ZIP+4 再加 4 位，精确到街区或大楼。填 5 位即可正常投递。</li>
      <li><strong>英国</strong>：字母数字混合，由"外向码 + 内向码"组成，空格前面部分大致定位到城镇或城区，后面部分定位到街道段。格式比较宽松，但空格位置有讲究。</li>
      <li><strong>欧洲大陆</strong>：多数国家是 4 到 5 位纯数字，需与国家名一起使用，同一个数字在不同国家含义完全不同。</li>
    </ul>

    <h2>四、这些边界要知道</h2>
    <p><strong>邮编不等于精确地址。</strong>它定位的是投递局或街区范围，不是门牌号。同一栋楼的不同单元可能共用一个邮编。</p>
    <p><strong>数据有时效。</strong>行政区划调整、新开发区设立都会带来邮编变化。本工具的本地数据来自公开数据集，国际部分基于 GeoNames（CC BY 4.0）；英国、荷兰等国家可能只提供邮编前段。</p>
    <p><strong>重要邮件请复核。</strong>寄送合同、证件等重要文件前，建议在邮政官方渠道再核对一次收件邮编，本工具适合快速查询与日常参考。</p>
    </div>
    <div data-lang="en" hidden>
      <h2>How to use it</h2>
      <ul>
        <li><strong>Search by place</strong> &mdash; type a province, city or district name, or at least three digits of a postcode (e.g. 100089);</li>
        <li><strong>Browse by level</strong> &mdash; pick a province, then a city, then a district;</li>
        <li><strong>Look abroad</strong> &mdash; use the US and Europe section below: choose a country, enter the full postcode, and get the matching city or state.</li>
      </ul>
      <p>Everything is filtered in your browser; your input is never sent to a server.</p>

      <h2>How China's six digits are built</h2>
      <p>A Chinese postcode uses six digits that narrow the address level by level &mdash; think of it as a six-layer address:</p>
      <table>
        <thead><tr><th>Digit</th><th>Meaning</th><th>Example (100089)</th></tr></thead>
        <tbody>
          <tr><td>1st</td><td>Region (North, Northeast, East...)</td><td>1 = Beijing area</td></tr>
          <tr><td>2nd</td><td>Province or municipality</td><td>0 = Beijing</td></tr>
          <tr><td>3rd</td><td>Postal zone, usually a prefecture</td><td>0 = urban Beijing</td></tr>
          <tr><td>4th</td><td>County or district</td><td>0 = city core</td></tr>
          <tr><td>5th-6th</td><td>Delivery office</td><td>89 = a specific office</td></tr>
        </tbody>
      </table>
      <p>So anything starting with 100 is essentially Beijing: the first two digits already tell you the province, which was the original point &mdash; letting people and sorting machines route mail without a lookup table.</p>

      <h2>How US and UK codes differ</h2>
      <ul>
        <li><strong>US ZIP</strong> &mdash; five digits; the first three locate a sorting centre, the last two a post office. The ZIP+4 extension adds four more digits for a block or a building. Five digits is enough to deliver.</li>
        <li><strong>UK</strong> &mdash; alphanumeric, an outward code plus an inward code. The part before the space broadly identifies a town or district; the part after narrows to a street segment. The space matters.</li>
        <li><strong>Continental Europe</strong> &mdash; mostly four or five digits, and meaningless without the country: the same number means different places in different countries.</li>
      </ul>

      <h2>Limits to keep in mind</h2>
      <p><strong>A postcode is not an address.</strong> It identifies a delivery office or a block, not a door number. Several units in one building can share a single code.</p>
      <p><strong>Data ages.</strong> Administrative changes and new development areas move postcodes. Local data here comes from public datasets; the international part is based on GeoNames (CC BY 4.0), and some countries &mdash; the UK and the Netherlands, for instance &mdash; may only expose the leading part of a code.</p>
      <p><strong>Double-check anything important.</strong> Before sending contracts or documents, confirm the postcode through the postal service's own channel. This tool is for quick lookups and everyday reference.</p>
    </div>
  </section>
</section>
<script src="{{ '/assets/data/china-postcodes.js' | relative_url }}?v=20260902-1"></script>
<script src="{{ '/assets/js/china-postcode.js' | relative_url }}?v=20260902-3"></script>
