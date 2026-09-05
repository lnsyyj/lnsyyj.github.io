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

assert.match(controller, /sitei18nchange/);
assert.match(controller, /jiangyu-public-service-phones-state/);
assert.match(controller, /navigator\.clipboard/);
assert.match(controller, /textContent/);
assert.match(controller, /noopener noreferrer/);
const persistStateSource = controller.match(/function persistState\(\) \{([\s\S]*?)\n  \}/);
assert.ok(persistStateSource, 'missing persistState implementation');
assert.match(persistStateSource[1], /try\s*\{/);
assert.match(persistStateSource[1], /localStorage\.setItem\(storageKey, JSON\.stringify\(state\)\)/);
assert.match(persistStateSource[1], /catch\s*\{/);
assert.match(controller, /function updateAriaLabels\(\)/);
assert.match(controller, /categoryContainer\.setAttribute\('aria-label', text\('categoriesAria'\)\)/);
assert.match(controller, /resultsNode\.setAttribute\('aria-label', text\('resultsAria'\)\)/);
assert.match(controller, /function render\(\) \{\s*updateAriaLabels\(\);/);

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

console.log('Public service phone catalogue tests passed.');
