(() => {
  const counters = document.querySelectorAll('[data-goatcounter-count]');
  let attempts = 0;

  const renderCounts = () => {
    if (window.goatcounter && typeof window.goatcounter.visit_count === 'function') {
      counters.forEach((counter) => {
        counter.textContent = '';
        window.goatcounter.visit_count({
          append: `#${counter.id}`,
          path: counter.dataset.goatcounterCount,
          no_branding: true,
          attr: { class: 'goatcounter-number' },
        });
      });
      return true;
    }

    attempts += 1;
    if (attempts >= 60) {
      counters.forEach((counter) => {
        counter.textContent = '暂不可用';
      });
      return true;
    }
    return false;
  };

  if (!renderCounts()) {
    const timer = window.setInterval(() => {
      if (renderCounts()) window.clearInterval(timer);
    }, 100);
  }
})();
