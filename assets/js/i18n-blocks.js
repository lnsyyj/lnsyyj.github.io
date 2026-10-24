/* 长段落内容的多语言切换。
 * 站点约定：短 UI 文案由 i18n.js 按 data-i18n 键值替换；长段落（工具页说明）
 * 以 zh-CN / en 两份 HTML 同页输出，由本脚本按当前语言显隐，其余语言回退英文。
 */
(() => {
  const FALLBACK = 'en';

  const pick = (block, lang) => {
    const nodes = Array.from(block.children).filter((node) => node.dataset && node.dataset.lang);
    if (!nodes.length) return;
    const exact = nodes.find((node) => node.dataset.lang === lang);
    const fallback = nodes.find((node) => node.dataset.lang === FALLBACK);
    const target = exact || fallback || nodes[0];
    nodes.forEach((node) => { node.hidden = node !== target; });
  };

  const apply = (lang) => {
    document.querySelectorAll('[data-lang-block]').forEach((block) => pick(block, lang));
  };

  const current = () => (window.siteI18n && window.siteI18n.lang)
    || document.documentElement.getAttribute('lang')
    || 'zh-CN';

  apply(current());
  window.addEventListener('sitei18nchange', (event) => apply(event.detail.lang));
})();
