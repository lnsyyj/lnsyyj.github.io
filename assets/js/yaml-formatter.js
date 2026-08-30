(() => {
  const root = document.querySelector('[data-yaml-formatter]');
  if (!root) return;

  const input = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const lineNumbers = root.querySelector('.line-numbers');
  const t = (key) => window.siteI18n?.t(key) || key;
  const sample = `site: JiangYu
tool: YAML Formatter
features:
  - 格式化
  - 校验
  - 转为 JSON
private: true`;

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  };
  const updateLines = () => { lineNumbers.textContent = Array.from({ length: input.value.split('\n').length }, (_, i) => i + 1).join('\n'); };

  const parse = () => {
    if (!input.value.trim()) {
      setStatus(t('yamlNeedInput'), true);
      return { ok: false };
    }
    if (!window.jsyaml) {
      setStatus(t('yamlLoaderError'), true);
      return { ok: false };
    }
    try {
      return { ok: true, data: window.jsyaml.load(input.value) };
    } catch (error) {
      const line = error.mark ? `${error.mark.line + 1}: ` : '';
      setStatus(`${t('yamlInvalid')}${line}${error.reason || error.message}`, true);
      return { ok: false };
    }
  };

  const format = () => {
    const result = parse();
    if (!result.ok) return;
    input.value = window.jsyaml.dump(result.data, { indent: 2, lineWidth: -1, noRefs: true }); updateLines();
    setStatus(t('yamlFormatDone'));
  };

  const convertToJson = () => {
    const result = parse();
    if (!result.ok) return;
    input.value = JSON.stringify(result.data, null, 2); updateLines();
    setStatus(t('toJsonDone'));
  };

  root.addEventListener('click', async (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'format') format();
    if (action === 'json') convertToJson();
    if (action === 'sample') { input.value = sample; format(); }
    if (action === 'clear') { input.value = ''; updateLines(); setStatus(t('cleared')); input.focus(); }
    if (action === 'copy') {
      if (!input.value) return setStatus(t('nothingToCopy'), true);
      try { await navigator.clipboard.writeText(input.value); }
      catch (_) { input.select(); document.execCommand('copy'); }
      setStatus(t('copied'));
    }
  });

  input.addEventListener('input', updateLines);
  input.addEventListener('scroll', () => { lineNumbers.scrollTop = input.scrollTop; });
  updateLines();
  input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      format();
    }
  });
})();
