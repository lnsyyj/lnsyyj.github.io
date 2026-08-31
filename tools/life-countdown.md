---
layout: default
title: 人生倒计时计算器
description: 免费的人生倒计时计算器：实时查看已度过的时间、剩余倒计时、下次生日与人生进度。
permalink: /tools/life-countdown/
---

<section class="tool-page life-page" id="top" data-life-countdown>
  <p class="eyebrow">TOOL / 03</p>
  <h1 data-i18n="lifeTitle">人生 <em>倒计时</em></h1>
  <p class="tool-lead" data-i18n="lifeLead">输入生日和平均年龄，看看时间走到了哪里。所有计算仅在当前浏览器中完成。</p>

  <div class="life-calculator">
    <div class="life-inputs">
      <label><span data-i18n="lifeBirthDate">出生日期</span>
        <span class="date-selects"><select data-life-year aria-label="出生年份"></select><select data-life-month aria-label="出生月份"></select><select data-life-day aria-label="出生日期"></select></span>
      </label>
      <label><span data-i18n="lifeAverageAge">平均年龄（岁）</span><input data-life-average type="number" min="1" max="130" value="80" inputmode="numeric"></label>
      <button class="button button-primary" type="button" data-life-calculate data-i18n="lifeCalculate">开始计算</button>
    </div>

    <p class="life-message" data-life-message>选择生日后，时间会实时更新。</p>
    <div class="life-counters" aria-live="polite">
      <div><b data-life-seconds>—</b><span data-i18n="lifeSeconds">已度过秒数</span></div><div><b data-life-minutes>—</b><span data-i18n="lifeMinutes">已度过分钟</span></div><div><b data-life-hours>—</b><span data-i18n="lifeHours">已度过小时</span></div>
      <div><b data-life-days>—</b><span data-i18n="lifeDays">已度过天数</span></div><div><b data-life-weeks>—</b><span data-i18n="lifeWeeks">已度过周数</span></div><div><b data-life-months>—</b><span data-i18n="lifeMonths">已度过月数</span></div><div><b data-life-years>—</b><span data-i18n="lifeYears">当前周岁</span></div>
    </div>

    <div class="life-progress-card">
      <div class="life-progress-heading"><span data-i18n="lifeProgressLabel">按平均年龄计算的人生进度</span><strong data-life-percent>—</strong></div>
      <div class="life-progress" role="progressbar" aria-label="人生进度" data-i18n="lifeProgressLabel" data-i18n-attr="aria-label"><i data-life-progress></i></div>
      <p data-life-remaining>—</p>
    </div>

    <section class="life-remaining-card" aria-live="polite">
      <h2 data-i18n="lifeRemainingTitle">距离告别时间</h2>
      <div class="life-counters life-remaining-counters">
        <div><b data-life-remaining-seconds>—</b><span data-i18n="lifeRemainingSeconds">剩余秒数</span></div><div><b data-life-remaining-minutes>—</b><span data-i18n="lifeRemainingMinutes">剩余分钟</span></div><div><b data-life-remaining-hours>—</b><span data-i18n="lifeRemainingHours">剩余小时</span></div>
        <div><b data-life-remaining-days>—</b><span data-i18n="lifeRemainingDays">剩余天数</span></div><div><b data-life-remaining-weeks>—</b><span data-i18n="lifeRemainingWeeks">剩余周数</span></div><div><b data-life-remaining-months>—</b><span data-i18n="lifeRemainingMonths">剩余月数</span></div><div><b data-life-remaining-years>—</b><span data-i18n="lifeRemainingYears">剩余整年</span></div>
      </div>
    </section>

    <div class="life-details">
      <div><span data-i18n="lifeNextBirthday">距离下一个生日</span><strong data-life-next-birthday>—</strong></div>
      <div><span data-i18n="lifeMilestone">下一个年龄里程碑</span><strong data-life-milestone>—</strong></div>
      <div><span data-i18n="lifeFarewellTime">告别时间</span><strong data-life-end-date>—</strong></div>
    </div>
    <p class="life-disclaimer" data-i18n="lifeDisclaimer">提示：告别时间和剩余倒计时仅按平均年龄估算，用于时间统计与自我提醒，不代表个人健康或寿命预测。</p>
  </div>
</section>
<script src="{{ '/assets/js/life-countdown.js' | relative_url }}?v=20260901-4"></script>
