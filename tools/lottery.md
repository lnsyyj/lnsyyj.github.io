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

  <section class="tool-guide">
    <h2>一、怎么用</h2>
    <ol>
      <li>把参与者名单粘进左侧文本框，每行一个姓名，也支持逗号、分号、制表符分隔（从 Excel 直接复制过来即可）；</li>
      <li>填写当前奖项（如"三等奖"）、奖品名称和本次抽取人数，需要的话上传一张奖品图片；</li>
      <li>点「加载名单」，系统会去空白、去重，并显示有效人数；</li>
      <li>点「开始抽奖」，每轮从<strong>尚未中奖</strong>的人里抽，抽中的人不会再次出现；</li>
      <li>抽完点「下载 CSV」，得到带姓名、奖项、时间的记录文件。</li>
    </ol>

    <h2>二、"公平"具体指什么</h2>
    <p>抽奖程序最容易出的问题不是"有人作弊"，而是<strong>随机数不够随机</strong>。很多实现用 <code>Math.random()</code>，它速度快，但不是密码学安全的，理论上可被预测；而且直接用"随机数对人数取余"会带来<strong>模偏差</strong>——当随机数范围不能被人数整除时，靠前的几个位置被抽中的概率会略高。</p>
    <p>本工具的做法是：</p>
    <ul>
      <li>用浏览器提供的 <code>crypto.getRandomValues()</code> 取密码学安全随机数；</li>
      <li>用<strong>拒绝采样</strong>（落在无效区间的随机数丢弃重取）消除模偏差，保证每个人概率完全相等；</li>
      <li>无放回抽取，每轮从剩余名单里选，避免同一个人重复中奖。</li>
    </ul>

    <h2>三、办活动时的几个实用建议</h2>
    <ul>
      <li><strong>先公示名单再开抽。</strong>把"加载名单"后显示的有效人数报给现场或群里，大家才知道基数是多少、有没有人被漏掉。</li>
      <li><strong>留下记录。</strong>抽完立刻下载 CSV，连同屏幕录制或截图一起存档，事后有争议时可复核。</li>
      <li><strong>重名要提前处理。</strong>系统按姓名去重，两个同名的人会被合并成一条。建议在名单里加上部门或编号后缀。</li>
      <li><strong>奖品图片只在本机读取。</strong>上传的图片不会发到服务器，仅用于展示。</li>
    </ul>

    <h2>四、适用与不适用</h2>
    <p>它适合公司年会、社群活动、课堂提问这类"现场公开抽取"的场景。如果活动涉及法定有奖销售、需要公证或需要向监管部门报备，请按当地规定执行，本工具只能作为现场的辅助展示手段。</p>
  </section>
</section>
<script src="{{ '/assets/js/lottery.js' | relative_url }}?v=20260902-1"></script>
