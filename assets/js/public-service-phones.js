(() => {
  const data = window.PublicServicePhonesData;
  const countrySelect = document.getElementById('public-phone-country');
  const categoryContainer = document.getElementById('public-phone-categories');
  const searchInput = document.getElementById('public-phone-search');
  const countNode = document.getElementById('public-phone-count');
  const resultsNode = document.getElementById('public-phone-results');
  const storageKey = 'jiangyu-public-service-phones-state';
  const defaults = { countryId: 'china', categoryId: '', query: '' };
  const labels = {
    'zh-CN': { all: '全部', results: '条结果', noResults: '没有匹配的电话号码，请调整筛选条件。', call: '拨打', copy: '复制号码', source: '查看来源', verified: '核验日期', copied: '号码已复制到剪贴板。', copyFailed: '无法复制号码，请手动复制。' },
    en: { all: 'All', results: 'results', noResults: 'No matching phone numbers. Try another filter.', call: 'Call', copy: 'Copy number', source: 'View source', verified: 'Verified', copied: 'Number copied to clipboard.', copyFailed: 'Could not copy the number. Please copy it manually.' }
  };

  if (!data || !countrySelect || !categoryContainer || !searchInput || !countNode || !resultsNode) return;

  let language = document.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
  let state = restoreState();

  function text(key) {
    return labels[language][key];
  }

  function nameFor(item) {
    return language === 'zh-CN' ? item.nameZh : item.nameEn;
  }

  function restoreState() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (!stored || typeof stored !== 'object'
        || !data.countries.some((country) => country.id === stored.countryId)
        || (stored.categoryId !== '' && !data.categories.some((category) => category.id === stored.categoryId))
        || typeof stored.query !== 'string') return { ...defaults };
      return { countryId: stored.countryId, categoryId: stored.categoryId, query: stored.query };
    } catch {
      return { ...defaults };
    }
  }

  function persistState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function addTextElement(parent, tagName, value) {
    const element = document.createElement(tagName);
    element.textContent = value;
    parent.append(element);
    return element;
  }

  function renderControls() {
    countrySelect.replaceChildren();
    data.countries.forEach((country) => {
      const option = document.createElement('option');
      option.value = country.id;
      option.textContent = nameFor(country);
      option.selected = country.id === state.countryId;
      countrySelect.append(option);
    });

    categoryContainer.replaceChildren();
    [{ id: '', nameZh: text('all'), nameEn: text('all') }, ...data.categories].forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = nameFor(category);
      button.setAttribute('aria-pressed', String(category.id === state.categoryId));
      button.addEventListener('click', () => {
        state.categoryId = category.id;
        persistState();
        render();
      });
      categoryContainer.append(button);
    });
    searchInput.value = state.query;
  }

  function showFeedback(message) {
    const feedback = document.createElement('p');
    feedback.className = 'public-phone-feedback';
    feedback.setAttribute('role', 'status');
    feedback.textContent = message;
    resultsNode.prepend(feedback);
    window.setTimeout(() => feedback.remove(), 3000);
  }

  function copyPhone(phone) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      showFeedback(text('copyFailed'));
      return;
    }
    navigator.clipboard.writeText(phone).then(() => showFeedback(text('copied'))).catch(() => showFeedback(text('copyFailed')));
  }

  function renderResults() {
    const records = data.filterRecords(state);
    countNode.textContent = `${records.length} ${text('results')}`;
    resultsNode.replaceChildren();
    if (!records.length) {
      addTextElement(resultsNode, 'p', text('noResults'));
      return;
    }
    records.forEach((record) => {
      const recordNode = document.createElement('article');
      recordNode.className = 'public-phone-record';
      addTextElement(recordNode, 'h2', language === 'zh-CN' ? record.institutionZh : record.institutionEn);
      addTextElement(recordNode, 'p', language === 'zh-CN' ? record.descriptionZh : record.descriptionEn);
      const number = document.createElement('strong');
      number.textContent = record.phone;
      recordNode.append(number);
      const actions = document.createElement('p');
      const telHref = data.toTelHref(record.phone);
      if (telHref) {
        const call = document.createElement('a');
        call.href = telHref;
        call.textContent = text('call');
        actions.append(call);
      }
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = text('copy');
      copy.addEventListener('click', () => copyPhone(record.phone));
      actions.append(copy);
      if (data.isSafeUrl(record.sourceUrl)) {
        const source = document.createElement('a');
        source.href = record.sourceUrl;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
        source.textContent = text('source');
        actions.append(source);
      }
      recordNode.append(actions);
      addTextElement(recordNode, 'small', `${text('verified')}: ${record.verifiedAt}`);
      resultsNode.append(recordNode);
    });
  }

  function render() {
    renderControls();
    renderResults();
  }

  countrySelect.addEventListener('change', () => {
    state.countryId = countrySelect.value;
    persistState();
    render();
  });
  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    persistState();
    renderResults();
  });
  window.addEventListener('sitei18nchange', (event) => {
    language = event.detail && event.detail.lang === 'zh-CN' ? 'zh-CN' : 'en';
    render();
  });

  render();
})();
