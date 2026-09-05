(() => {
  const root = document.querySelector('[data-global-sites]');
  if (!root) return;
  const data = window.GlobalSitesData;
  const empty = root.querySelector('[data-sites-empty]');
  if (!data) {
    empty.hidden = false;
    empty.textContent = window.siteI18n?.t('globalSitesLoadError') || 'The directory data could not be loaded.';
    return;
  }
  const results = root.querySelector('[data-sites-results]');
  const countrySelect = root.querySelector('[data-country-select]');
  const categoryTabs = root.querySelector('[data-category-tabs]');
  const search = root.querySelector('[data-sites-search]');
  const companySelect = root.querySelector('[data-company-select]');
  const companyTree = root.querySelector('[data-company-tree]');
  const storageKey = 'globalSitesDirectoryState';
  const defaults = { countryId: 'china', categoryId: 'all', query: '', companyId: 'google', view: 'country' };
  const t = (key) => window.siteI18n?.t(key) || key;
  const chinese = () => (window.siteI18n?.lang || '').startsWith('zh');
  const local = (record, stem) => record[chinese() ? `${stem}Zh` : `${stem}En`];
  const allowed = (items, id, fallback) => items.some((item) => item.id === id) ? id : fallback;
  const restoreState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      const value = saved && typeof saved === 'object' ? saved : defaults;
      return { countryId: allowed(data.countries, value.countryId, defaults.countryId), categoryId: value.categoryId === 'all' ? 'all' : allowed(data.categories, value.categoryId, 'all'), query: typeof value.query === 'string' ? value.query.slice(0, 120) : '', companyId: allowed(data.companies, value.companyId, defaults.companyId), view: value.view === 'company' ? 'company' : 'country' };
    } catch (_) { return { ...defaults }; }
  };
  let state = restoreState();
  const saveState = () => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) { /* Local preference storage is optional. */ } };
  const addOption = (select, value, text, selected) => { const option = document.createElement('option'); option.value = value; option.textContent = text; option.selected = selected; select.append(option); };
  const siteCard = (site) => {
    const card = document.createElement('article'); card.className = 'directory-site-card';
    const heading = document.createElement('h2'); heading.textContent = local(site, 'name'); card.append(heading);
    const description = document.createElement('p'); description.textContent = local(site, 'description'); card.append(description);
    const meta = document.createElement('div'); meta.className = 'directory-site-meta';
    site.categoryIds.forEach((id) => { const category = data.categories.find((item) => item.id === id); const badge = document.createElement('span'); badge.textContent = local(category, 'name'); meta.append(badge); }); card.append(meta);
    if (site.companyId) { const company = data.companies.find((item) => item.id === site.companyId); const by = document.createElement('small'); by.textContent = local(company, 'name'); card.append(by); }
    if (data.isSafeUrl(site.url)) { const link = document.createElement('a'); link.href = site.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = t('globalSitesOfficial'); card.append(link); }
    return card;
  };
  const renderControls = () => {
    countrySelect.replaceChildren(); data.countries.forEach((country) => addOption(countrySelect, country.id, local(country, 'name'), state.countryId === country.id));
    companySelect.replaceChildren(); data.companies.forEach((company) => addOption(companySelect, company.id, local(company, 'name'), state.companyId === company.id));
    search.value = state.query;
    categoryTabs.replaceChildren();
    [{ id: 'all', nameZh: t('globalSitesAll'), nameEn: t('globalSitesAll') }, ...data.categories].forEach((category) => { const button = document.createElement('button'); button.type = 'button'; button.dataset.categoryId = category.id; button.classList.toggle('is-active', category.id === state.categoryId); button.textContent = local(category, 'name'); categoryTabs.append(button); });
    root.querySelectorAll('[data-directory-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.directoryView === state.view));
    root.querySelectorAll('[data-directory-panel]').forEach((panel) => { panel.hidden = panel.dataset.directoryPanel !== state.view; });
  };
  const renderSites = () => {
    results.replaceChildren();
    const matches = data.filterSites(state);
    matches.forEach((site) => results.append(siteCard(site)));
    empty.hidden = matches.length > 0;
  };
  const renderCompany = () => {
    companyTree.replaceChildren();
    const company = data.companies.find((item) => item.id === state.companyId);
    const heading = document.createElement('div'); heading.className = 'company-tree-heading';
    const name = document.createElement('h2'); name.textContent = local(company, 'name'); heading.append(name);
    if (data.isSafeUrl(company.url)) { const link = document.createElement('a'); link.href = company.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = t('globalSitesOfficial'); heading.append(link); }
    companyTree.append(heading);
    const title = document.createElement('p'); title.className = 'company-tree-label'; title.textContent = t('globalSitesProducts'); companyTree.append(title);
    const list = document.createElement('div'); list.className = 'company-product-list';
    data.productsForCompany(company.id).forEach((product) => { const item = document.createElement('a'); item.className = 'company-product'; item.href = product.url; item.target = '_blank'; item.rel = 'noopener noreferrer'; const productName = document.createElement('strong'); productName.textContent = local(product, 'name'); const productDescription = document.createElement('span'); productDescription.textContent = local(product, 'description'); item.append(productName, productDescription); list.append(item); });
    companyTree.append(list);
  };
  const render = () => { renderControls(); renderSites(); renderCompany(); };
  countrySelect.addEventListener('change', () => { state.countryId = countrySelect.value; saveState(); render(); });
  companySelect.addEventListener('change', () => { state.companyId = companySelect.value; saveState(); render(); });
  search.addEventListener('input', () => { state.query = search.value; saveState(); renderSites(); });
  categoryTabs.addEventListener('click', (event) => { const button = event.target.closest('[data-category-id]'); if (!button) return; state.categoryId = button.dataset.categoryId; saveState(); render(); });
  root.querySelector('.directory-tabs').addEventListener('click', (event) => { const button = event.target.closest('[data-directory-view]'); if (!button) return; state.view = button.dataset.directoryView; saveState(); render(); });
  window.addEventListener('sitei18nchange', render);
  render();
})();
