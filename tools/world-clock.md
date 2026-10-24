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

  <section class="tool-guide" data-lang-block>
    <div data-lang="zh-CN">
    <h2>一、怎么用</h2>
    <ol>
      <li>在搜索框输入国家名或城市名（中英文都可以，例如"日本"、"Tokyo"）；</li>
      <li>从下拉框里选一个具体地点，点「添加到仪表盘」；</li>
      <li>仪表盘会每秒刷新，点卡片上的删除即可移除；</li>
      <li>你的选择保存在当前浏览器里，下次打开自动恢复。</li>
    </ol>

    <h2>二、为什么有些国家有好几个"代表城市"</h2>
    <p>因为一个国家不一定只有一个时区。美国本土跨四个时区，澳大利亚跨三个，俄罗斯跨九个以上。这时只给一个"国家时间"就是错的，所以工具会列出代表城市，由你选择真正关心的那个。</p>
    <p>常见用途：和海外同事约会议、盯美股开盘、给异地家人打电话前先看一眼对方是不是深夜。</p>

    <h2>三、时间是怎么算出来的</h2>
    <p>整个过程不联网校时：浏览器本身带了一份 IANA 时区数据库，工具用 <code>Intl.DateTimeFormat</code> 把当前时刻按目标时区格式化。因此：</p>
    <ul>
      <li><strong>夏令时（DST）自动处理。</strong>北美、欧洲等地区每年切换两次，切换当天的时间偏移会变，工具跟随系统时区库自动调整。</li>
      <li><strong>准确性取决于你的系统时间。</strong>如果电脑时间本身偏了，这里显示的所有时间都会一起偏。要精确到秒，请确认系统开启了自动校时。</li>
      <li><strong>不涉及任何定位。</strong>工具不会读取你的地理位置，也不会上传你添加的城市。</li>
    </ul>

    <h2>四、几个容易混淆的地方</h2>
    <p><strong>时区不是"整点偏移"。</strong>印度是 UTC+5:30，尼泊尔是 UTC+5:45，不是所有地方都按整小时划分。</p>
    <p><strong>缩写有歧义。</strong>CST 可以指中国标准时间、美国中部时间，也可能是古巴标准时间。跨时区沟通时，写出"UTC+8"比写缩写安全得多。</p>
    <p><strong>跨日界线要看清日期。</strong>北京上午 9 点时，洛杉矶还是前一天下午 6 点。安排会议时以"哪一天"对齐，比只看钟点更不容易出错。</p>
    </div>
    <div data-lang="en" hidden>
      <h2>How to use it</h2>
      <ol>
        <li>Type a country or city into the search box &mdash; Chinese or English both work;</li>
        <li>Pick a specific location from the dropdown and press Add to dashboard;</li>
        <li>The dashboard refreshes every second; remove a card with its delete button;</li>
        <li>Your selection is stored in this browser and restored next time.</li>
      </ol>

      <h2>Why some countries get several cities</h2>
      <p>Because a country does not necessarily have one time zone. The contiguous United States spans four, Australia three, Russia nine or more. A single country time would simply be wrong, so the tool lists representative cities and lets you choose the one you actually care about.</p>
      <p>Typical uses: scheduling calls with overseas colleagues, watching a market open, checking whether it is the middle of the night for family abroad.</p>

      <h2>How the time is computed</h2>
      <p>No network time service is involved. Your browser ships an IANA time zone database, and the tool formats the current instant with <code>Intl.DateTimeFormat</code>. Consequently:</p>
      <ul>
        <li><strong>Daylight saving is handled automatically.</strong> North America and Europe switch twice a year; offsets follow your system's zone data.</li>
        <li><strong>Accuracy depends on your system clock.</strong> If your machine is off, every clock here is off by the same amount. Enable automatic time sync if seconds matter.</li>
        <li><strong>No geolocation.</strong> The tool never reads your location and never uploads the cities you add.</li>
      </ul>

      <h2>Easy confusions</h2>
      <p><strong>Offsets are not all whole hours.</strong> India is UTC+5:30, Nepal UTC+5:45.</p>
      <p><strong>Abbreviations are ambiguous.</strong> CST could be China Standard Time, US Central, or Cuba Standard. Writing UTC+8 is always safer across time zones.</p>
      <p><strong>Watch the date, not just the hour.</strong> When it is 9 a.m. in Beijing it is still 6 p.m. the previous day in Los Angeles. Agreeing on which day first prevents most scheduling mistakes.</p>
    </div>
  </section>
</section>
<script src="{{ '/assets/js/world-clock-data.js' | relative_url }}?v=20260904-1"></script>
<script src="{{ '/assets/js/world-clock.js' | relative_url }}?v=20260904-1"></script>
