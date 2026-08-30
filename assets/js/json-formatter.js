(() => {
  const root = document.querySelector('[data-formatter]');
  if (!root) return;
  const input = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const lineNumbers = root.querySelector('.line-numbers');
  const sample = '{\n  "site": "JiangYu",\n  "tool": "JSON 格式化",\n  "features": ["美化", "校验", "压缩"],\n  "private": true\n}';
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
  const parseGo = (content) => {
    const structs = new Map();
    for (const match of content.matchAll(/type\s+(\w+)\s+struct\s*\{([\s\S]*?)\n?\}/g)) {
      const fields = [];
      for (const line of match[2].split('\n')) {
        const field = line.match(/^\s*([A-Za-z_]\w*)\s+([^\s`]+)(?:\s+`json:"([^"]+)"`)?/);
        if (!field) continue;
        const jsonName = field[3] ? field[3].split(',')[0] : field[1];
        if (jsonName !== '-') fields.push({ name: jsonName, type: field[2] });
      }
      structs.set(match[1], fields);
    }
    if (!structs.size) return { ok: false, message: '未识别到 Go struct 定义。' };
    const toValue = (type, seen = new Set()) => {
      const cleanType = type.replace(/^\*/, '');
      if (cleanType.startsWith('[]')) return [];
      if (cleanType.startsWith('map[')) return {};
      if (/^(?:string|byte|rune)$/.test(cleanType) || cleanType === 'time.Time') return '';
      if (/^bool$/.test(cleanType)) return false;
      if (/^(?:u?int(?:8|16|32|64)?|float(?:32|64)|complex(?:64|128))$/.test(cleanType)) return 0;
      if (/^(?:interface\{\}|any)$/.test(cleanType)) return null;
      if (!structs.has(cleanType) || seen.has(cleanType)) return {};
      const nextSeen = new Set(seen).add(cleanType);
      return Object.fromEntries(structs.get(cleanType).map((field) => [field.name, toValue(field.type, nextSeen)]));
    };
    const root = structs.has('Root') ? 'Root' : structs.keys().next().value;
    return { ok: true, data: toValue(root), type: 'go' };
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
    else if (/\btype\s+\w+\s+struct\s*\{/.test(content)) result = parseGo(content);
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
    const result = readData();
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
  input.addEventListener('input', updateLines);
  input.addEventListener('scroll', () => { lineNumbers.scrollTop = input.scrollTop; });
  updateLines();
  input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); transform(2); } });
})();
