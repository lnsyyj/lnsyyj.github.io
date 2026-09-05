# International Public Service Phones Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an international public-service phone directory that lets visitors filter verified emergency numbers for 11 countries/regions and Chinese public, bank, and insurance hotlines.

**Architecture:** Keep verified directory data and pure filter/safety helpers in a standalone UMD module shared by the browser and Node tests. A small controller renders only safe DOM text, persists UI filters locally, and re-renders on the site's language-change event; the Markdown page contains the stable shell and script includes.

**Tech Stack:** Jekyll Markdown, vanilla JavaScript, UMD modules, CSS, Node.js assertion tests.

**Spec:** `docs/superpowers/specs/2026-09-05-public-service-phones-design.md`

## Global Constraints

- Cover China, United States, Canada, United Kingdom, France, Germany, Japan, South Korea, Singapore, Australia, and India with emergency records.
- Include China's 110, 119, 120, and 122 emergency services; only China includes public, bank, and insurance records in this release.
- Every record must contain country/region, category, institution, phone, short description, HTTPS official source URL, and a `YYYY-MM-DD` verification date.
- Emergency sources must be official government, police, fire, health, or embassy pages; Chinese bank and insurance sources must be the institution's official site or official service page.
- Use only `emergency`, `public-service`, `bank`, and `insurance` categories; no personal, paid-transfer, non-official, or unverifiable numbers.
- Do not add an international dialing prefix to emergency numbers; retain the local dialing form.
- Render external links in a new tab with `rel="noopener noreferrer"`; render directory strings with DOM `textContent`, not HTML interpolation.
- UI text must support Chinese and English, with the site's other languages falling back to English.
- Store filter state only in the browser. Invalid stored state resets to China and the all-categories view.

---

## File Structure

- `assets/js/public-service-phones-data.js`: UMD catalogue, safe-value helpers, and deterministic filtering API.
- `assets/js/public-service-phones.js`: browser-only state, filtering, accessible result rendering, copy feedback, and language-change handling.
- `tools/public-service-phones.md`: Jekyll page shell, warning, controls, and script loading order.
- `assets/js/i18n.js`: bilingual labels and messages used by the page and controller.
- `assets/css/style.css`: scoped, responsive directory layout and emergency warning styles.
- `index.md` and `tools.md`: new-tab entry cards linking to the directory.
- `tests/public-service-phones.test.js`: Node assertions for catalogue integrity, filtering, and safety helpers.

## Task 1: Build the verified, testable directory catalogue

**Files:**
- Create: `tests/public-service-phones.test.js`
- Create: `assets/js/public-service-phones-data.js`

**Interfaces:**
- Produces `PublicServicePhonesData` in browsers and `module.exports` in Node.
- Exports `{ countries, categories, phoneRecords, filterRecords, isSafePhone, isSafeUrl, toTelHref }`.
- `filterRecords({ countryId, categoryId, query })` returns records in catalogue order matching optional country/category and a case-insensitive match across localized institution names, descriptions, and phone text.
- `isSafePhone(phone)` accepts only `0-9`, spaces, `+`, `-`, `(`, `)`, and `/`; `toTelHref(phone)` returns `tel:` plus a whitespace-free safe phone or `null`.

- [ ] **Step 1: Write the failing catalogue test**

```js
const assert = require('node:assert/strict');
const directory = require('../assets/js/public-service-phones-data.js');

const requiredCountries = ['china', 'united-states', 'canada', 'united-kingdom', 'france', 'germany', 'japan', 'south-korea', 'singapore', 'australia', 'india'];
for (const countryId of requiredCountries) {
  assert.ok(directory.phoneRecords.some((record) => record.countryId === countryId && record.categoryId === 'emergency'));
}
assert.deepEqual(
  directory.phoneRecords.filter((record) => record.countryId === 'china' && record.categoryId === 'emergency').map((record) => record.phone),
  ['110', '119', '120', '122']
);
```

- [ ] **Step 2: Run the test to verify it fails before the module exists**

Run: `node tests/public-service-phones.test.js`

Expected: failure stating that `../assets/js/public-service-phones-data.js` cannot be found.

- [ ] **Step 3: Research every number from primary official sources and record the evidence**

Use browser research only on government, police, fire, health, embassy, or institution-owned HTTPS domains. For each record, preserve the exact official source URL and set `verifiedAt` to the date of this review. Confirm the following coverage before writing the module:

```text
Emergency: China (110, 119, 120, 122), United States, Canada, United Kingdom,
France, Germany, Japan, South Korea, Singapore, Australia, India.
China public service: only official national government/service numbers.
China banks: ICBC, Agricultural Bank of China, Bank of China, China Construction
Bank, Bank of Communications, China Merchants Bank, China CITIC Bank, and China
Everbright Bank, each only when its official source confirms the hotline.
China insurance: PICC, China Life, China Pacific Insurance, Ping An Insurance,
New China Life, and Taikang Insurance, each only when its official source confirms
the hotline.
```

