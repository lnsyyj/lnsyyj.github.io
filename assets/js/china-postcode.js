(() => {
  const root = document.querySelector('[data-postcode-tool]');
  const chinaData = typeof areaZip === 'undefined' ? [] : areaZip;
  if (!root || !Array.isArray(chinaData)) return;

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
  const internationalPanel = root.querySelector('[data-world-postcodes-url]');
  const internationalRegionTabs = root.querySelector('[data-international-regions]');
  const internationalPlaceTabs = root.querySelector('[data-international-places]');
  const internationalRegionLabel = root.querySelector('[data-international-region-label]');
  const internationalPlaceLabel = root.querySelector('[data-international-place-label]');
  const fallback = { postcodeNeedQuery: '请输入至少 2 个字符的地名，或至少 3 位邮政编码。', postcodeNoResults: '没有找到匹配结果，请尝试更完整的地名或邮编。', postcodeResultCount: '找到 {count} 条结果。', postcodeMoreResults: '仅显示前 {count} 条，请补充关键词以缩小范围。', postcodeCityCount: '{city} · 共 {count} 个区县邮编', internationalLoading: '正在加载本地邮编数据…', internationalNoResults: '未找到匹配结果，请检查国家和邮编格式。', internationalResultCount: '{country} · 找到 {count} 条结果。', internationalLocalCount: '{country} · {region} · 共 {count} 条邮编记录', internationalRegion: '选择行政区', internationalPlace: '选择城市或地区', internationalOtherRegion: '其他地区' };
  const t = (key) => window.siteI18n?.t(key) || fallback[key] || key;
  const text = (key, values) => Object.entries(values).reduce((value, [name, item]) => value.replaceAll(`{${name}}`, item), t(key));
  const escape = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const sortText = (items) => [...items].sort((left, right) => String(left).localeCompare(String(right)));
  let provinceIndex = 0;
  let cityIndex = 0;
  let worldRecords = [];
  let worldRegions = [];
  let worldPlaces = [];
  let worldRegion = '';
  let worldPlace = '';
  let loadedCountry = '';
  let loadingWorldData;
  const countries = [
    ['US', '美国', 'United States', '州', 'State'], ['AD', '安道尔', 'Andorra', '教区', 'Parish'], ['AL', '阿尔巴尼亚', 'Albania', '州', 'County'], ['AT', '奥地利', 'Austria', '州', 'State'], ['BA', '波黑', 'Bosnia and Herzegovina', '州', 'Region'], ['BE', '比利时', 'Belgium', '大区', 'Region'], ['BG', '保加利亚', 'Bulgaria', '州', 'Province'], ['BY', '白俄罗斯', 'Belarus', '州', 'Region'], ['CH', '瑞士', 'Switzerland', '州', 'Canton'], ['CY', '塞浦路斯', 'Cyprus', '区', 'District'], ['CZ', '捷克', 'Czechia', '州', 'Region'], ['DE', '德国', 'Germany', '州', 'State'], ['DK', '丹麦', 'Denmark', '大区', 'Region'], ['EE', '爱沙尼亚', 'Estonia', '县', 'County'], ['ES', '西班牙', 'Spain', '自治区', 'Region'], ['FI', '芬兰', 'Finland', '大区', 'Region'], ['FR', '法国', 'France', '大区', 'Region'], ['GB', '英国', 'United Kingdom', '郡/地区', 'County / region'], ['GR', '希腊', 'Greece', '大区', 'Region'], ['HR', '克罗地亚', 'Croatia', '县', 'County'], ['HU', '匈牙利', 'Hungary', '州', 'County'], ['IE', '爱尔兰', 'Ireland', '郡', 'County'], ['IS', '冰岛', 'Iceland', '地区', 'Region'], ['IT', '意大利', 'Italy', '大区', 'Region'], ['LI', '列支敦士登', 'Liechtenstein', '市镇', 'Municipality'], ['LT', '立陶宛', 'Lithuania', '县', 'County'], ['LU', '卢森堡', 'Luxembourg', '区', 'District'], ['LV', '拉脱维亚', 'Latvia', '地区', 'Region'], ['MC', '摩纳哥', 'Monaco', '区', 'District'], ['MD', '摩尔多瓦', 'Moldova', '区', 'District'], ['ME', '黑山', 'Montenegro', '市镇', 'Municipality'], ['MK', '北马其顿', 'North Macedonia', '地区', 'Region'], ['MT', '马耳他', 'Malta', '地区', 'Region'], ['NL', '荷兰', 'Netherlands', '省', 'Province'], ['NO', '挪威', 'Norway', '郡', 'County'], ['PL', '波兰', 'Poland', '省', 'Voivodeship'], ['PT', '葡萄牙', 'Portugal', '区', 'District'], ['RO', '罗马尼亚', 'Romania', '县', 'County'], ['RS', '塞尔维亚', 'Serbia', '区', 'District'], ['RU', '俄罗斯', 'Russia', '联邦主体', 'Federal subject'], ['SE', '瑞典', 'Sweden', '郡', 'County'], ['SI', '斯洛文尼亚', 'Slovenia', '市镇', 'Municipality'], ['SK', '斯洛伐克', 'Slovakia', '州', 'Region'], ['SM', '圣马力诺', 'San Marino', '堡', 'Castello'], ['UA', '乌克兰', 'Ukraine', '州', 'Oblast'], ['VA', '梵蒂冈', 'Vatican', '地区', 'Region']
  ];

  const cityEntries = (province, city) => (city.child || []).map((district) => ({ province: province.name, city: city.name, district: district.name, zipcode: String(district.zipcode || '') }));
  const chinaEntries = chinaData.flatMap((province, pIndex) => (province.child || []).flatMap((city, cIndex) => cityEntries(province, city).map((entry) => ({ ...entry, pIndex, cIndex }))));
  const renderResults = (container, entries, path = '') => { container.innerHTML = entries.map((entry) => `<article class="postcode-result"><strong>${escape(entry.zipcode)}</strong><span>${escape(path || `${entry.province} · ${entry.city} · ${entry.district}`)}</span></article>`).join(''); };
  const renderCities = () => { const cities = chinaData[provinceIndex].child || []; cityIndex = Math.min(cityIndex, Math.max(0, cities.length - 1)); cityTabs.innerHTML = cities.map((city, index) => `<button type="button" class="postcode-tab${index === cityIndex ? ' is-active' : ''}" data-city-index="${index}">${escape(city.name)}</button>`).join(''); };
  const showCity = () => { const province = chinaData[provinceIndex]; const city = province.child[cityIndex]; const entries = cityEntries(province, city); renderResults(results, entries); status.textContent = text('postcodeCityCount', { city: `${province.name} · ${city.name}`, count: entries.length }); };
  const selectProvince = (index) => { provinceIndex = index; cityIndex = 0; provinceTabs.querySelectorAll('[data-province-index]').forEach((tab) => tab.classList.toggle('is-active', Number(tab.dataset.provinceIndex) === provinceIndex)); renderCities(); showCity(); };
  const selectCity = (index) => { cityIndex = index; cityTabs.querySelectorAll('[data-city-index]').forEach((tab) => tab.classList.toggle('is-active', Number(tab.dataset.cityIndex) === cityIndex)); showCity(); };
  const showChinaSearch = (query) => { const value = query.trim(); if ((!/^\d+$/.test(value) && value.length < 2) || (/^\d+$/.test(value) && value.length < 3)) { status.textContent = t('postcodeNeedQuery'); results.innerHTML = ''; return; } const normalized = value.replace(/\s+/g, ''); const matches = chinaEntries.filter((entry) => `${entry.province}${entry.city}${entry.district}`.includes(normalized) || entry.zipcode.startsWith(normalized)); const visible = matches.slice(0, 80); if (!visible.length) { status.textContent = t('postcodeNoResults'); results.innerHTML = ''; return; } const first = matches[0]; provinceIndex = first.pIndex; cityIndex = first.cIndex; provinceTabs.querySelectorAll('[data-province-index]').forEach((tab) => tab.classList.toggle('is-active', Number(tab.dataset.provinceIndex) === provinceIndex)); renderCities(); renderResults(results, visible); status.textContent = matches.length > visible.length ? text('postcodeMoreResults', { count: visible.length }) : text('postcodeResultCount', { count: visible.length }); };

  const countryInfo = () => countries.find(([code]) => code === internationalCountry.value) || countries[0];
  const countryName = () => { const [, zh, en] = countryInfo(); return (window.siteI18n?.lang || 'zh-CN') === 'zh-CN' ? zh : en; };
  const updateInternationalLabels = () => { const [, , , regionZh, regionEn] = countryInfo(); const chinese = (window.siteI18n?.lang || 'zh-CN') === 'zh-CN'; internationalRegionLabel.textContent = chinese ? `选择${regionZh}` : `Choose ${regionEn.toLowerCase()}`; internationalPlaceLabel.textContent = t('internationalPlace'); };
  const renderCountries = () => { const selected = internationalCountry.value || 'US'; const chinese = (window.siteI18n?.lang || 'zh-CN') === 'zh-CN'; internationalCountry.innerHTML = countries.map(([code, zh, en]) => `<option value="${code}">${escape(chinese ? zh : en)}</option>`).join(''); internationalCountry.value = selected; updateInternationalLabels(); };
  const renderWorldResults = (records) => { const country = countryName(); internationalResults.innerHTML = records.map(([postcode, place, region, subregion]) => `<article class="postcode-result"><strong>${escape(postcode)}</strong><span>${escape([country, region, subregion, place].filter(Boolean).join(' · '))}</span></article>`).join(''); };
  const renderWorldPlaces = () => { const records = worldRecords.filter((record) => (record[2] || t('internationalOtherRegion')) === worldRegion); worldPlaces = sortText([...new Set(records.map((record) => record[1] || t('internationalOtherRegion')))]); worldPlace = worldPlaces.includes(worldPlace) ? worldPlace : worldPlaces[0] || ''; internationalPlaceTabs.innerHTML = worldPlaces.map((place, index) => `<button type="button" class="postcode-tab${place === worldPlace ? ' is-active' : ''}" data-world-place-index="${index}">${escape(place)}</button>`).join(''); };
  const showWorldPlace = () => { const records = worldRecords.filter((record) => (record[2] || t('internationalOtherRegion')) === worldRegion && (record[1] || t('internationalOtherRegion')) === worldPlace); renderWorldResults(records); internationalStatus.textContent = text('internationalLocalCount', { country: countryName(), region: worldRegion, count: records.length }); };
  const renderWorldRegions = () => { worldRegions = sortText([...new Set(worldRecords.map((record) => record[2] || t('internationalOtherRegion')))]); worldRegion = worldRegions.includes(worldRegion) ? worldRegion : worldRegions[0] || ''; internationalRegionTabs.innerHTML = worldRegions.map((region, index) => `<button type="button" class="postcode-tab${region === worldRegion ? ' is-active' : ''}" data-world-region-index="${index}">${escape(region)}</button>`).join(''); renderWorldPlaces(); showWorldPlace(); };
  const loadWorldData = async () => { const code = internationalCountry.value; if (code === loadedCountry && worldRecords.length) return worldRecords; if (loadingWorldData) return loadingWorldData; internationalStatus.textContent = t('internationalLoading'); internationalResults.innerHTML = ''; loadingWorldData = fetch(`${internationalPanel.dataset.worldPostcodesUrl}${code}.json`).then((response) => { if (!response.ok) throw new Error('missing-data'); return response.json(); }).then((records) => { worldRecords = records; loadedCountry = code; worldRegion = ''; worldPlace = ''; if (!records.length) { internationalRegionTabs.innerHTML = ''; internationalPlaceTabs.innerHTML = ''; internationalStatus.textContent = t('internationalUnavailable'); return records; } renderWorldRegions(); return records; }).catch(() => { worldRecords = []; loadedCountry = code; internationalRegionTabs.innerHTML = ''; internationalPlaceTabs.innerHTML = ''; internationalStatus.textContent = t('internationalNoResults'); return []; }).finally(() => { loadingWorldData = null; }); return loadingWorldData; };
  const showInternationalSearch = async () => { const postcode = internationalInput.value.trim(); if (!postcode) return; const records = await loadWorldData(); const matches = records.filter((record) => record[0] === postcode || record[0].startsWith(postcode)).slice(0, 100); if (!matches.length) { internationalStatus.textContent = t('internationalNoResults'); internationalResults.innerHTML = ''; return; } worldRegion = matches[0][2] || t('internationalOtherRegion'); worldPlace = matches[0][1] || t('internationalOtherRegion'); renderWorldRegions(); renderWorldResults(matches); internationalStatus.textContent = text('internationalResultCount', { country: countryName(), count: matches.length }); };

  provinceTabs.innerHTML = chinaData.map((province, index) => `<button type="button" class="postcode-tab${index === provinceIndex ? ' is-active' : ''}" data-province-index="${index}">${escape(province.name)}</button>`).join('');
  provinceTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-province-index]'); if (button) selectProvince(Number(button.dataset.provinceIndex)); });
  cityTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-city-index]'); if (button) selectCity(Number(button.dataset.cityIndex)); });
  internationalRegionTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-world-region-index]'); if (!button) return; worldRegion = worldRegions[Number(button.dataset.worldRegionIndex)]; worldPlace = ''; renderWorldRegions(); });
  internationalPlaceTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-world-place-index]'); if (!button) return; worldPlace = worldPlaces[Number(button.dataset.worldPlaceIndex)]; renderWorldPlaces(); showWorldPlace(); });
  form.addEventListener('submit', (event) => { event.preventDefault(); showChinaSearch(input.value); });
  input.addEventListener('input', () => { if (input.value.trim().length >= 2) showChinaSearch(input.value); });
  internationalForm.addEventListener('submit', (event) => { event.preventDefault(); showInternationalSearch(); });
  internationalCountry.addEventListener('change', () => { updateInternationalLabels(); loadWorldData(); });
  renderCities(); renderCountries(); showCity(); loadWorldData();
  window.addEventListener('sitei18nchange', () => { showCity(); renderCountries(); updateInternationalLabels(); if (worldRecords.length) { renderWorldRegions(); } });
})();
