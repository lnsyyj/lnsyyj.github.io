(() => {
  const root = document.querySelector('[data-byte-converter]');
  if (!root) return;

  const units = ['bit', 'byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte', 'exabyte'];
  const inputs = Object.fromEntries(units.map((unit) => [unit, root.querySelector(`[data-byte-unit="${unit}"]`)]));
  const captions = Object.fromEntries(units.map((unit) => [unit, root.querySelector(`[data-byte-caption="${unit}"]`)]));
  const status = root.querySelector('[data-byte-status]');
  const modeButtons = [...root.querySelectorAll('[data-byte-base]')];
  let base = 1024;
  let lastUnit = 'terabyte';
  let updating = false;

  const t = (key) => (window.siteI18n && window.siteI18n.t ? window.siteI18n.t(key) : key);
  const factors = () => Object.fromEntries(units.map((unit, index) => [unit, index === 0 ? 1 / 8 : Math.pow(base, index - 1)]));
  const parseNumber = (value) => Number(String(value).trim().replace(/[\s,]/g, ''));
  const formatNumber = (value) => {
    if (!Number.isFinite(value)) return '';
    if (value !== 0 && (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-8)) return value.toExponential(10).replace(/\.?(0+)e/, 'e');
    return new Intl.NumberFormat(window.siteI18n?.lang || 'en', { maximumSignificantDigits: 12, useGrouping: false }).format(value);
  };
  const renderCaptions = () => {
    captions.bit.textContent = '1 B = 8 bit';
    captions.byte.textContent = '1 B';
    units.slice(2).forEach((unit, index) => { captions[unit].textContent = `1 ${['KB', 'MB', 'GB', 'TB', 'PB', 'EB'][index]} = ${base} ${index === 0 ? 'B' : ['KB', 'MB', 'GB', 'TB', 'PB'][index - 1]}`; });
    status.textContent = base === 1024 ? t('byteBinaryNote') : t('byteDecimalNote');
  };
  const convert = (unit, rawValue) => {
    const value = parseNumber(rawValue);
    if (rawValue.trim() === '') { Object.values(inputs).forEach((input) => { if (input !== inputs[unit]) input.value = ''; }); status.textContent = base === 1024 ? t('byteBinaryNote') : t('byteDecimalNote'); return; }
    if (!Number.isFinite(value) || value < 0) { status.textContent = t('byteInvalid'); status.classList.add('is-error'); return; }
    status.classList.remove('is-error');
    const factorMap = factors();
    const bytes = value * factorMap[unit];
    if (!Number.isFinite(bytes)) { status.textContent = t('byteInvalid'); status.classList.add('is-error'); return; }
    updating = true;
    units.forEach((name) => { if (name !== unit) inputs[name].value = formatNumber(bytes / factorMap[name]); });
    updating = false;
    status.textContent = base === 1024 ? t('byteBinaryNote') : t('byteDecimalNote');
  };

  units.forEach((unit) => inputs[unit].addEventListener('input', () => { if (!updating) { lastUnit = unit; convert(unit, inputs[unit].value); } }));
  modeButtons.forEach((button) => button.addEventListener('click', () => {
    base = Number(button.dataset.byteBase);
    modeButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    renderCaptions();
    if (inputs[lastUnit].value.trim()) convert(lastUnit, inputs[lastUnit].value);
  }));
  root.querySelector('[data-byte-sample]').addEventListener('click', () => { lastUnit = 'terabyte'; inputs.terabyte.value = '1'; convert('terabyte', '1'); });
  root.querySelector('[data-byte-clear]').addEventListener('click', () => { updating = true; Object.values(inputs).forEach((input) => { input.value = ''; }); updating = false; status.classList.remove('is-error'); renderCaptions(); inputs.byte.focus(); });
  window.addEventListener('sitei18nchange', () => { renderCaptions(); });
  renderCaptions();
})();
