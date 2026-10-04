(() => {
  const counters = document.querySelectorAll('[data-goatcounter-count]');
  const trackingScript = document.querySelector('script[data-goatcounter]');
  const endpoint = trackingScript?.dataset.goatcounter?.replace(/\/count\/?$/, '');

  if (!endpoint) return;

  counters.forEach(async (counter) => {
    const path = counter.dataset.goatcounterCount;
    try {
      const response = await fetch(`${endpoint}/counter/${encodeURIComponent(path)}.json`);
      if (!response.ok) throw new Error('Counter request failed');
      const result = await response.json();
      counter.textContent = result.count ?? '—';
      counter.dataset.state = 'ready';
    } catch {
      counter.textContent = '暂不可用';
      counter.dataset.state = 'unavailable';
    }
  });
})();
