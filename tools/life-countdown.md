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

  <section class="tool-guide" data-lang-block>
    <div data-lang="zh-CN">
    <h2>一、这个工具在算什么</h2>
    <p>它把你出生至今的时间换算成秒、分、时、天、周、月五种粒度，再用你填的"平均年龄"推一条假设的终点线，算出百分比进度和剩余时长。所有数字都是<strong>纯算术</strong>：当前时间减去出生时间，仅此而已。</p>
    <p>为什么需要它？因为人对"三十年"没有直觉，但对"还剩多少个周末"有。把抽象的时间换成具体可感的数字，是很多人做长期规划的第一步。</p>

    <h2>二、怎么用</h2>
    <ol>
      <li>选择出生年月日（默认换算到当地时区）；</li>
      <li>填一个「平均年龄」参考值，默认 80 岁，可以按自己的情况调整；</li>
      <li>点「开始计算」，页面会实时刷新，并显示下一个生日与下一个年龄里程碑。</li>
    </ol>

    <h2>三、这些数字的边界在哪</h2>
    <ul>
      <li><strong>「告别时间」不是预测。</strong>它只是"出生日期 + 平均年龄"，不包含任何健康、家族史、生活习惯因素。请不要把它当成寿命判断。</li>
      <li><strong>「已度过月数」按自然月计算。</strong>因为每月天数不同，用天数除以 30 会得到略有差异的结果，这是正常的。</li>
      <li><strong>时区会影响「今天」。</strong>在 UTC+8 的浏览器和在 UTC-5 的浏览器里，跨日那一刻的结果会差一天。</li>
      <li><strong>输入不离开浏览器。</strong>出生日期属于敏感信息，本工具不做任何上传，刷新页面后不留存。</li>
    </ul>

    <h2>四、适合怎么用</h2>
    <p>比"看完有点慌"更有价值的用法，是把它当成一个提醒器：看看剩余周数，倒推一下"想做的事需要每周投入多少"；或者用下一个生日当节点，给长期目标设一个自然的分期点。数字本身不重要，重要的是它带来的那个具体感。</p>
    </div>
    <div data-lang="en" hidden>
      <h2>What it actually computes</h2>
      <p>It converts the time since your birth into seconds, minutes, hours, days, weeks and months, then uses the average age you supply as a hypothetical finish line to derive a percentage and a remaining duration. All of it is <strong>plain arithmetic</strong>: now minus your birthday. Nothing more.</p>
      <p>Why bother? Because thirty years means nothing to a human, while how many weekends are left does. Turning an abstraction into a concrete number is often the first step of any long-term plan.</p>

      <h2>How to use it</h2>
      <ol>
        <li>Pick your date of birth (interpreted in your local time zone);</li>
        <li>Set the average-age reference &mdash; 80 by default, adjust to taste;</li>
        <li>Press calculate; the page keeps updating and shows your next birthday and next age milestone.</li>
      </ol>

      <h2>Where the numbers stop</h2>
      <ul>
        <li><strong>Farewell time is not a prediction.</strong> It is birth date plus average age, with no health, family history or lifestyle input. Please do not read it as a lifespan estimate.</li>
        <li><strong>Months are calendar months.</strong> Because month lengths differ, dividing days by 30 gives a slightly different figure &mdash; that is expected.</li>
        <li><strong>Your time zone decides today.</strong> Around midnight, a browser in UTC+8 and one in UTC-5 can disagree by a day.</li>
        <li><strong>Input never leaves the browser.</strong> A birth date is sensitive: nothing is uploaded and nothing is stored.</li>
      </ul>

      <h2>A better way to use it</h2>
      <p>More useful than a moment of anxiety: look at the remaining weeks and work backwards to how much per week a goal needs. Or use your next birthday as a natural checkpoint for a long-running plan. The number itself does not matter; the concreteness does.</p>
    </div>
  </section>
</section>
<script src="{{ '/assets/js/life-countdown.js' | relative_url }}?v=20260901-4"></script>