- [ ] **Step 4: Implement the smallest UMD catalogue that satisfies the test**

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PublicServicePhonesData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const countries = [{ id: 'china', nameZh: '中国', nameEn: 'China' }];
  const categories = [{ id: 'emergency', nameZh: '紧急服务', nameEn: 'Emergency' }];
  const phoneRecords = [];
  const isSafePhone = (value) => typeof value === 'string' && /^[0-9+()\\/\\-\\s]+$/.test(value);
  const isSafeUrl = (value) => typeof value === 'string' && /^https:\/\//i.test(value);
  const toTelHref = (value) => isSafePhone(value) ? `tel:${value.replace(/\\s+/g, '')}` : null;
  const filterRecords = ({ countryId = '', categoryId = '', query = '' } = {}) => phoneRecords;
  return { countries, categories, phoneRecords, filterRecords, isSafePhone, isSafeUrl, toTelHref };
});
```

Populate the three constant arrays with the researched records. Every record must use this exact shape:

```js
{
  id: 'china-fire-119', countryId: 'china', categoryId: 'emergency',
  institutionZh: '消防救援', institutionEn: 'Fire and rescue', phone: '119',
  descriptionZh: '火警、火灾救援。', descriptionEn: 'Fire and rescue emergency.',
  sourceUrl: 'https://official.example.invalid/', verifiedAt: '2026-09-05'
}
```

Never use the example URL in the completed data: replace it with the exact verified official source.

- [ ] **Step 5: Expand tests for source integrity, phone safety, filters, and telephone links**

```js
for (const record of directory.phoneRecords) {
  assert.equal(directory.isSafePhone(record.phone), true, record.id);
  assert.equal(directory.isSafeUrl(record.sourceUrl), true, record.id);
  assert.match(record.verifiedAt, /^\\d{4}-\\d{2}-\\d{2}$/);
}
for (const record of directory.phoneRecords.filter((record) => record.countryId === 'china' && ['bank', 'insurance'].includes(record.categoryId))) {
  assert.match(record.sourceUrl, /^https:\/\//, record.id);
}
assert.ok(directory.filterRecords({ countryId: 'china', categoryId: 'bank', query: '95588' }).some((record) => record.phone === '95588'));
assert.equal(directory.toTelHref(' 95588 '), 'tel:95588');
assert.equal(directory.toTelHref('bad<script>'), null);
```

- [ ] **Step 6: Run the catalogue test and syntax check**

Run: `node tests/public-service-phones.test.js; node --check assets/js/public-service-phones-data.js`

Expected: exit code 0.

- [ ] **Step 7: Commit the independently verified data layer**

```bash
git add tests/public-service-phones.test.js assets/js/public-service-phones-data.js
git commit -m "Add verified public service phone directory data"
```

## Task 2: Add the bilingual Jekyll page and site entry points

**Files:**
- Create: `tools/public-service-phones.md`
- Modify: `assets/js/i18n.js`
- Modify: `index.md`
- Modify: `tools.md`

**Interfaces:**
- Consumes `window.PublicServicePhonesData` before loading `assets/js/public-service-phones.js`.
- Page exposes `#public-phone-country`, `#public-phone-categories`, `#public-phone-search`, `#public-phone-results`, and `#public-phone-count` for the controller.
- Adds `publicPhonesCopy` strings under `zh-CN` and `en`, then merges them into the central `values` object used by `sitei18nchange`.

- [ ] **Step 1: Write static-page assertions before adding markup**

Add these checks to `tests/public-service-phones.test.js`:

```js
const fs = require('node:fs');
const page = fs.readFileSync('tools/public-service-phones.md', 'utf8');
const index = fs.readFileSync('index.md', 'utf8');
const toolsPage = fs.readFileSync('tools.md', 'utf8');
assert.match(page, /public-service-phones-data\.js/);
assert.match(page, /public-service-phones\.js/);
assert.match(page, /id="public-phone-results"/);
assert.match(index, /tools\/public-service-phones\//);
assert.match(toolsPage, /tools\/public-service-phones\//);
```

- [ ] **Step 2: Run the test and verify the page assertions fail**

Run: `node tests/public-service-phones.test.js`

Expected: failure because the page and entry links do not yet exist.

- [ ] **Step 3: Add the page shell, translation copy, and new-tab directory links**

Use this script order at the bottom of `tools/public-service-phones.md`:

```html
<script src="{{ '/assets/js/public-service-phones-data.js' | relative_url }}"></script>
<script src="{{ '/assets/js/public-service-phones.js' | relative_url }}"></script>
```

Add an always-visible emergency warning, country `<select>`, category button group, search input, result count, and results `<section>`. Use `data-i18n` only on text-only elements; do not put it on a control wrapper containing inputs. Add one concise card to both `index.md` and `tools.md` with `target="_blank" rel="noopener noreferrer"`.

- [ ] **Step 4: Run the static-page assertions**

Run: `node tests/public-service-phones.test.js; node --check assets/js/i18n.js`

Expected: exit code 0.

- [ ] **Step 5: Commit the page and navigation surface**

```bash
git add tools/public-service-phones.md assets/js/i18n.js index.md tools.md tests/public-service-phones.test.js
git commit -m "Add public service phones page shell"
```

## Task 3: Implement safe filtering, rendering, copy, and persisted UI state

**Files:**
- Create: `assets/js/public-service-phones.js`
- Modify: `tests/public-service-phones.test.js`

**Interfaces:**
- Consumes `window.PublicServicePhonesData` exports and the page IDs from Task 2.
- Reads and writes only `localStorage['jiangyu-public-service-phones-state']` as JSON `{ countryId, categoryId, query }`.
- Listens to `sitei18nchange`, reads `event.detail.lang`, and re-renders labels and record copy without resetting current filters.

- [ ] **Step 1: Write controller-source assertions before implementation**

```js
const controller = fs.readFileSync('assets/js/public-service-phones.js', 'utf8');
assert.match(controller, /sitei18nchange/);
assert.match(controller, /jiangyu-public-service-phones-state/);
assert.match(controller, /navigator\.clipboard/);
assert.match(controller, /textContent/);
assert.match(controller, /noopener noreferrer/);
```

- [ ] **Step 2: Run the test and verify controller assertions fail**

Run: `node tests/public-service-phones.test.js`

Expected: failure because the controller file does not yet exist.

- [ ] **Step 3: Implement the controller with DOM-only rendering**

```js
const state = { countryId: 'china', categoryId: '', query: '' };
const recordNode = document.createElement('article');
const number = document.createElement('strong');
number.textContent = record.phone;
const source = document.createElement('a');
source.href = record.sourceUrl;
source.target = '_blank';
source.rel = 'noopener noreferrer';
```

Validate persisted IDs against `countries` and `categories`; if JSON is malformed or IDs are unknown, use China and all categories. Build the source and direct-call links only after `isSafeUrl` and `toTelHref` pass. Copy only the raw phone string, show transient accessible feedback, and do not upload any search text. On filter input, update state, persist it, and render the matching result list. On `sitei18nchange`, update the active language and render again without changing `state`.

- [ ] **Step 4: Run controller and data verification**

Run: `node tests/public-service-phones.test.js; node --check assets/js/public-service-phones.js; node --check assets/js/public-service-phones-data.js; node --check assets/js/i18n.js`

Expected: exit code 0.

- [ ] **Step 5: Commit the interactive controller**

```bash
git add assets/js/public-service-phones.js tests/public-service-phones.test.js
git commit -m "Add public service phone directory interactions"
```

## Task 4: Style and release the directory

**Files:**
- Modify: `assets/css/style.css`
- Modify: `tests/public-service-phones.test.js`

**Interfaces:**
- Styles only public-service directory selectors prefixed with `.public-phone-`.
- Must preserve one-column readability on small screens and keep emergency notice visible above filters.

- [ ] **Step 1: Write style and page safety assertions**

```js
const css = fs.readFileSync('assets/css/style.css', 'utf8');
assert.match(css, /\.public-phone-/);
assert.match(css, /@media/);
assert.doesNotMatch(page, /http:\/\//);
```

- [ ] **Step 2: Run the test and verify the style assertion fails**

Run: `node tests/public-service-phones.test.js`

Expected: failure because scoped directory styling is not yet present.

- [ ] **Step 3: Add compact, responsive scoped CSS**

```css
.public-phone-warning { border-inline-start: 4px solid var(--accent); }
.public-phone-results { display: grid; gap: 0.9rem; }
@media (min-width: 760px) { .public-phone-results { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

Style category controls, filter controls, cards, number emphasis, action buttons, verification metadata, and the empty state. Keep text legible and controls keyboard-visible without changing existing tool styles.

- [ ] **Step 4: Run all feature checks and repository checks**

Run: `node tests/public-service-phones.test.js; node --check assets/js/public-service-phones-data.js; node --check assets/js/public-service-phones.js; node --check assets/js/i18n.js; git diff --check; git status --short`

Expected: all Node and diff checks exit 0; status contains only the intended feature files.

- [ ] **Step 5: Review every record against its official source before release**

Open each `sourceUrl` from `phoneRecords`; confirm the listed number, owner, and category match the official page. Remove any record that cannot be confirmed. Re-run the Task 4 verification command after any data correction.

- [ ] **Step 6: Commit the release-ready feature**

```bash
git add assets/css/style.css tests/public-service-phones.test.js
git commit -m "Style public service phone directory"
```

- [ ] **Step 7: Push and integrate after final review**

Run the repository's normal feature-branch integration flow, then push the reviewed `main` branch:

```bash
git push origin main
```
