/* 工具页索引轨：把正文小标题变成左侧目录，并跟随滚动标出当前一节。
 * 无 JS 时页面保持单栏原样，不破坏布局。
 */
(() => {
  const page = document.querySelector('.tool-page');
  if (!page) return;

  const blocksOf = () => Array.from(page.querySelectorAll('[data-lang-block] > [data-lang]'));

  const activeBlock = () => {
    const blocks = blocksOf();
    return blocks.find((b) => !b.hidden && b.querySelector('h2'))
      || blocks.find((b) => b.querySelector('h2'))
      || null;
  };

  /* 1. 建轨道与主栏（只做一次） */
  let rail = page.querySelector('.tool-rail');
  if (!rail) {
    rail = document.createElement('aside');
    rail.className = 'tool-rail';
    rail.setAttribute('aria-label', '本页目录');
    page.insertBefore(rail, page.firstChild);
  }

  if (!page.querySelector('.tool-main')) {
    const main = document.createElement('div');
    main.className = 'tool-main';
    Array.from(page.children).forEach((child) => {
      if (child !== rail) main.appendChild(child);
    });
    page.appendChild(main);
  }

  /* 2. 给当前语言的小标题编号（id 带语言前缀，避免中英两份撞 id） */
  const headings = () => {
    const block = activeBlock();
    if (!block) return [];
    const lang = block.dataset.lang || 'zh';
    return Array.from(block.querySelectorAll('h2')).map((h, i) => {
      if (!h.id) h.id = 'sec-' + lang + '-' + (i + 1);
      return h;
    });
  };

  const label = (text) => text.replace(/^[一二三四五六七八九十]+、\s*/, '').trim();

  /* 3. 滚动跟随 */
  let observer = null;
  const watch = (list) => {
    if (!('IntersectionObserver' in window)) return;
    if (observer) observer.disconnect();
    const links = Array.from(rail.querySelectorAll('ol a'));
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = list.indexOf(entry.target);
        links.forEach((a, i) => a.setAttribute('aria-current', i === index ? 'true' : 'false'));
      });
    }, { rootMargin: '-88px 0px -62% 0px', threshold: 0 });
    list.forEach((h) => observer.observe(h));
  };

  /* 4. 渲染目录 */
  const render = () => {
    const list = headings();
    if (!list.length) return;
    rail.innerHTML = '<p class="rail-label">本页</p><ol>'
      + list.map((h, i) => '<li><a href="#' + h.id + '"'
        + (i === 0 ? ' aria-current="true"' : '') + '>' + label(h.textContent) + '</a></li>').join('')
      + '</ol><a class="rail-back" href="/tools/">← 全部工具</a>';
    page.classList.add('is-railed');
    watch(list);
  };

  render();

  /* 切换语言后正文换成另一份，目录需要重建 */
  window.addEventListener('sitei18nchange', render);
})();
