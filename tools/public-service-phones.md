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

  <aside class="public-phone-emergency-warning" role="alert" data-i18n="publicPhonesEmergencyWarning">生命或财产受到威胁时，请立即拨打当地紧急服务电话；不要依赖本页面加载、搜索或翻译。</aside>
  <p data-i18n="publicPhonesSupportingNote">号码可能因地区、服务和时间而变化；重要情况请通过官方来源确认。搜索和筛选仅在浏览器本地处理，不会上传。</p>

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

  <section class="tool-guide" data-lang-block>
    <div data-lang="zh-CN">
    <h2>一、怎么用</h2>
    <ol>
      <li>先选国家或地区——同一个"报警/急救"类目，各国号码完全不同，选错国家查到的是无效号码；</li>
      <li>用服务类别按钮快速筛选（紧急服务、交通、政务、银行、通信等）；</li>
      <li>也可以直接搜关键词，比如"警察""12345""95588"；</li>
      <li>点号码可复制，方便在手忙脚乱时快速拨出。</li>
    </ol>
    <p>号码数据随页面一起加载，搜索和筛选都在本地完成，不会上传你的查询内容。</p>

    <h2>二、最重要的一条</h2>
    <p><strong>生命或财产正受到威胁时，不要用这个页面。</strong>直接拨当地紧急号码，或者请身边的人帮忙拨。网页需要加载、需要搜索、需要分辨国家——任何一环卡住，损失的都是时间。</p>
    <p>出国前值得做的一件事：把目的地国家的紧急号码写在纸上，和护照放在一起。手机没电、没网、语言不通时，一张纸比任何 App 都可靠。</p>

    <h2>三、为什么号码必须"核验"</h2>
    <p>公共服务号码有几个特点，决定了它不能用"抄来的清单"：</p>
    <ul>
      <li><strong>会变。</strong>机构改革、线路升级、号码扩容都会导致变更，几年前的号码册很可能已经失效。</li>
      <li><strong>分地区。</strong>同一个国家里，不同州/省/城市的政务、警务号码可能完全不同。</li>
      <li><strong>有山寨。</strong>搜索"XX 客服电话"时，排在前面的大概率是第三方代理甚至诈骗号码，这是非常典型的一类骗局。</li>
    </ul>
    <p>所以本目录里的每条记录都标注了核验来源与时间。但即便是核验过的号码，也可能在你查看时刚刚变更——<strong>涉及转账、退款、账户冻结这类事，请务必回到官方 App 或官方网站内的联系方式</strong>，不要相信任何主动打来、或搜索得来的"客服电话"。</p>

    <h2>四、识别假客服的三个信号</h2>
    <ol>
      <li><strong>要求你转账、汇款、买礼品卡</strong>：正规机构不会通过电话要求你转到"安全账户"。</li>
      <li><strong>要求你共享屏幕或索要验证码</strong>：验证码等同于密码，任何人索要都是危险信号。</li>
      <li><strong>催你"马上处理，否则冻结"</strong>：制造紧迫感是诈骗的核心手法。挂断，自己通过官方渠道回拨。</li>
    </ol>
    <p>如果你发现目录里的号码有误或已失效，欢迎通过<a href="/contact/">联系页面</a>告知，我会重新核验后更新。</p>
    </div>
    <div data-lang="en" hidden>
      <h2>How to use it</h2>
      <ol>
        <li>Choose the country or region first &mdash; police and ambulance numbers differ everywhere, and the wrong pick returns a number that does not work;</li>
        <li>Filter by service category (emergency, transport, government, banking, telecom...);</li>
        <li>Or search by keyword, for example police, 12345 or 95588;</li>
        <li>Click a number to copy it, so you can dial quickly when your hands are shaking.</li>
      </ol>
      <p>The data ships with the page and all filtering is local; your query is never uploaded.</p>

      <h2>The one rule that matters</h2>
      <p><strong>If life or property is at risk, do not use this page.</strong> Dial the local emergency number, or ask someone nearby to dial it. A web page has to load, be searched, and be matched to the right country &mdash; any of those steps failing costs time you do not have.</p>
      <p>Worth doing before you travel: write the destination's emergency numbers on paper and keep it with your passport. When the phone is dead, offline, or the language barrier hits, paper beats any app.</p>

      <h2>Why numbers must be verified</h2>
      <p>Public service numbers have properties that make copied lists useless:</p>
      <ul>
        <li><strong>They change.</strong> Agency reorganisations, line upgrades and number expansion all break old directories.</li>
        <li><strong>They are regional.</strong> Within one country, government and police numbers can differ by state or city.</li>
        <li><strong>They get spoofed.</strong> Search for a customer service number and the top results are often third-party agents or outright scammers &mdash; a very common fraud pattern.</li>
      </ul>
      <p>Every entry here carries a verification source and date. Even so, a verified number can change the day after &mdash; <strong>for anything involving transfers, refunds or frozen accounts, go back to the official app or the official website's own contact details</strong>. Never trust a number that called you, or one you found by searching.</p>

      <h2>Three signals of a fake agent</h2>
      <ol>
        <li><strong>They ask you to transfer money</strong> or buy gift cards. No legitimate institution moves your funds to a safe account over the phone.</li>
        <li><strong>They ask you to share your screen or read out a verification code.</strong> A code is a password; anyone asking for it is a threat.</li>
        <li><strong>They create urgency</strong> &mdash; act now or your account is frozen. Manufactured urgency is the core of the play. Hang up and call back through an official channel.</li>
      </ol>
      <p>If a number here is wrong or dead, tell me through the <a href="/contact/">contact page</a> and I will re-verify and update it.</p>
    </div>
  </section>
</section>

<script src="{{ '/assets/js/public-service-phones-data.js' | relative_url }}"></script>
<script src="{{ '/assets/js/public-service-phones.js' | relative_url }}"></script>
