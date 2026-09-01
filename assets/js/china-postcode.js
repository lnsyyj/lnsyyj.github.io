(() => {
  const root = document.querySelector('[data-postcode-tool]');
  const data = typeof areaZip === 'undefined' ? [] : areaZip;
  if (!root || !Array.isArray(data)) return;

  const form = root.querySelector('[data-postcode-form]');
  const input = root.querySelector('[data-postcode-input]');
  const status = root.querySelector('[data-postcode-status]');
  const results = root.querySelector('[data-postcode-results]');
  const fallback = { postcodeNeedQuery: '请输入至少 2 个字符的地名，或至少 3 位邮政编码。', postcodeNoResults: '没有找到匹配结果，请尝试更完整的地名或邮编。', postcodeResultCount: '找到 {count} 条结果。', postcodeMoreResults: '仅显示前 {count} 条，请补充关键词以缩小范围。' };
  const t = (key) => window.siteI18n?.t(key) || fallback[key] || key;
  const text = (key, values) => Object.entries(values).reduce((value, [name, item]) => value.replaceAll(`{${name}}`, item), t(key));
  const escape = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const entries = data.flatMap((province) => (province.child || []).flatMap((city) => (city.child || []).map((district) => ({ province: province.name, city: city.name, district: district.name, zipcode: String(district.zipcode || '') }))));

  const show = (query) => {
    const value = query.trim();
    if ((!/^\d+$/.test(value) && value.length < 2) || (/^\d+$/.test(value) && value.length < 3)) {
      status.textContent = t('postcodeNeedQuery');
      results.innerHTML = '';
      return;
    }
    const normalized = value.replace(/\s+/g, '');
    const matches = entries.filter((entry) => `${entry.province}${entry.city}${entry.district}`.includes(normalized) || entry.zipcode.startsWith(normalized));
    const visible = matches.slice(0, 80);
    if (!visible.length) {
      status.textContent = t('postcodeNoResults');
      results.innerHTML = '';
      return;
    }
    status.textContent = matches.length > visible.length ? text('postcodeMoreResults', { count: visible.length }) : text('postcodeResultCount', { count: visible.length });
    results.innerHTML = visible.map((entry) => `<article class="postcode-result"><strong>${escape(entry.zipcode)}</strong><span>${escape(entry.province)} · ${escape(entry.city)} · ${escape(entry.district)}</span></article>`).join('');
  };

  form.addEventListener('submit', (event) => { event.preventDefault(); show(input.value); });
  input.addEventListener('input', () => { if (input.value.trim().length >= 2) show(input.value); });
})();
