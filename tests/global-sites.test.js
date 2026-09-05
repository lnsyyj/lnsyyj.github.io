const assert = require('node:assert/strict');
const { countries, categories, companies, sites, companyProducts, filterSites, productsForCompany, isSafeUrl } = require('../assets/js/global-sites-data.js');

assert.equal(countries.length, 12);
assert.deepEqual(categories.map((item) => item.id), ['entertainment', 'shopping', 'jobs', 'ai', 'cloud', 'short-video-live', 'social-search']);
const chinaShopping = sites.filter((item) => item.countryIds.includes('china') && item.categoryIds.includes('shopping'));
assert.ok(chinaShopping.length > 0);
assert.equal(chinaShopping.some((item) => /(^|\.)jd\.com|jingdong/i.test(new URL(item.url).hostname)), false);
assert.ok(companies.some((item) => item.id === 'google'));
assert.ok(companyProducts.some((item) => item.companyId === 'google' && item.nameEn === 'YouTube'));
assert.ok(productsForCompany('google').some((item) => item.nameEn === 'YouTube'));
assert.ok(filterSites({ countryId: 'usa', categoryId: 'ai', query: 'chatgpt' }).some((item) => item.nameEn === 'ChatGPT'));
assert.equal(isSafeUrl('https://example.com'), true);
assert.equal(isSafeUrl('javascript:alert(1)'), false);
console.log('Global sites catalog tests passed.');
