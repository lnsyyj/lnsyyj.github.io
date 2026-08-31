(() => {
  const root = document.querySelector('[data-life-countdown]');
  if (!root) return;

  const year = root.querySelector('[data-life-year]');
  const month = root.querySelector('[data-life-month]');
  const day = root.querySelector('[data-life-day]');
  const average = root.querySelector('[data-life-average]');
  const message = root.querySelector('[data-life-message]');
  const output = Object.fromEntries(['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years', 'percent', 'progress', 'remaining', 'remaining-seconds', 'remaining-minutes', 'remaining-hours', 'remaining-days', 'remaining-weeks', 'remaining-months', 'remaining-years', 'next-birthday', 'milestone', 'end-date'].map((name) => [name, root.querySelector(`[data-life-${name}]`)]));
  const storageKey = 'lifeCountdownSettings';
  const fallback = { lifeFutureBirth: '生日不能晚于今天。', lifeFlowing: '时间正在持续流动。', lifeRemaining: '按平均 {age} 岁计算，约还有 {days} 天。', lifeBirthdayDetail: '{days} 天（{date}）', lifeMilestoneDetail: '{age} 岁（{date}）' };
  const t = (key) => window.siteI18n?.t(key) || fallback[key] || key;
  const interpolate = (key, values) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), t(key));
  const today = new Date();
  let timer;

  const daysInMonth = (yearValue, monthValue) => new Date(yearValue, monthValue, 0).getDate();
  const dateAtYear = (yearValue, monthValue, dayValue) => new Date(yearValue, monthValue - 1, Math.min(dayValue, daysInMonth(yearValue, monthValue)));
  const dateText = (date) => new Intl.DateTimeFormat(window.siteI18n?.lang || 'zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  const rebuildDays = () => {
    const current = Number(day.value) || 1;
    const maximum = daysInMonth(Number(year.value), Number(month.value));
    day.innerHTML = Array.from({ length: maximum }, (_, index) => `<option value="${index + 1}">${index + 1} 日</option>`).join('');
    day.value = Math.min(current, maximum);
  };
  const populate = () => {
    const currentYear = today.getFullYear();
    year.innerHTML = Array.from({ length: 121 }, (_, index) => currentYear - index).map((value) => `<option value="${value}">${value} 年</option>`).join('');
    month.innerHTML = Array.from({ length: 12 }, (_, index) => `<option value="${index + 1}">${index + 1} 月</option>`).join('');
    year.value = currentYear - 25;
    month.value = today.getMonth() + 1;
    rebuildDays();
    day.value = Math.min(today.getDate(), Number(day.options.length));
  };
  const restore = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved) return;
      if (year.querySelector(`option[value="${saved.year}"]`)) year.value = saved.year;
      if (month.querySelector(`option[value="${saved.month}"]`)) month.value = saved.month;
      rebuildDays();
      if (day.querySelector(`option[value="${saved.day}"]`)) day.value = saved.day;
      if (saved.average) average.value = saved.average;
    } catch (_) { /* Ignore unavailable or malformed local preferences. */ }
  };
  const save = () => localStorage.setItem(storageKey, JSON.stringify(values()));
  const values = () => ({ year: Number(year.value), month: Number(month.value), day: Number(day.value), average: Math.max(1, Math.min(130, Number(average.value) || 80)) });
  const update = () => {
    const input = values();
    const birth = dateAtYear(input.year, input.month, input.day);
    const now = new Date();
    if (birth > now) { message.textContent = t('lifeFutureBirth'); return; }
    const number = new Intl.NumberFormat(window.siteI18n?.lang || 'zh-CN');
    const milliseconds = now - birth;
    const totalDays = Math.floor(milliseconds / 86400000);
    const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth() - (now.getDate() < birth.getDate() ? 1 : 0);
    const fullYears = Math.floor(totalMonths / 12);
    const nextYear = now >= dateAtYear(now.getFullYear(), input.month, input.day) ? now.getFullYear() + 1 : now.getFullYear();
    const nextBirthday = dateAtYear(nextYear, input.month, input.day);
    const endDate = dateAtYear(input.year + input.average, input.month, input.day);
    const totalLifetime = endDate - birth;
    const percent = Math.max(0, Math.min(100, (milliseconds / totalLifetime) * 100));
    const remainingMilliseconds = Math.max(0, endDate - now);
    const remainingDays = Math.ceil(remainingMilliseconds / 86400000);
    const remainingMonths = Math.max(0, (endDate.getFullYear() - now.getFullYear()) * 12 + endDate.getMonth() - now.getMonth() - (endDate.getDate() < now.getDate() ? 1 : 0));
    const milestoneAge = (Math.floor(fullYears / 5) + 1) * 5;
    const milestone = dateAtYear(input.year + milestoneAge, input.month, input.day);
    output.seconds.textContent = number.format(Math.floor(milliseconds / 1000));
    output.minutes.textContent = number.format(Math.floor(milliseconds / 60000));
    output.hours.textContent = number.format(Math.floor(milliseconds / 3600000));
    output.days.textContent = number.format(totalDays);
    output.weeks.textContent = number.format(Math.floor(totalDays / 7));
    output.months.textContent = number.format(Math.max(0, totalMonths));
    output.years.textContent = number.format(Math.max(0, fullYears));
    output['remaining-seconds'].textContent = number.format(Math.floor(remainingMilliseconds / 1000));
    output['remaining-minutes'].textContent = number.format(Math.floor(remainingMilliseconds / 60000));
    output['remaining-hours'].textContent = number.format(Math.floor(remainingMilliseconds / 3600000));
    output['remaining-days'].textContent = number.format(remainingDays);
    output['remaining-weeks'].textContent = number.format(Math.floor(remainingDays / 7));
    output['remaining-months'].textContent = number.format(remainingMonths);
    output['remaining-years'].textContent = number.format(Math.floor(remainingMonths / 12));
    output.percent.textContent = `${percent.toFixed(2)}%`;
    output.progress.style.width = `${percent}%`;
    output.progress.parentElement.setAttribute('aria-valuenow', percent.toFixed(2));
    output.remaining.textContent = interpolate('lifeRemaining', { age: input.average, days: number.format(remainingDays) });
    output['next-birthday'].textContent = interpolate('lifeBirthdayDetail', { days: number.format(Math.max(0, Math.ceil((nextBirthday - now) / 86400000))), date: dateText(nextBirthday) });
    output.milestone.textContent = interpolate('lifeMilestoneDetail', { age: milestoneAge, date: dateText(milestone) });
    output['end-date'].textContent = dateText(endDate);
    message.textContent = `${dateText(birth)} · ${t('lifeFlowing')}`;
  };

  populate();
  restore();
  [year, month].forEach((control) => control.addEventListener('change', () => { rebuildDays(); save(); update(); }));
  [day, average].forEach((control) => { control.addEventListener('input', () => { save(); update(); }); control.addEventListener('change', () => { save(); update(); }); });
  root.querySelector('[data-life-calculate]').addEventListener('click', () => { save(); update(); });
  update();
  timer = window.setInterval(update, 1000);
  window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
  window.addEventListener('sitei18nchange', update);
})();
