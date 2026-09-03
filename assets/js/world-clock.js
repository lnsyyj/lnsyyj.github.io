(() => {
  const root = document.querySelector('[data-world-clock]');
  if (!root || !window.WorldClockData) return;
  const { locations, normalizeLocations } = window.WorldClockData;
  const search = root.querySelector('[data-clock-search]');
  const select = root.querySelector('[data-clock-select]');
  const add = root.querySelector('[data-clock-add]');
  const board = root.querySelector('[data-clock-board]');
  const empty = root.querySelector('[data-clock-empty]');
  const storageKey = 'worldClockDashboard';
  const defaults = ['china-shanghai', 'usa-new-york', 'uk-london'];
  const t = (key) => window.siteI18n?.t(key) || key;
  const isChinese = () => (window.siteI18n?.lang || '').startsWith('zh');
  const label = (location) => isChinese() ? `${location.countryZh} · ${location.cityZh}` : `${location.countryEn} · ${location.cityEn}`;
  const selectedIds = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored === null ? defaults : normalizeLocations(JSON.parse(stored));
    } catch (_) {
      return defaults;
    }
  };
  const save = (ids) => localStorage.setItem(storageKey, JSON.stringify(normalizeLocations(ids)));
  const timeParts = (location) => {
    const lang = window.siteI18n?.lang || 'en';
    const now = new Date();
    const time = new Intl.DateTimeFormat(lang, { timeZone: location.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now);
    const date = new Intl.DateTimeFormat(lang, { timeZone: location.timeZone, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).format(now);
    const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: location.timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now));
    const zone = new Intl.DateTimeFormat('en-US', { timeZone: location.timeZone, timeZoneName: 'shortOffset' }).formatToParts(now).find((part) => part.type === 'timeZoneName')?.value || location.timeZone;
    const phase = hour < 6 ? 'clockNight' : hour < 12 ? 'clockMorning' : hour < 18 ? 'clockAfternoon' : 'clockEvening';
    return { time, date, zone, phase };
  };
  const populate = () => {
    const query = search.value.trim().toLowerCase();
    const current = select.value;
    const matches = locations.filter((location) => !query || [location.countryZh, location.cityZh, location.countryEn, location.cityEn, location.timeZone].join(' ').toLowerCase().includes(query));
    select.innerHTML = matches.map((location) => `<option value="${location.id}">${label(location)}</option>`).join('');
    if (matches.some((location) => location.id === current)) select.value = current;
    add.disabled = !matches.length;
  };
  const render = () => {
    const ids = selectedIds();
    board.innerHTML = ids.map((id) => {
      const location = locations.find((item) => item.id === id);
      const parts = timeParts(location);
      return `<article class="clock-card" data-clock-card="${location.id}"><button class="clock-remove" type="button" data-clock-remove="${location.id}" aria-label="${t('clockRemove')}">×</button><p>${label(location)}</p><strong data-clock-time>${parts.time}</strong><span data-clock-date>${parts.date}</span><footer><i class="${parts.phase}"></i><span data-clock-phase>${t(parts.phase)}</span><b data-clock-zone>${parts.zone}</b></footer></article>`;
    }).join('');
    empty.hidden = ids.length > 0;
    board.hidden = ids.length === 0;
  };
  const refresh = () => root.querySelectorAll('[data-clock-card]').forEach((card) => {
    const location = locations.find((item) => item.id === card.dataset.clockCard);
    const parts = timeParts(location);
    card.querySelector('[data-clock-time]').textContent = parts.time;
    card.querySelector('[data-clock-date]').textContent = parts.date;
    card.querySelector('[data-clock-zone]').textContent = parts.zone;
    card.querySelector('[data-clock-phase]').textContent = t(parts.phase);
    card.querySelector('footer i').className = parts.phase;
  });
  search.addEventListener('input', populate);
  add.addEventListener('click', () => { const ids = selectedIds(); save([...ids, select.value]); render(); refresh(); });
  board.addEventListener('click', (event) => { const button = event.target.closest('[data-clock-remove]'); if (!button) return; save(selectedIds().filter((id) => id !== button.dataset.clockRemove)); render(); });
  window.addEventListener('sitei18nchange', () => { populate(); render(); });
  populate(); render(); refresh();
  window.setInterval(refresh, 1000);
})();
