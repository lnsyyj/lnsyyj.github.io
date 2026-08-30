(() => {
  const root = document.querySelector('[data-formatter]');
  if (!root) return;
  const input = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const lineNumbers = root.querySelector('.line-numbers');
  const sample = '{\n  "string_example": "Hello, World!",\n  "number_integer": 42,\n  "number_float": 3.14159,\n  "boolean_true": true,\n  "boolean_false": false,\n  "null_example": null,\n  "object_example": {\n    "nested_key": "嵌套对象的值",\n    "id": 101\n  },\n  "array_strings": ["苹果", "香蕉", "橙子"],\n  "array_numbers": [1, 2, 3],\n  "array_mixed": [1, "文字", true, null],\n  "array_objects": [\n    {\n      "name": "张三",\n      "age": 25\n    },\n    {\n      "name": "李四",\n      "age": 30\n    }\n  ]\n}';
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('is-error', error); };
  const updateLines = () => { lineNumbers.textContent = Array.from({ length: input.value.split('\n').length }, (_, i) => i + 1).join('\n'); };
  const parseJson = (content) => {
    try {
      return { ok: true, data: JSON.parse(content), type: 'json' };
    }
    catch (error) { return { ok: false, message: `JSON 格式有误：${error.message}` }; }
  };
  const scalarValue = (value) => {
    const text = value.trim();
    if (text === '') return '';
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (text === 'null') return null;
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text)) return Number(text);
    return text;
  };
  const xmlElementValue = (element) => {
    const valueType = element.getAttribute('data-json-type');
    const attributes = Object.fromEntries(Array.from(element.attributes).filter((attribute) => !['data-json-type', 'data-json-root', 'data-json-key'].includes(attribute.name)).map((attribute) => [attribute.name, attribute.value]));
    const children = Array.from(element.children);
    if (valueType === 'array') return children.map((child) => xmlElementValue(child));
    if (!children.length && !Object.keys(attributes).length) {
      const text = element.textContent;
      if (valueType === 'string') return text;
      if (valueType === 'null') return null;
      if (valueType === 'boolean') return text === 'true';
      if (valueType === 'number') return Number(text);
      if (valueType === 'object') return {};
      return scalarValue(text);
    }
    const value = {};
    if (Object.keys(attributes).length) value._attributes = attributes;
    children.forEach((child) => {
      const childValue = xmlElementValue(child);
      const key = child.getAttribute('data-json-key') || child.tagName;
      if (Object.hasOwn(value, key)) value[key] = Array.isArray(value[key]) ? [...value[key], childValue] : [value[key], childValue];
      else value[key] = childValue;
    });
    const text = Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent.trim()).join('');
    if (text) value._text = scalarValue(text);
    return value;
  };
  const parseXml = (content) => {
    const document = new DOMParser().parseFromString(content, 'application/xml');
    const error = document.querySelector('parsererror');
    if (error) return { ok: false, message: 'XML 格式有误，请检查标签是否正确闭合。' };
    const root = document.documentElement;
    const data = xmlElementValue(root);
    return { ok: true, data: root.getAttribute('data-json-root') === 'true' ? data : { [root.tagName]: data }, type: 'xml', rootName: root.tagName };
  };
  const parseYaml = (content) => {
    if (!window.jsyaml) return { ok: false, message: 'YAML 转换组件加载失败，请检查网络后重试。' };
    try { return { ok: true, data: window.jsyaml.load(content), type: 'yaml' }; }
    catch (error) { return { ok: false, message: `YAML 格式有误：${error.message}` }; }
  };
  const yamlString = (value) => {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
    const text = String(value);
    const needsQuotes = !text || text !== text.trim() || /[\n\r]/.test(text) || /^[!&*#|>@`\-?:,[\]{}]/.test(text) || /:\s|\s#/.test(text) || /^(?:true|false|null|~|yes|no|on|off|\.nan|[-+]?\.inf)$/i.test(text) || /^[-+]?(?:\d+|\d*\.\d+)(?:e[-+]?\d+)?$/i.test(text) || /^\d{4}-\d{2}-\d{2}/.test(text);
    return needsQuotes ? JSON.stringify(text) : text;
  };
  const yamlKey = (key) => /^[A-Za-z_][\w.-]*$/.test(key) ? key : JSON.stringify(key);
  const yamlLines = (value, depth = 0) => {
    const indent = ' '.repeat(depth);
    if (Array.isArray(value)) {
      if (!value.length) return [`${indent}[]`];
      return value.flatMap((item) => {
        if (!item || typeof item !== 'object') return [`${indent}- ${yamlString(item)}`];
        const nested = yamlLines(item, depth + 2);
        return [`${indent}-`, ...nested];
      });
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value);
      if (!entries.length) return [`${indent}{}`];
      return entries.flatMap(([key, item]) => {
        if (!item || typeof item !== 'object') return [`${indent}${yamlKey(key)}: ${yamlString(item)}`];
        return [`${indent}${yamlKey(key)}:`, ...yamlLines(item, depth + 2)];
      });
    }
    return [`${indent}${yamlString(value)}`];
  };
  const dumpYaml = (value) => yamlLines(value).join('\n');
  const readData = () => {
    const content = input.value.trim();
    if (!content) { setStatus('请先粘贴 JSON、YAML 或 XML 内容。', true); return { ok: false }; }
    let result;
    if (content.startsWith('<')) result = parseXml(content);
    else if (/^[{[]/.test(content)) {
      result = parseJson(content);
      if (!result.ok) result = parseYaml(content);
    } else result = parseYaml(content);
    if (!result.ok) setStatus(result.message, true);
    return result;
  };
  const transform = (space) => {
    const result = readData();
    if (!result.ok) return;
    input.value = JSON.stringify(result.data, null, space); updateLines(); setStatus(space ? '已转换为 JSON。' : '已压缩为 JSON。');
  };
  const convertYaml = () => {
    const result = readData();
    if (!result.ok) return;
    input.value = dumpYaml(result.data); updateLines(); setStatus('已转换为 YAML。');
  };
  const escapeXml = (value) => String(value).replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);
  const xmlNode = (value, tag = 'root', isJsonRoot = false, jsonKey = '') => {
    const rootAttribute = isJsonRoot ? ' data-json-root="true"' : '';
    const keyAttribute = jsonKey ? ` data-json-key="${escapeXml(jsonKey)}"` : '';
    if (Array.isArray(value)) return `<${tag}${rootAttribute}${keyAttribute} data-json-type="array">${value.map((item) => xmlNode(item, 'item')).join('')}</${tag}>`;
    if (value && typeof value === 'object') return `<${tag}${rootAttribute}${keyAttribute} data-json-type="object">${Object.entries(value).map(([key, item]) => /^[A-Za-z_][\w.-]*$/.test(key) ? xmlNode(item, key) : xmlNode(item, 'item', false, key)).join('')}</${tag}>`;
    const valueType = value === null ? 'null' : typeof value;
    return `<${tag}${rootAttribute}${keyAttribute} data-json-type="${valueType}">${escapeXml(value ?? '')}</${tag}>`;
  };
  const convertXml = () => {
    const result = readData();
    if (!result.ok) return;
    const xml = xmlNode(result.data, 'root', true);
    const prettyXml = (source) => {
      let depth = 0;
      return source.replace(/>\s*</g, '>\n<').split('\n').map((line) => {
        if (/^<\//.test(line)) depth -= 1;
        const indented = `${'  '.repeat(Math.max(depth, 0))}${line}`;
        if (/^<[^/?][^>]*>$/.test(line) && !/<\/[^>]+>$/.test(line)) depth += 1;
        return indented;
      }).join('\n');
    };
    input.value = `<?xml version="1.0" encoding="UTF-8"?>\n${prettyXml(xml)}`; updateLines(); setStatus('已转换为 XML。');
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
