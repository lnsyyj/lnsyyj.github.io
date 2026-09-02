---
layout: default
title: 公平抽奖系统
description: 免费在线抽奖系统，使用密码学安全随机数，支持奖项、奖品图片、多次抽取和结果下载。
permalink: /tools/lottery/
---

<section class="tool-page lottery-page" id="top" data-lottery-tool>
  <p class="eyebrow">TOOL / 05</p>
  <h1 data-i18n="lotteryTitle">公平 <em>抽奖系统</em></h1>
  <p class="tool-lead" data-i18n="lotteryLead">使用密码学安全随机数抽取，每位尚未中奖的参与者拥有相同机会。名单与奖品图片仅在当前浏览器中处理。</p>

  <div class="lottery-tool">
    <section class="lottery-setup">
      <div class="lottery-field lottery-names"><label for="lottery-names" data-i18n="lotteryNames">参与者名单</label><textarea id="lottery-names" data-lottery-names data-i18n="lotteryNamesPlaceholder" data-i18n-attr="placeholder" placeholder="每行一个姓名，也支持用逗号、分号或制表符分隔&#10;例如：&#10;张三&#10;李四&#10;王五"></textarea><p data-i18n="lotteryNamesTip">系统会自动去除空白和重复姓名；重新加载名单会清空当前抽奖结果。</p></div>
      <div class="lottery-field"><label for="lottery-rank" data-i18n="lotteryRank">当前奖项</label><select id="lottery-rank" data-lottery-rank></select></div>
      <div class="lottery-field"><label for="lottery-prize" data-i18n="lotteryPrize">奖品名称</label><input id="lottery-prize" data-lottery-prize type="text" data-i18n="lotteryPrizePlaceholder" data-i18n-attr="placeholder" placeholder="例如：无线耳机"></div>
      <div class="lottery-field"><label for="lottery-count" data-i18n="lotteryCount">本次抽取人数</label><input id="lottery-count" data-lottery-count type="number" min="1" value="1" inputmode="numeric"></div>
      <div class="lottery-field"><label for="lottery-image" data-i18n="lotteryImage">奖品图片（可选）</label><input id="lottery-image" data-lottery-image type="file" accept="image/*"><img class="lottery-preview" data-lottery-preview alt="" hidden></div>
      <div class="lottery-actions"><button class="button button-secondary" type="button" data-lottery-load data-i18n="lotteryLoad">加载名单</button><button class="button button-primary" type="button" data-lottery-start data-i18n="lotteryStart">开始抽奖</button><button class="button lottery-end" type="button" data-lottery-end disabled data-i18n="lotteryEnd">结束抽奖</button></div>
    </section>

    <section class="lottery-stage" aria-live="polite">
      <p class="lottery-stage-label" data-i18n="lotteryStageLabel">幸运参与者</p>
      <div class="lottery-wheel" data-lottery-wheel><div class="lottery-wheel-ring" data-lottery-wheel-ring></div><div class="lottery-wheel-center"><div class="lottery-name" data-lottery-name>—</div></div></div>
      <p class="lottery-stage-meta" data-lottery-meta data-i18n="lotteryReady">加载名单后即可开始抽奖。</p>
      <div class="lottery-stats"><span data-lottery-total>0</span><small data-i18n="lotteryTotal">有效参与者</small><span data-lottery-remaining>0</span><small data-i18n="lotteryRemaining">剩余机会</small></div>
    </section>

    <section class="lottery-results">
      <div class="lottery-results-heading"><h2 data-i18n="lotteryResults">抽奖结果</h2><button class="button button-secondary" type="button" data-lottery-download data-i18n="lotteryDownload">下载 CSV</button></div>
      <div class="lottery-result-list" data-lottery-results></div>
    </section>
    <p class="lottery-disclaimer" data-i18n="lotteryFairness">公平说明：系统通过 Web Crypto 随机数与拒绝采样生成无偏随机索引；每轮从尚未中奖者中无放回抽取。</p>
  </div>
</section>
<script src="{{ '/assets/js/lottery.js' | relative_url }}?v=20260902-1"></script>
