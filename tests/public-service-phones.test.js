const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const directory = require('../assets/js/public-service-phones-data.js');
const controller = fs.readFileSync('assets/js/public-service-phones.js', 'utf8');
const i18nSource = fs.readFileSync('assets/js/i18n.js', 'utf8');

function translationsFor(language) {
  const window = { dispatchEvent() {} };
  vm.runInNewContext(i18nSource, {
    window,
    document: {
      documentElement: { lang: '', dir: '' },
      querySelectorAll: () => []
    },
    location: { search: `?lang=${language}`, href: `https://example.test/?lang=${language}` },
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { language },
    URL,
    URLSearchParams,
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options && options.detail;
      }
    },
    Option: class Option {}
  });
  return window.siteI18n;
}

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatchEvent(event) {
    if (!event || !event.type) throw new TypeError('Fake events need a type.');
    if (!event.target) event.target = this;
    for (const listener of this.listeners.get(event.type) || []) listener.call(this, event);
    return true;
  }
}

class FakeNode extends FakeEventTarget {
  constructor(nodeType) {
    super();
    this.nodeType = nodeType;
    this.parentNode = null;
    this.childNodes = [];
  }

  append(...nodes) {
    for (const candidate of nodes) {
      const node = typeof candidate === 'string' ? new FakeText(candidate) : candidate;
      if (node.nodeType === 11) {
        this.append(...node.childNodes.slice());
        node.replaceChildren();
        continue;
      }
      if (node.parentNode) node.remove();
      node.parentNode = this;
      this.childNodes.push(node);
      if (this.tagName === 'SELECT' && node.tagName === 'OPTION' && node.selected) this._value = node.value;
    }
  }

  prepend(...nodes) {
    const existing = this.childNodes.slice();
    this.replaceChildren(...nodes, ...existing);
  }

  replaceChildren(...nodes) {
    for (const child of this.childNodes) child.parentNode = null;
    this.childNodes = [];
    if (this.tagName === 'SELECT') this._value = '';
    this.append(...nodes);
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.childNodes.indexOf(this);
    if (index >= 0) this.parentNode.childNodes.splice(index, 1);
    this.parentNode = null;
  }

  get children() {
    return this.childNodes.filter((node) => node.nodeType === 1);
  }

  get textContent() {
    return this.childNodes.map((node) => node.textContent).join('');
  }

  set textContent(value) {
    this.replaceChildren(new FakeText(value));
  }
}

class FakeText extends FakeNode {
  constructor(value) {
    super(3);
    this.data = String(value);
  }

  get textContent() {
    return this.data;
  }

  set textContent(value) {
    this.data = String(value);
  }
}

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  tokens() {
    return this.element.className.split(/\s+/).filter(Boolean);
  }

  contains(token) {
    return this.tokens().includes(token);
  }

  add(...tokens) {
    this.element.className = [...new Set([...this.tokens(), ...tokens])].join(' ');
  }

  remove(...tokens) {
    this.element.className = this.tokens().filter((token) => !tokens.includes(token)).join(' ');
  }

  toggle(token, force) {
    const shouldAdd = force === undefined ? !this.contains(token) : Boolean(force);
    if (shouldAdd) this.add(token);
    else this.remove(token);
    return shouldAdd;
  }
}

