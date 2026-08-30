(() => {
  const root = document.querySelector('[data-yaml-formatter]');
  if (!root) return;

  const input = root.querySelector('textarea');
  const status = root.querySelector('.status');
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

  const parse = () => {
    if (!input.value.trim()) {
      setStatus('请先粘贴 YAML 内容。', true);
      return { ok: false };
    }
    if (!window.jsyaml) {
      setStatus('YAML 解析组件加载失败，请检查网络后重试。', true);
      return { ok: false };
    }
    try {
      return { ok: true, data: window.jsyaml.load(input.value) };
    } catch (error) {
      const line = error.mark ? `第 ${error.mark.line + 1} 行：` : '';
      setStatus(`YAML 格式有误，${line}${error.reason || error.message}`, true);
      return { ok: false };
    }
  };

  const format = () => {
    const result = parse();
    if (!result.ok) return;
    input.value = window.jsyaml.dump(result.data, { indent: 2, lineWidth: -1, noRefs: true });
    setStatus('格式化完成。');
  };

  const convertToJson = () => {
    const result = parse();
    if (!result.ok) return;
    input.value = JSON.stringify(result.data, null, 2);
    setStatus('已转换为 JSON。');
  };

  root.addEventListener('click', async (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'format') format();
    if (action === 'json') convertToJson();
    if (action === 'sample') { input.value = sample; format(); }
    if (action === 'clear') { input.value = ''; setStatus('已清空。'); input.focus(); }
    if (action === 'copy') {
      if (!input.value) return setStatus('没有可复制的内容。', true);
      try { await navigator.clipboard.writeText(input.value); }
      catch (_) { input.select(); document.execCommand('copy'); }
      setStatus('已复制到剪贴板。');
    }
  });

  input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      format();
    }
  });
})();
