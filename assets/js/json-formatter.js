(() => {
  const root = document.querySelector('[data-formatter]');
  if (!root) return;
  const input = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const lineNumbers = root.querySelector('.line-numbers');
  const sample = '{\n  "site": "JiangYu",\n  "tool": "JSON 格式化",\n  "features": ["美化", "校验", "压缩"],\n  "private": true\n}';
  let lastJson;
  let hasLastJson = false;
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('is-error', error); };
  const updateLines = () => { lineNumbers.textContent = Array.from({ length: input.value.split('\n').length }, (_, i) => i + 1).join('\n'); };
  const parseJson = () => {
    if (!input.value.trim()) { setStatus('请先粘贴 JSON 内容。', true); return { ok: false }; }
    try {
      const data = JSON.parse(input.value);
      lastJson = data;
      hasLastJson = true;
      return { ok: true, data };
    }
    catch (error) { setStatus(`JSON 格式有误：${error.message}`, true); return { ok: false }; }
  };
  const jsonForConversion = () => {
    const result = parseJson();
    if (result.ok) return result;
    if (!hasLastJson) return result;
    setStatus('当前内容已被转换，已使用最近一次有效的 JSON。');
    return { ok: true, data: lastJson };
  };
  const transform = (space) => {
    const result = parseJson();
    if (!result.ok) return;
    input.value = JSON.stringify(result.data, null, space); updateLines(); setStatus(space ? '格式化完成。' : '压缩完成。');
  };
  const convertYaml = () => {
    const result = jsonForConversion();
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
    const result = jsonForConversion();
    if (!result.ok) return;
    input.value = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlNode(result.data)}`; updateLines(); setStatus('已转换为 XML。');
  };
  const goName = (value, fallback = 'Field') => {
    const name = String(value).replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^a-zA-Z0-9]+/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join('');
    return (/^[A-Za-z]/.test(name) ? name : fallback) || fallback;
  };
  const singular = (value) => value.endsWith('ies') ? `${value.slice(0, -3)}y` : value.endsWith('s') ? value.slice(0, -1) : value;
  const goType = (value, name, structs) => {
    if (value === null) return 'interface{}';
    if (Array.isArray(value)) return value.length ? `[]${goType(value[0], singular(name), structs)}` : '[]interface{}';
    if (typeof value === 'object') { buildStruct(value, name, structs); return name; }
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float64';
    return 'interface{}';
  };
  const buildStruct = (object, name, structs) => {
    if (structs.some((item) => item.name === name)) return;
    const fields = Object.entries(object).map(([key, value]) => ({ name: goName(key), json: key, type: goType(value, goName(key), structs) }));
    structs.unshift({ name, fields });
  };
  const convertGo = () => {
    const result = parseJson();
    if (!result.ok) return;
    const structs = [];
    const rootType = goType(result.data, 'Root', structs);
    if (!structs.length) return setStatus(`顶层 JSON 必须是对象或数组，当前推断类型为 ${rootType}。`, true);
    input.value = structs.map((item) => `type ${item.name} struct {\n${item.fields.map((field) => `\t${field.name} ${field.type} \`json:"${field.json}"\``).join('\n')}\n}`).join('\n\n');
    updateLines(); setStatus('已转换为 Go 结构体。');
  };
  root.addEventListener('click', async (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'format') transform(2);
    if (action === 'minify') transform(0);
    if (action === 'yaml') convertYaml();
    if (action === 'xml') convertXml();
    if (action === 'go') convertGo();
    if (action === 'clear') { input.value = ''; updateLines(); setStatus('已清空。'); input.focus(); }
    if (action === 'sample') { input.value = sample; transform(2); }
    if (action === 'copy') {
      if (!input.value) return setStatus('没有可复制的内容。', true);
      try { await navigator.clipboard.writeText(input.value); setStatus('已复制到剪贴板。'); }
      catch (_) { input.select(); document.execCommand('copy'); setStatus('已复制到剪贴板。'); }
    }
  });
  input.addEventListener('input', () => { hasLastJson = false; updateLines(); });
  input.addEventListener('scroll', () => { lineNumbers.scrollTop = input.scrollTop; });
  updateLines();
  input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); transform(2); } });
})();
