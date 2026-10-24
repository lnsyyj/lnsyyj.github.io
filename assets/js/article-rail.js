/* 文章页索引轨：与工具页共用同一套左右轴。
 * 只在正文 h2 达到 3 个以上时才启用——短文章加目录反而是噪音。
 */
(() => {
  const article = document.querySelector('.typora-article');
  if (!article) return;

  const content = article.querySelector('.article-content');
  if (!content) return;

  const headings = Array.from(content.querySelectorAll('h2'))
    .filter((h) => !h.closest('.mermaid') && h.textContent.trim());
  if (headings.length < 3) return;

  const label = (text) => text
    .replace(/^[〇一二三四五六七八九十]+、\s*/, '')
    .replace(/^[0-9]+[.、]\s*/, '')
    .trim();

  headings.forEach((h, i) => { if (!h.id) h.id = 'sec-' + (i + 1); });

  const rail = document.createElement('aside');
  rail.className = 'tool-rail article-rail';
  rail.setAttribute('aria-label', '本文目录');
  rail.innerHTML = '<p class="rail-label">本文</p><ol>'
    + headings.map((h, i) => '<li><a href="#' + h.id + '"'
      + (i === 0 ? ' aria-current="true"' : '') + '>' + label(h.textContent) + '</a></li>').join('')
    + '</ol><a class="rail-back" href="/posts/">← 全部文章</a>';

  /* 把原有内容整体挪进主栏，轨道放左侧 */
  const main = document.createElement('div');
  main.className = 'article-main';
  Array.from(article.children).forEach((child) => main.appendChild(child));
  article.appendChild(rail);
  article.appendChild(main);
  article.classList.add('is-railed');

  if (!('IntersectionObserver' in window)) return;

  const links = Array.from(rail.querySelectorAll('ol a'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = headings.indexOf(entry.target);
      links.forEach((a, i) => a.setAttribute('aria-current', i === index ? 'true' : 'false'));
    });
  }, { rootMargin: '-88px 0px -62% 0px', threshold: 0 });

  headings.forEach((h) => observer.observe(h));
})();
