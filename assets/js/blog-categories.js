(() => {
  const browsers = document.querySelectorAll('[data-blog-browser]');
  if (!browsers.length) return;

  const fallbackText = {
    categoryAll: 'All articles',
    categoryAllTopics: 'All topics',
    categoryParents: 'Main categories',
    categorySubcategories: 'Topics',
    categoryResults: 'Showing {count} of {total} articles',
    categoryNoResults: 'No articles in this category.'
  };
  const t = (key) => window.siteI18n?.t(key) || fallbackText[key] || key;

  browsers.forEach((browser) => {
    const cards = [...browser.querySelectorAll('[data-post-card]')];
    const parentFilters = browser.querySelector('[data-category-parents]');
    const childFilters = browser.querySelector('[data-category-children]');
    const countLabel = browser.querySelector('[data-post-count]');
    const emptyState = browser.querySelector('[data-no-posts]');
    const emptyMessage = browser.querySelector('[data-category-empty-message]');
    if (!parentFilters || !childFilters || !countLabel || !emptyState || !emptyMessage) return;

    const parents = [...new Set(cards.map((card) => card.dataset.categoryParent).filter(Boolean))];
    const childrenByParent = new Map();
    cards.forEach((card) => {
      const parent = card.dataset.categoryParent;
      const child = card.dataset.categoryChild;
      if (!parent || !child) return;
      if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
      const children = childrenByParent.get(parent);
      if (!children.includes(child)) children.push(child);
    });

    let activeParent = '';
    let activeChild = '';

    const makeButton = (label, selected, onClick) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-filter-button';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', onClick);
      return button;
    };

    const render = () => {
      parentFilters.setAttribute('aria-label', t('categoryParents'));
      childFilters.setAttribute('aria-label', t('categorySubcategories'));
      parentFilters.replaceChildren();
      childFilters.replaceChildren();

      parentFilters.append(makeButton(t('categoryAll'), !activeParent, () => {
        activeParent = '';
        activeChild = '';
        render();
      }));

      parents.forEach((parent) => {
        parentFilters.append(makeButton(parent, activeParent === parent, () => {
          activeParent = parent;
          activeChild = '';
          render();
        }));
      });

      const children = childrenByParent.get(activeParent) || [];
      childFilters.hidden = !activeParent || children.length === 0;
      if (activeParent && children.length > 0) {
        childFilters.append(makeButton(t('categoryAllTopics'), !activeChild, () => {
          activeChild = '';
          render();
        }));
        children.forEach((child) => {
          childFilters.append(makeButton(child, activeChild === child, () => {
            activeChild = child;
            render();
          }));
        });
      }

      let visibleCount = 0;
      cards.forEach((card) => {
        const matches = (!activeParent || card.dataset.categoryParent === activeParent)
          && (!activeChild || card.dataset.categoryChild === activeChild);
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      });

      countLabel.textContent = t('categoryResults')
        .replace('{count}', String(visibleCount))
        .replace('{total}', String(cards.length));
      emptyMessage.textContent = t('categoryNoResults');
      emptyState.hidden = visibleCount > 0;
    };

    render();
    window.addEventListener('sitei18nchange', render);
  });
})();
