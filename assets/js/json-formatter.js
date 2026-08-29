(() => {
  const root = document.querySelector('[data-formatter]');
  if (!root) return;
  const input = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const sample = '{\n  "site": "JiangYu",\n  "tool": "JSON 格式化",\n  "features": ["美化", "校验", "压缩"],\n  "private": true\n}';
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('is-error', error); };
  const transform = (space) => {
    if (!input.value.trim()) return setStatus('请先粘贴 JSON 内容。', true);
    try { input.value = JSON.stringify(JSON.parse(input.value), null, space); setStatus(space ? '格式化完成。' : '压缩完成。'); }
    catch (error) { setStatus(`JSON 格式有误：${error.message}`, true); }
  };
  root.addEventListener('click', async (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'format') transform(2);
    if (action === 'minify') transform(0);
    if (action === 'clear') { input.value = ''; setStatus('已清空。'); input.focus(); }
    if (action === 'sample') { input.value = sample; transform(2); }
    if (action === 'copy') {
      if (!input.value) return setStatus('没有可复制的内容。', true);
      try { await navigator.clipboard.writeText(input.value); setStatus('已复制到剪贴板。'); }
      catch (_) { input.select(); document.execCommand('copy'); setStatus('已复制到剪贴板。'); }
    }
  });
  input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); transform(2); } });
})();
