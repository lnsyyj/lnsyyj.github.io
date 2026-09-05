const assert = require('node:assert/strict');
const fs = require('node:fs');
const directory = require('../assets/js/public-service-phones-data.js');
const controller = fs.readFileSync('assets/js/public-service-phones.js', 'utf8');

assert.match(controller, /sitei18nchange/);
assert.match(controller, /jiangyu-public-service-phones-state/);
assert.match(controller, /navigator\.clipboard/);
assert.match(controller, /textContent/);
assert.match(controller, /noopener noreferrer/);

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
assert.match(index, /tools\/public-service-phones\//);
assert.match(toolsPage, /tools\/public-service-phones\//);

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
const southKoreaRecord = directory.phoneRecords.find((record) => record.id === 'south-korea-emergency-112-119');
assert.ok(southKoreaRecord, 'missing South Korea emergency record');
assert.equal(southKoreaRecord.sourceUrl, 'https://www.police.go.kr/eng/main.do');
for (const record of directory.phoneRecords.filter((record) => record.countryId === 'china' && ['bank', 'insurance'].includes(record.categoryId))) {
  assert.ok(chinaInstitutionHosts[record.id], `missing owned-host mapping: ${record.id}`);
  assert.ok(chinaInstitutionHosts[record.id].includes(new URL(record.sourceUrl).hostname), `unowned source host: ${record.id}`);
}
assert.ok(directory.filterRecords({ countryId: 'china', categoryId: 'bank', query: '95588' }).some((record) => record.phone === '95588'));
assert.equal(directory.toTelHref(' 95588 '), 'tel:95588');
assert.equal(directory.toTelHref('bad<script>'), null);
assert.equal(directory.isSafeUrl('https://'), false);

console.log('Public service phone catalogue tests passed.');
