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
  const internationalForm = root.querySelector('[data-international-form]');
  const internationalCountry = root.querySelector('[data-international-country]');
  const internationalInput = root.querySelector('[data-international-input]');
  const internationalStatus = root.querySelector('[data-international-status]');
  const internationalResults = root.querySelector('[data-international-results]');
  const fallback = { postcodeNeedQuery: '请输入至少 2 个字符的地名，或至少 3 位邮政编码。', postcodeNoResults: '没有找到匹配结果，请尝试更完整的地名或邮编。', postcodeResultCount: '找到 {count} 条结果。', postcodeMoreResults: '仅显示前 {count} 条，请补充关键词以缩小范围。', postcodeCityCount: '{city} · 共 {count} 个区县邮编' };
  const t = (key) => window.siteI18n?.t(key) || fallback[key] || key;
  const text = (key, values) => Object.entries(values).reduce((value, [name, item]) => value.replaceAll(`{${name}}`, item), t(key));
  const escape = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  let provinceIndex = 0;
  let cityIndex = 0;
  const countries = [
    ['US', '美国', 'United States'], ['GB', '英国', 'United Kingdom'], ['DE', '德国', 'Germany'], ['FR', '法国', 'France'], ['IT', '意大利', 'Italy'], ['ES', '西班牙', 'Spain'], ['NL', '荷兰', 'Netherlands'], ['BE', '比利时', 'Belgium'], ['AT', '奥地利', 'Austria'], ['CH', '瑞士', 'Switzerland'], ['PT', '葡萄牙', 'Portugal'], ['PL', '波兰', 'Poland'], ['SE', '瑞典', 'Sweden'], ['NO', '挪威', 'Norway'], ['DK', '丹麦', 'Denmark'], ['FI', '芬兰', 'Finland'], ['IS', '冰岛', 'Iceland'], ['CZ', '捷克', 'Czechia'], ['SK', '斯洛伐克', 'Slovakia'], ['HU', '匈牙利', 'Hungary'], ['HR', '克罗地亚', 'Croatia'], ['SI', '斯洛文尼亚', 'Slovenia'], ['BG', '保加利亚', 'Bulgaria'], ['LT', '立陶宛', 'Lithuania'], ['LU', '卢森堡', 'Luxembourg'], ['LI', '列支敦士登', 'Liechtenstein'], ['MC', '摩纳哥', 'Monaco'], ['SM', '圣马力诺', 'San Marino'], ['VA', '梵蒂冈', 'Vatican'], ['AD', '安道尔', 'Andorra']
  ];

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
  const renderCountries = () => {
    const selected = internationalCountry.value || 'US';
    const chinese = (window.siteI18n?.lang || 'zh-CN') === 'zh-CN';
    internationalCountry.innerHTML = countries.map(([code, nameZh, nameEn]) => `<option value="${code}">${escape(chinese ? nameZh : nameEn)}</option>`).join('');
    internationalCountry.value = selected;
  };
  const showInternational = async () => {
    const postcode = internationalInput.value.trim();
    if (!postcode) return;
    internationalStatus.textContent = t('internationalLoading');
    internationalResults.innerHTML = '';
    try {
      const response = await fetch(`https://api.zippopotam.us/${internationalCountry.value}/${encodeURIComponent(postcode)}`);
      if (!response.ok) throw new Error('not-found');
      const payload = await response.json();
      const places = payload.places || [];
      if (!places.length) throw new Error('not-found');
      internationalStatus.textContent = text('internationalResultCount', { count: places.length, country: payload.country || internationalCountry.value });
      internationalResults.innerHTML = places.map((place) => `<article class="postcode-result"><strong>${escape(payload['post code'] || postcode)}</strong><span>${escape(payload.country || '')} · ${escape(place.state || '')} · ${escape(place['place name'] || '')}</span></article>`).join('');
    } catch (_) {
      internationalStatus.textContent = t('internationalNoResults');
    }
  };

  provinceTabs.innerHTML = data.map((province, index) => `<button type="button" class="postcode-tab${index === provinceIndex ? ' is-active' : ''}" data-province-index="${index}">${escape(province.name)}</button>`).join('');
  provinceTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-province-index]'); if (button) selectProvince(Number(button.dataset.provinceIndex)); });
  cityTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-city-index]'); if (button) selectCity(Number(button.dataset.cityIndex)); });
  form.addEventListener('submit', (event) => { event.preventDefault(); showSearch(input.value); });
  input.addEventListener('input', () => { if (input.value.trim().length >= 2) showSearch(input.value); });
  internationalForm.addEventListener('submit', (event) => { event.preventDefault(); showInternational(); });
  renderCities();
  renderCountries();
  showCity();
  window.addEventListener('sitei18nchange', () => { showCity(); renderCountries(); });
})();
