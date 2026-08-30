---
layout: default
title: YAML 格式化
description: 免费、私密的在线 YAML 格式化、校验与 JSON 转换工具。
permalink: /tools/yaml-formatter/
---

<section class="tool-page" id="top">
  <p class="eyebrow">TOOL / 02</p><h1>YAML <em>格式化</em></h1>
  <p class="tool-lead">粘贴 YAML，即可格式化、校验或转换为 JSON。内容仅在当前浏览器中处理。</p>
  <div class="formatter" data-yaml-formatter>
    <div class="formatter-bar"><span><i></i> 本地处理，不会上传</span><div class="formatter-actions"><button data-action="sample">示例</button><button data-action="clear">清空</button></div></div>
    <label class="sr-only" for="yaml-input">YAML 输入</label>
    <textarea id="yaml-input" spellcheck="false" placeholder="在这里粘贴 YAML …&#10;&#10;例如：&#10;name: JiangYu&#10;tools:&#10;  - YAML Formatter"></textarea>
    <div class="formatter-controls"><button class="button button-primary" data-action="format">格式化 <span>⌘↵</span></button><button class="button button-secondary" data-action="json">转为 JSON</button><button class="button button-secondary" data-action="copy">复制结果</button><p class="status" aria-live="polite"></p></div>
  </div>
  <div class="tool-notes"><div><span>01</span><h2>格式化</h2><p>统一缩进与结构，让 YAML 更易读。</p></div><div><span>02</span><h2>校验</h2><p>发现语法问题时，提示对应行号。</p></div><div><span>03</span><h2>本地处理</h2><p>零上传、零存储，内容始终留在本地。</p></div></div>
</section>
<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script src="{{ '/assets/js/yaml-formatter.js' | relative_url }}"></script>
