(() => {
  const root = document.querySelector('[data-postcode-tool]');
  const data = typeof areaZip === 'undefined' ? [] : areaZip;
  if (!root || !Array.isArray(data)) return;

  const form = root.querySelector('[data-postcode-form]');
  const input = root.querySelector('[data-postcode-input]');
  const status = root.querySelector('[data-postcode-status]');
  const results = root.querySelector('[data-postcode-results]');
  const provinceTabs = root.querySelector('[data-postcode-provinces]');
  const cityTabs = root.querySelector('[data-postcode-cities]');
  const fallback = { postcodeNeedQuery: '请输入至少 2 个字符的地名，或至少 3 位邮政编码。', postcodeNoResults: '没有找到匹配结果，请尝试更完整的地名或邮编。', postcodeResultCount: '找到 {count} 条结果。', postcodeMoreResults: '仅显示前 {count} 条，请补充关键词以缩小范围。', postcodeCityCount: '{city} · 共 {count} 个区县邮编' };
  const t = (key) => window.siteI18n?.t(key) || fallback[key] || key;
  const text = (key, values) => Object.entries(values).reduce((value, [name, item]) => value.replaceAll(`{${name}}`, item), t(key));
  const escape = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  let provinceIndex = 0;
  let cityIndex = 0;

  const cityEntries = (province, city) => (city.child || []).map((district) => ({ province: province.name, city: city.name, district: district.name, zipcode: String(district.zipcode || '') }));
  const allEntries = data.flatMap((province, pIndex) => (province.child || []).flatMap((city, cIndex) => cityEntries(province, city).map((entry) => ({ ...entry, pIndex, cIndex }))));
  const renderResults = (entries) => {
    results.innerHTML = entries.map((entry) => `<article class="postcode-result"><strong>${escape(entry.zipcode)}</strong><span>${escape(entry.province)} · ${escape(entry.city)} · ${escape(entry.district)}</span></article>`).join('');
  };
  const renderCities = () => {
    const cities = data[provinceIndex].child || [];
    cityIndex = Math.min(cityIndex, Math.max(0, cities.length - 1));
    cityTabs.innerHTML = cities.map((city, index) => `<button type="button" class="postcode-tab${index === cityIndex ? ' is-active' : ''}" data-city-index="${index}">${escape(city.name)}</button>`).join('');
  };
  const showCity = () => {
    const province = data[provinceIndex];
    const city = province.child[cityIndex];
    const entries = cityEntries(province, city);
    renderResults(entries);
    status.textContent = text('postcodeCityCount', { city: `${province.name} · ${city.name}`, count: entries.length });
  };
  const selectProvince = (index) => {
    provinceIndex = index;
    cityIndex = 0;
    provinceTabs.querySelectorAll('[data-province-index]').forEach((tab) => tab.classList.toggle('is-active', Number(tab.dataset.provinceIndex) === provinceIndex));
    renderCities();
    showCity();
  };
  const selectCity = (index) => {
    cityIndex = index;
    cityTabs.querySelectorAll('[data-city-index]').forEach((tab) => tab.classList.toggle('is-active', Number(tab.dataset.cityIndex) === cityIndex));
    showCity();
  };
  const showSearch = (query) => {
    const value = query.trim();
    if ((!/^\d+$/.test(value) && value.length < 2) || (/^\d+$/.test(value) && value.length < 3)) {
      status.textContent = t('postcodeNeedQuery');
      results.innerHTML = '';
      return;
    }
    const normalized = value.replace(/\s+/g, '');
    const matches = allEntries.filter((entry) => `${entry.province}${entry.city}${entry.district}`.includes(normalized) || entry.zipcode.startsWith(normalized));
    const visible = matches.slice(0, 80);
    if (!visible.length) {
      status.textContent = t('postcodeNoResults');
      results.innerHTML = '';
      return;
    }
    const first = matches[0];
    provinceIndex = first.pIndex;
    cityIndex = first.cIndex;
    provinceTabs.querySelectorAll('[data-province-index]').forEach((tab) => tab.classList.toggle('is-active', Number(tab.dataset.provinceIndex) === provinceIndex));
    renderCities();
    renderResults(visible);
    status.textContent = matches.length > visible.length ? text('postcodeMoreResults', { count: visible.length }) : text('postcodeResultCount', { count: visible.length });
  };

  provinceTabs.innerHTML = data.map((province, index) => `<button type="button" class="postcode-tab${index === provinceIndex ? ' is-active' : ''}" data-province-index="${index}">${escape(province.name)}</button>`).join('');
  provinceTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-province-index]'); if (button) selectProvince(Number(button.dataset.provinceIndex)); });
  cityTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-city-index]'); if (button) selectCity(Number(button.dataset.cityIndex)); });
  form.addEventListener('submit', (event) => { event.preventDefault(); showSearch(input.value); });
  input.addEventListener('input', () => { if (input.value.trim().length >= 2) showSearch(input.value); });
  renderCities();
  showCity();
  window.addEventListener('sitei18nchange', showCity);
})();
