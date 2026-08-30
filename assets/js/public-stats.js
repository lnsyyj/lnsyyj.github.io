(() => {
  const box = document.querySelector('[data-site-stats]');
  if (!box) return;
  fetch(`${box.dataset.endpoint.replace(/\/$/, '')}/analytics`)
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((data) => {
      const number = new Intl.NumberFormat();
      box.querySelector('strong').textContent = number.format(data.totalPageviews);
      document.querySelectorAll('[data-page-stat]').forEach((node) => {
        const path = new URL(node.closest('a').href).pathname;
        node.textContent = `${number.format(data.pages[path] || 0)} 次浏览`;
      });
    })
    .catch(() => { box.hidden = true; });
})();
