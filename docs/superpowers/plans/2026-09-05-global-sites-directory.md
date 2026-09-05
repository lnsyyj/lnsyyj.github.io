# Global Sites Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, internationalized directory for browsing selected popular websites by country/category and products by parent company.

**Architecture:** A UMD data module owns all catalog records and pure query helpers. A separate browser controller renders two local-filtered views and saves only UI choices in `localStorage`. The Jekyll page contains stable DOM hooks and loads the data module before the controller.

**Tech Stack:** Jekyll Markdown, vanilla JavaScript, browser `localStorage`, existing `sitei18n` event, CSS Grid, Node.js built-in `assert`.

**Spec:** `docs/superpowers/specs/2026-09-05-global-sites-directory-design.md`

## Global Constraints

- Initial coverage is China, United States, Japan, South Korea, United Kingdom, France, Germany, Singapore, India, Canada, and Australia.
- Categories are entertainment, shopping, jobs, AI, cloud computing, short video/live, and social/search.
- China shopping records never contain a JD/Jingdong domain.
- Records use publicly accessible official sites only; all external links use `target="_blank" rel="noopener noreferrer"`.
- Filtering is local, with no API, accounts, rankings, or server-side storage.
- New labels are Chinese/English; other enabled languages fall back to English.

---

## File Structure

- Create `assets/js/global-sites-data.js`: UMD catalog records and pure data helpers.
- Create `assets/js/global-sites.js`: UI state, filtering, rendering, and language-change behavior.
- Create `tools/global-sites.md`: tool markup and script wiring.
- Create `tests/global-sites.test.js`: Node assertions for catalog constraints and helpers.
- Modify `assets/js/i18n.js`, `assets/css/style.css`, `index.md`, and `tools.md`.

### Task 1: Create and test the catalog module

**Files:** Create `tests/global-sites.test.js`, `assets/js/global-sites-data.js`.

**Interfaces:** Export `countries`, `categories`, `companies`, `sites`, `companyProducts`, `filterSites({ countryId, categoryId, query })`, `productsForCompany(companyId)`, and `isSafeUrl(url)`. The browser receives the same API as `window.GlobalSitesData`.

- [ ] Write `tests/global-sites.test.js` first. Assert exactly 12 country records; all seven category IDs; at least one China shopping site; no China shopping URL matching `jd.com` or `jingdong`; Google has YouTube; `filterSites({ countryId: 'usa', categoryId: 'ai', query: 'chatgpt' })` returns ChatGPT; and `isSafeUrl('javascript:alert(1)')` is false.
- [ ] Run `node tests/global-sites.test.js`; expect `MODULE_NOT_FOUND` because the catalog does not exist.
- [ ] Implement a UMD module. Site records contain `id`, `countryIds`, `categoryIds`, `nameZh`, `nameEn`, `descriptionZh`, `descriptionEn`, `url`, and optional `companyId`. Products contain `companyId`, bilingual names/descriptions, URL, and optional parent name. Include Google, Meta, Microsoft, Amazon, ByteDance, Alibaba, and Tencent.
- [ ] Implement `filterSites` to apply country, category, and lowercase bilingual keyword matching in catalog order. Implement `productsForCompany` with an exact company ID filter. Make `isSafeUrl` accept only `https:` URLs via `new URL` in a `try/catch`.
- [ ] Run `node tests/global-sites.test.js`; expect `Global sites catalog tests passed.`
- [ ] Commit with `git add tests/global-sites.test.js assets/js/global-sites-data.js` and `git commit -m "Add global sites catalog data"`.

### Task 2: Add page markup and translation copy

**Files:** Create `tools/global-sites.md`; modify `assets/js/i18n.js`.

**Interfaces:** The page exposes `[data-global-sites]`, `[data-country-select]`, `[data-category-tabs]`, `[data-sites-results]`, `[data-company-select]`, and `[data-company-tree]`. The page loads `global-sites-data.js` before `global-sites.js`.

- [ ] Write a failing PowerShell wiring check that loads `tools/global-sites.md` and throws unless all six DOM hooks plus `global-sites-data.js` and `global-sites.js` exist; also throw unless `assets/js/i18n.js` contains `globalSitesCopy`.
- [ ] Run the check; expect it to fail because the page and copy are absent.
- [ ] Create `tools/global-sites.md` with `permalink: /tools/global-sites/`, two tab buttons (“By country” and “By company”), country/category/search controls, company selection, no-results status, catalog disclaimer, and scripts in the required load order.
- [ ] Add `globalSitesCopy` to `assets/js/i18n.js` for Chinese/English controls, tabs, empty/error states, catalog disclaimer, and filter labels. Merge `...globalSitesCopy.en, ...(globalSitesCopy[lang] || {})` into `values`.
- [ ] Run the wiring check; expect no errors. Commit with `git add tools/global-sites.md assets/js/i18n.js` and `git commit -m "Add global sites directory page"`.

### Task 3: Implement interactions and responsive presentation

**Files:** Create `assets/js/global-sites.js`; modify `assets/css/style.css`.

**Interfaces:** Save `{ countryId, categoryId, query, companyId, view }` under `globalSitesDirectoryState`. Consume `GlobalSitesData.filterSites`, `productsForCompany`, and `isSafeUrl`.

- [ ] Write a failing PowerShell check that requires `assets/js/global-sites.js` and checks it contains `globalSitesDirectoryState`, `filterSites`, `productsForCompany`, `sitei18nchange`, and `noopener noreferrer`.
- [ ] Run the check; expect `Controller is missing`.
- [ ] Implement safe state restore with a default `{ countryId: 'china', categoryId: 'all', query: '', companyId: 'google', view: 'country' }`; malformed storage must fall back without breaking the page.
- [ ] Render controls and tabs from data records. Render websites using DOM APIs and `textContent`, creating anchors only when `isSafeUrl(url)` returns true. Render a one-level company/product tree and a clear no-results state. Rerender after `sitei18nchange` without changing selections.
- [ ] Append CSS for compact selectors, visible active category tabs, a two-to-three-column card grid, company tree, and one-column mobile layout below 700px. Do not hide content behind hover-only behavior.
- [ ] Run the controller check, `node --check assets/js/global-sites.js`, and `node tests/global-sites.test.js`; expect all to pass. Commit with `git add assets/js/global-sites.js assets/css/style.css` and `git commit -m "Add global sites directory interactions"`.

### Task 4: Link, verify, and publish

**Files:** Modify `index.md`, `tools.md`; verify all files from Tasks 1–3.

- [ ] Write a failing navigation check that throws unless both `index.md` and `tools.md` contain `/tools/global-sites/`.
- [ ] Run the check; expect `Global sites navigation is missing`.
- [ ] Add `home-tool` and `tool-card` entries using the new URL, `target="_blank"`, `rel="noopener noreferrer"`, `data-i18n="globalSitesName"`, and `data-i18n="globalSitesCard"`.
- [ ] Run `node tests/global-sites.test.js`, `node --check assets/js/global-sites-data.js`, `node --check assets/js/global-sites.js`, `node --check assets/js/i18n.js`, `git diff --check`, the page-wiring check, and the navigation check. All commands must exit 0.
- [ ] Commit navigation with `git add index.md tools.md` and `git commit -m "Link global sites directory"`; then run `git push origin main`.
