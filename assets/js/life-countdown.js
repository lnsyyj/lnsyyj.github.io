(() => {
  const root = document.querySelector('[data-life-countdown]');
  if (!root) return;

  const year = root.querySelector('[data-life-year]');
  const month = root.querySelector('[data-life-month]');
  const day = root.querySelector('[data-life-day]');
  const average = root.querySelector('[data-life-average]');
  const message = root.querySelector('[data-life-message]');
  const output = Object.fromEntries(['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years', 'percent', 'progress', 'remaining', 'next-birthday', 'milestone', 'end-date'].map((name) => [name, root.querySelector(`[data-life-${name}]`)]));
  const number = new Intl.NumberFormat('zh-CN');
  const today = new Date();
  let timer;

  const daysInMonth = (yearValue, monthValue) => new Date(yearValue, monthValue, 0).getDate();
  const dateAtYear = (yearValue, monthValue, dayValue) => new Date(yearValue, monthValue - 1, Math.min(dayValue, daysInMonth(yearValue, monthValue)));
  const dateText = (date) => `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
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
  const values = () => ({ year: Number(year.value), month: Number(month.value), day: Number(day.value), average: Math.max(1, Math.min(130, Number(average.value) || 80)) });
  const update = () => {
    const input = values();
    const birth = dateAtYear(input.year, input.month, input.day);
    const now = new Date();
    if (birth > now) { message.textContent = '生日不能晚于今天。'; return; }
    const milliseconds = now - birth;
    const totalDays = Math.floor(milliseconds / 86400000);
    const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth() - (now.getDate() < birth.getDate() ? 1 : 0);
    const fullYears = Math.floor(totalMonths / 12);
    const nextYear = now >= dateAtYear(now.getFullYear(), input.month, input.day) ? now.getFullYear() + 1 : now.getFullYear();
    const nextBirthday = dateAtYear(nextYear, input.month, input.day);
    const endDate = dateAtYear(input.year + input.average, input.month, input.day);
    const totalLifetime = endDate - birth;
    const percent = Math.max(0, Math.min(100, (milliseconds / totalLifetime) * 100));
    const remainingDays = Math.max(0, Math.ceil((endDate - now) / 86400000));
    const milestoneAge = (Math.floor(fullYears / 5) + 1) * 5;
    const milestone = dateAtYear(input.year + milestoneAge, input.month, input.day);
    output.seconds.textContent = number.format(Math.floor(milliseconds / 1000));
    output.minutes.textContent = number.format(Math.floor(milliseconds / 60000));
    output.hours.textContent = number.format(Math.floor(milliseconds / 3600000));
    output.days.textContent = number.format(totalDays);
    output.weeks.textContent = number.format(Math.floor(totalDays / 7));
    output.months.textContent = number.format(Math.max(0, totalMonths));
    output.years.textContent = number.format(Math.max(0, fullYears));
    output.percent.textContent = `${percent.toFixed(2)}%`;
    output.progress.style.width = `${percent}%`;
    output.progress.parentElement.setAttribute('aria-valuenow', percent.toFixed(2));
    output.remaining.textContent = `按平均 ${input.average} 岁计算，约还有 ${number.format(remainingDays)} 天。`;
    output['next-birthday'].textContent = `${Math.max(0, Math.ceil((nextBirthday - now) / 86400000))} 天（${dateText(nextBirthday)}）`;
    output.milestone.textContent = `${milestoneAge} 岁（${dateText(milestone)}）`;
    output['end-date'].textContent = dateText(endDate);
    message.textContent = `从 ${dateText(birth)} 到现在，时间正在持续流动。`;
  };

  populate();
  [year, month].forEach((control) => control.addEventListener('change', () => { rebuildDays(); update(); }));
  [day, average].forEach((control) => control.addEventListener('input', update));
  root.querySelector('[data-life-calculate]').addEventListener('click', update);
  update();
  timer = window.setInterval(update, 1000);
  window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
})();
