(() => {
  const root = document.querySelector('[data-formatter]');
  if (!root) return;
  const input = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const lineNumbers = root.querySelector('.line-numbers');
  const sample = '{\n  "site": "JiangYu",\n  "tool": "JSON 格式化",\n  "features": ["美化", "校验", "压缩"],\n  "private": true\n}';
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('is-error', error); };
  const updateLines = () => { lineNumbers.textContent = Array.from({ length: input.value.split('\n').length }, (_, i) => i + 1).join('\n'); };
  const parseJson = () => {
    if (!input.value.trim()) { setStatus('请先粘贴 JSON 内容。', true); return { ok: false }; }
    try { return { ok: true, data: JSON.parse(input.value) }; }
    catch (error) { setStatus(`JSON 格式有误：${error.message}`, true); return { ok: false }; }
  };
  const transform = (space) => {
    const result = parseJson();
    if (!result.ok) return;
    input.value = JSON.stringify(result.data, null, space); updateLines(); setStatus(space ? '格式化完成。' : '压缩完成。');
  };
  const convertYaml = () => {
    const result = parseJson();
    if (!result.ok) return;
    if (!window.jsyaml) return setStatus('YAML 转换组件加载失败，请检查网络后重试。', true);
    input.value = window.jsyaml.dump(result.data, { indent: 2, lineWidth: -1, noRefs: true }); updateLines(); setStatus('已转换为 YAML。');
  };
  const escapeXml = (value) => String(value).replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);
  const xmlNode = (value, tag = 'root') => {
    if (Array.isArray(value)) return `<${tag}>${value.map((item) => xmlNode(item, 'item')).join('')}</${tag}>`;
    if (value && typeof value === 'object') return `<${tag}>${Object.entries(value).map(([key, item]) => /^[A-Za-z_][\w.-]*$/.test(key) ? xmlNode(item, key) : `<item key="${escapeXml(key)}">${xmlContent(item)}</item>`).join('')}</${tag}>`;
    return `<${tag}>${escapeXml(value ?? '')}</${tag}>`;
  };
  const xmlContent = (value) => Array.isArray(value) ? value.map((item) => xmlNode(item, 'item')).join('') : value && typeof value === 'object' ? Object.entries(value).map(([key, item]) => /^[A-Za-z_][\w.-]*$/.test(key) ? xmlNode(item, key) : `<item key="${escapeXml(key)}">${xmlContent(item)}</item>`).join('') : escapeXml(value ?? '');
  const convertXml = () => {
    const result = parseJson();
    if (!result.ok) return;
    input.value = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlNode(result.data)}`; updateLines(); setStatus('已转换为 XML。');
  };
  root.addEventListener('click', async (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'format') transform(2);
    if (action === 'minify') transform(0);
    if (action === 'yaml') convertYaml();
    if (action === 'xml') convertXml();
    if (action === 'clear') { input.value = ''; updateLines(); setStatus('已清空。'); input.focus(); }
    if (action === 'sample') { input.value = sample; transform(2); }
    if (action === 'copy') {
      if (!input.value) return setStatus('没有可复制的内容。', true);
      try { await navigator.clipboard.writeText(input.value); setStatus('已复制到剪贴板。'); }
      catch (_) { input.select(); document.execCommand('copy'); setStatus('已复制到剪贴板。'); }
    }
  });
  input.addEventListener('input', updateLines);
  input.addEventListener('scroll', () => { lineNumbers.scrollTop = input.scrollTop; });
  updateLines();
  input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); transform(2); } });
})();
