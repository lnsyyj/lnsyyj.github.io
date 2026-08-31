---
layout: default
title: 人生倒计时计算器
description: 免费的人生倒计时计算器：实时查看已度过的时间、下次生日、人生进度与统计参考日期。
permalink: /tools/life-countdown/
---

<section class="tool-page life-page" id="top" data-life-countdown>
  <p class="eyebrow">TOOL / 03</p>
  <h1>人生 <em>倒计时</em></h1>
  <p class="tool-lead">输入生日和平均年龄，看看时间走到了哪里。所有计算仅在当前浏览器中完成。</p>

  <div class="life-calculator">
    <div class="life-inputs">
      <label>出生日期
        <span class="date-selects"><select data-life-year aria-label="出生年份"></select><select data-life-month aria-label="出生月份"></select><select data-life-day aria-label="出生日期"></select></span>
      </label>
      <label>平均年龄（岁）<input data-life-average type="number" min="1" max="130" value="80" inputmode="numeric"></label>
      <button class="button button-primary" type="button" data-life-calculate>开始计算</button>
    </div>

    <p class="life-message" data-life-message>选择生日后，时间会实时更新。</p>
    <div class="life-counters" aria-live="polite">
      <div><b data-life-seconds>—</b><span>已度过秒数</span></div><div><b data-life-minutes>—</b><span>已度过分钟</span></div><div><b data-life-hours>—</b><span>已度过小时</span></div>
      <div><b data-life-days>—</b><span>已度过天数</span></div><div><b data-life-weeks>—</b><span>已度过周数</span></div><div><b data-life-months>—</b><span>已度过月数</span></div><div><b data-life-years>—</b><span>当前周岁</span></div>
    </div>

    <div class="life-progress-card">
      <div class="life-progress-heading"><span>按平均年龄计算的人生进度</span><strong data-life-percent>—</strong></div>
      <div class="life-progress" role="progressbar" aria-label="人生进度"><i data-life-progress></i></div>
      <p data-life-remaining>—</p>
    </div>

    <div class="life-details">
      <div><span>距离下一个生日</span><strong data-life-next-birthday>—</strong></div>
      <div><span>下一个年龄里程碑</span><strong data-life-milestone>—</strong></div>
      <div><span>统计参考日期</span><strong data-life-end-date>—</strong></div>
    </div>
    <p class="life-disclaimer">提示：平均年龄和参考日期仅用于时间统计与自我提醒，不代表个人健康或寿命预测。</p>
  </div>
</section>
<script src="{{ '/assets/js/life-countdown.js' | relative_url }}?v=20260901-1"></script>