class FakeElement extends FakeNode {
  constructor(tagName) {
    super(1);
    this.tagName = tagName.toUpperCase();
    this.attributes = new Map();
    this.classList = new FakeClassList(this);
    this._value = '';
    this.selected = false;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  get className() {
    return this.getAttribute('class') || '';
  }

  set className(value) {
    this.setAttribute('class', value);
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = String(value);
    if (this.tagName === 'SELECT') {
      for (const option of this.children) option.selected = option.value === this._value;
    }
  }
}

for (const reflectedProperty of ['href', 'target', 'rel', 'type']) {
  Object.defineProperty(FakeElement.prototype, reflectedProperty, {
    get() {
      return this.getAttribute(reflectedProperty) || '';
    },
    set(value) {
      this.setAttribute(reflectedProperty, value);
    }
  });
}

class FakeDocumentFragment extends FakeNode {
  constructor() {
    super(11);
  }
}

function createControllerHarness({ language = 'en', throwOnSetItem = false } = {}) {
  const elements = {
    'public-phone-country': new FakeElement('select'),
    'public-phone-categories': new FakeElement('div'),
    'public-phone-search': new FakeElement('input'),
    'public-phone-count': new FakeElement('p'),
    'public-phone-results': new FakeElement('div')
  };
  const document = {
    documentElement: { lang: language, dir: '' },
    getElementById: (id) => elements[id] || null,
    createElement: (tagName) => new FakeElement(tagName),
    createDocumentFragment: () => new FakeDocumentFragment()
  };
  const storedValues = new Map();
  let storageWriteAttempts = 0;
  const localStorage = {
    getItem: (key) => storedValues.has(key) ? storedValues.get(key) : null,
    setItem(key, value) {
      storageWriteAttempts += 1;
      if (throwOnSetItem) throw new Error('storage unavailable');
      storedValues.set(key, String(value));
    }
  };
  const window = new FakeEventTarget();
  window.PublicServicePhonesData = directory;
  window.setTimeout = () => 0;

  vm.runInNewContext(controller, {
    window,
    document,
    localStorage,
    navigator: {},
    console
  });

  return {
    window,
    document,
    countrySelect: elements['public-phone-country'],
    categoryContainer: elements['public-phone-categories'],
    searchInput: elements['public-phone-search'],
    countNode: elements['public-phone-count'],
    resultsNode: elements['public-phone-results'],
    get storageWriteAttempts() {
      return storageWriteAttempts;
    }
  };
}

function findElements(root, predicate) {
  const matches = [];
  if (root.nodeType === 1 && predicate(root)) matches.push(root);
  for (const child of root.childNodes) matches.push(...findElements(child, predicate));
  return matches;
}

function findButtonByText(container, label) {
  return findElements(container, (element) => element.tagName === 'BUTTON' && element.textContent === label)[0];
}

const page = fs.readFileSync('tools/public-service-phones.md', 'utf8');
const css = fs.readFileSync('assets/css/style.css', 'utf8');
const index = fs.readFileSync('index.md', 'utf8');
const toolsPage = fs.readFileSync('tools.md', 'utf8');
assert.match(css, /\.public-phone-/);
assert.match(css, /@media/);
assert.doesNotMatch(page, /http:\/\//);
assert.match(page, /public-service-phones-data\.js/);
assert.match(page, /public-service-phones\.js/);
assert.match(page, /id="public-phone-results"/);
assert.match(page, /data-i18n="publicPhonesEmergencyWarning"/);
assert.match(page, /data-i18n="publicPhonesSupportingNote"/);
assert.doesNotMatch(page, /id="public-phone-categories"[^>]*data-i18n/);
assert.doesNotMatch(page, /id="public-phone-results"[^>]*data-i18n/);
assert.match(index, /tools\/public-service-phones\//);
assert.match(toolsPage, /tools\/public-service-phones\//);

const expectedCopy = {
  'zh-CN': {
    warning: '生命或财产受到威胁时，请立即拨打当地紧急服务电话；不要依赖本页面加载、搜索或翻译。',
    supporting: '号码可能因地区、服务和时间而变化；重要情况请通过官方来源确认。搜索和筛选仅在浏览器本地处理，不会上传。'
  },
  en: {
    warning: 'If life or property is in danger, call local emergency services immediately. Do not depend on this page loading, searching, or translation.',
    supporting: 'Numbers can vary by location, service, and time. For critical cases, confirm the number through the official source. Searches and filters are processed locally in your browser and are not uploaded.'
  }
};
for (const language of ['zh-CN', 'en']) {
  const i18n = translationsFor(language);
  assert.equal(i18n.t('publicPhonesEmergencyWarning'), expectedCopy[language].warning);
  assert.equal(i18n.t('publicPhonesSupportingNote'), expectedCopy[language].supporting);
}
const frenchI18n = translationsFor('fr');
assert.equal(frenchI18n.t('publicPhonesEmergencyWarning'), expectedCopy.en.warning);
assert.equal(frenchI18n.t('publicPhonesSupportingNote'), expectedCopy.en.supporting);

const requiredCountries = ['china', 'united-states', 'canada', 'united-kingdom', 'france', 'germany', 'japan', 'south-korea', 'singapore', 'australia', 'india'];
for (const countryId of requiredCountries) {
  assert.ok(directory.phoneRecords.some((record) => record.countryId === countryId && record.categoryId === 'emergency'));
}
assert.deepEqual(
  directory.phoneRecords.filter((record) => record.countryId === 'china' && record.categoryId === 'emergency').map((record) => record.phone),
  ['110', '119', '120', '122']
);
for (const record of directory.phoneRecords.filter((record) => record.countryId === 'china' && record.categoryId === 'emergency')) {
  assert.equal(record.sourceUrl, 'https://www.enghunan.gov.cn/hneng/Services/QuickLinks/EmergencyContacts/202503/t20250320_1813835.html');
}

for (const record of directory.phoneRecords) {
  assert.equal(directory.isSafePhone(record.phone), true, record.id);
  assert.equal(directory.isSafeUrl(record.sourceUrl), true, record.id);
  assert.match(record.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.doesNotMatch(record.phone, /\//, `${record.id} must display one phone number`);
  assert.match(directory.toTelHref(record.phone) || '', /^tel:[0-9+()-]+$/, `${record.id} must have one dialable tel URI`);
}
assert.equal(directory.toTelHref('999 / 112'), null);

const expectedSplitEmergencies = {
  'united-kingdom': [
    { phone: '999', institutionZh: '紧急服务', institutionEn: 'Emergency services', descriptionZh: '英国全国紧急服务号码。', descriptionEn: 'UK national emergency services number.' },
    { phone: '112', institutionZh: '紧急服务', institutionEn: 'Emergency services', descriptionZh: '在英国可接通与 999 相同的紧急服务。', descriptionEn: 'Connects to the same UK emergency services as 999.' }
  ],
  germany: [
    { phone: '110', institutionZh: '警察', institutionEn: 'Police', descriptionZh: '警方紧急电话。', descriptionEn: 'Police emergency number.' },
    { phone: '112', institutionZh: '消防与急救', institutionEn: 'Fire and medical emergency', descriptionZh: '消防和医疗急救电话。', descriptionEn: 'Fire and medical emergency number.' }
  ],
  japan: [
    { phone: '110', institutionZh: '警察', institutionEn: 'Police', descriptionZh: '警方紧急电话。', descriptionEn: 'Police emergency number.' },
    { phone: '119', institutionZh: '消防与救护', institutionEn: 'Fire and ambulance', descriptionZh: '消防和救护车紧急电话。', descriptionEn: 'Fire and ambulance emergency number.' }
  ],
  'south-korea': [
    { phone: '112', institutionZh: '警察', institutionEn: 'Police', descriptionZh: '警方紧急电话。', descriptionEn: 'Police emergency number.' },
    { phone: '119', institutionZh: '消防与急救', institutionEn: 'Fire and medical emergency', descriptionZh: '消防和医疗急救电话。', descriptionEn: 'Fire and medical emergency number.' }
  ],
  singapore: [
    { phone: '999', institutionZh: '警察', institutionEn: 'Police', descriptionZh: '警方紧急电话。', descriptionEn: 'Police emergency number.' },
    { phone: '995', institutionZh: '消防与救护', institutionEn: 'Fire and ambulance', descriptionZh: '消防和救护车紧急电话。', descriptionEn: 'Fire and ambulance emergency number.' }
  ]
};
for (const [countryId, expectedRecords] of Object.entries(expectedSplitEmergencies)) {
  const records = directory.phoneRecords
    .filter((record) => record.countryId === countryId && record.categoryId === 'emergency')
    .map(({ phone, institutionZh, institutionEn, descriptionZh, descriptionEn }) => ({ phone, institutionZh, institutionEn, descriptionZh, descriptionEn }));
  assert.deepEqual(records, expectedRecords, `${countryId} emergency records must be split by phone and purpose`);
}
const chinaInstitutionHosts = {
  'china-icbc-95588': ['icbc.com.cn', 'www.icbc.com.cn'],
  'china-abc-95599': ['abchina.com', 'www.abchina.com'],
  'china-boc-95566': ['95566.boc.cn'],
  'china-ccb-95533': ['login3.ccb.com'],
  'china-bocom-95559': ['bankcomm.com', 'www.bankcomm.com'],
  'china-cmb-95555': ['cmbchina.com', 'www.cmbchina.com'],
  'china-citic-95558': ['citicbank.com', 'www.citicbank.com'],
  'china-ceb-95595': ['xykimg.cebbank.com'],
  'china-picc-95518': ['property.picc.com'],
  'china-life-95519': ['e-chinalife.com', 'www.e-chinalife.com'],
  'china-cpic-95500': ['life.cpic.com.cn'],
  'china-ping-an-95511': ['pingan.com', 'www.pingan.com'],
  'china-new-china-life-95567': ['newchinalife.com', 'www.newchinalife.com'],
  'china-taikang-95522': ['taikang.com', 'www.taikang.com']
};
const piccRecord = directory.phoneRecords.find((record) => record.id === 'china-picc-95518');
assert.ok(piccRecord, 'missing PICC 95518 record');
assert.equal(piccRecord.phone, '95518');
assert.equal(new URL(piccRecord.sourceUrl).hostname, 'property.picc.com');
for (const southKoreaRecord of directory.phoneRecords.filter((record) => record.countryId === 'south-korea' && record.categoryId === 'emergency')) {
  assert.equal(southKoreaRecord.sourceUrl, 'https://www.police.go.kr/eng/main.do');
}
const taikangRecord = directory.phoneRecords.find((record) => record.id === 'china-taikang-95522');
assert.ok(taikangRecord, 'missing Taikang 95522 record');
assert.equal(taikangRecord.sourceUrl, 'https://www.taikang.com/');
const australiaRecord = directory.phoneRecords.find((record) => record.id === 'australia-emergency-000');
assert.ok(australiaRecord, 'missing Australia 000 record');
assert.match(australiaRecord.descriptionZh, /(?:三个零|Triple Zero)[（(]000[）)]/);
assert.doesNotMatch(australiaRecord.descriptionZh, /三零零/);
for (const record of directory.phoneRecords.filter((record) => record.countryId === 'china' && ['bank', 'insurance'].includes(record.categoryId))) {
  assert.ok(chinaInstitutionHosts[record.id], `missing owned-host mapping: ${record.id}`);
  assert.ok(chinaInstitutionHosts[record.id].includes(new URL(record.sourceUrl).hostname), `unowned source host: ${record.id}`);
}
assert.ok(directory.filterRecords({ countryId: 'china', categoryId: 'bank', query: '95588' }).some((record) => record.phone === '95588'));
assert.equal(directory.toTelHref(' 95588 '), 'tel:95588');
assert.equal(directory.toTelHref('bad<script>'), null);
assert.equal(directory.isSafeUrl('https://'), false);

function testStorageFailuresDoNotBlockRendering() {
  const countryApp = createControllerHarness({ language: 'en', throwOnSetItem: true });
  const countryWritesBeforeChange = countryApp.storageWriteAttempts;
  countryApp.countrySelect.value = 'united-states';
  countryApp.countrySelect.dispatchEvent({ type: 'change' });
  assert.equal(countryApp.storageWriteAttempts, countryWritesBeforeChange + 1, 'country change should attempt one persistence write');
  assert.equal(countryApp.countNode.textContent, '1 results', 'country change should render after storage failure');
  assert.match(countryApp.resultsNode.textContent, /911/, 'country results should be visible after storage failure');

  const categoryApp = createControllerHarness({ language: 'en', throwOnSetItem: true });
  const bankButton = findButtonByText(categoryApp.categoryContainer, 'Bank');
  assert.ok(bankButton, 'missing rendered Bank category');
  const categoryWritesBeforeClick = categoryApp.storageWriteAttempts;
  bankButton.dispatchEvent({ type: 'click' });
  assert.equal(categoryApp.storageWriteAttempts, categoryWritesBeforeClick + 1, 'category click should attempt one persistence write');
  assert.equal(categoryApp.countNode.textContent, '8 results', 'category click should render after storage failure');
  assert.match(categoryApp.resultsNode.textContent, /95588/, 'category results should be visible after storage failure');
  assert.doesNotMatch(categoryApp.resultsNode.textContent, /95518/, 'bank category results should exclude the English insurance number');

  const searchApp = createControllerHarness({ language: 'en', throwOnSetItem: true });
  const searchWritesBeforeInput = searchApp.storageWriteAttempts;
  searchApp.searchInput.value = '95588';
  searchApp.searchInput.dispatchEvent({ type: 'input' });
  assert.equal(searchApp.storageWriteAttempts, searchWritesBeforeInput + 1, 'search input should attempt one persistence write');
  assert.equal(searchApp.countNode.textContent, '1 results', 'search input should render after storage failure');
  assert.match(searchApp.resultsNode.textContent, /95588/, 'search result should be visible after storage failure');
  assert.doesNotMatch(searchApp.resultsNode.textContent, /95599/, 'search should hide non-matching records');
}

function testLanguageChangeUpdatesAriaWithoutResettingFilters() {
  const app = createControllerHarness({ language: 'zh-CN' });
  assert.equal(app.categoryContainer.getAttribute('aria-label'), '公共服务电话类别');
  assert.equal(app.resultsNode.getAttribute('aria-label'), '公共服务电话结果');
  app.countrySelect.value = 'united-states';
  app.countrySelect.dispatchEvent({ type: 'change' });
  const emergencyButton = findButtonByText(app.categoryContainer, '紧急服务');
  assert.ok(emergencyButton, 'missing rendered emergency category');
  emergencyButton.dispatchEvent({ type: 'click' });
  app.searchInput.value = '911';
  app.searchInput.dispatchEvent({ type: 'input' });

  app.window.dispatchEvent({ type: 'sitei18nchange', detail: { lang: 'en' } });

  assert.equal(app.categoryContainer.getAttribute('aria-label'), 'Public service phone categories');
  assert.equal(app.resultsNode.getAttribute('aria-label'), 'Public service phone results');
  assert.equal(app.countrySelect.value, 'united-states', 'language change should retain country');
  assert.equal(app.searchInput.value, '911', 'language change should retain query');
  const selectedCategory = findButtonByText(app.categoryContainer, 'Emergency');
  assert.ok(selectedCategory, 'categories should be rerendered in English');
  assert.equal(selectedCategory.getAttribute('aria-pressed'), 'true', 'language change should retain category');
  assert.equal(app.countNode.textContent, '1 results');
  assert.match(app.resultsNode.textContent, /Emergency services/);
  assert.match(app.resultsNode.textContent, /911/);
}

function testRenderedSourcesAndRecordTextAreSafe() {
  const injectedRecord = {
    id: 'controller-test-injection',
    countryId: 'china',
    categoryId: 'emergency',
    institutionZh: '测试机构',
    institutionEn: '<img src=x onerror=attack()>',
    phone: '<svg onload=attack()>',
    descriptionZh: '测试说明',
    descriptionEn: '<script>attack()</script>',
    sourceUrl: 'https://example.test/source',
    verifiedAt: '<b>never</b>'
  };
  directory.phoneRecords.unshift(injectedRecord);
  try {
    const app = createControllerHarness({ language: 'en' });
    const articles = findElements(app.resultsNode, (element) => element.tagName === 'ARTICLE');
    const injectedArticle = articles.find((article) => article.textContent.includes(injectedRecord.institutionEn));
    assert.ok(injectedArticle, 'injected record should render as visible text');

    const expectedTextByTag = new Map([
      ['H2', injectedRecord.institutionEn],
      ['STRONG', injectedRecord.phone],
      ['SMALL', `Verified: ${injectedRecord.verifiedAt}`]
    ]);
    for (const [tagName, expectedText] of expectedTextByTag) {
      const element = injectedArticle.children.find((child) => child.tagName === tagName);
      assert.ok(element, `missing ${tagName} record field`);
      assert.equal(element.childNodes.length, 1, `${tagName} record field should contain one text node`);
      assert.equal(element.childNodes[0].nodeType, 3, `${tagName} record field must render as text`);
      assert.equal(element.childNodes[0].textContent, expectedText);
    }
    const description = injectedArticle.children.find((child) => child.tagName === 'P'
      && child.textContent === injectedRecord.descriptionEn);
    assert.ok(description, 'missing description record field');
    assert.equal(description.childNodes.length, 1, 'description should contain one text node');
    assert.equal(description.childNodes[0].nodeType, 3, 'description must render as text');
    assert.equal(description.childNodes[0].textContent, injectedRecord.descriptionEn);
    assert.equal(findElements(injectedArticle, (element) => ['IMG', 'SCRIPT', 'SVG', 'B'].includes(element.tagName)).length, 0);

    const sourceAnchors = findElements(app.resultsNode, (element) => element.tagName === 'A'
      && element.href.startsWith('https://'));
    assert.ok(sourceAnchors.length > 0, 'expected rendered source anchors');
    for (const source of sourceAnchors) {
      assert.equal(source.target, '_blank');
      assert.equal(source.rel, 'noopener noreferrer');
    }
  } finally {
    const index = directory.phoneRecords.indexOf(injectedRecord);
    if (index >= 0) directory.phoneRecords.splice(index, 1);
  }
}

testStorageFailuresDoNotBlockRendering();
testLanguageChangeUpdatesAriaWithoutResettingFilters();
testRenderedSourcesAndRecordTextAreSafe();

console.log('Public service phone catalogue tests passed.');
