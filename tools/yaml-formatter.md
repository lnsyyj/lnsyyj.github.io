---
layout: default
title: YAML 格式化
description: 免费、私密的在线 YAML 格式化、校验与 JSON 转换工具。
permalink: /tools/yaml-formatter/
---

<section class="tool-page" id="top">
  <p class="eyebrow">TOOL / 02</p><h1 data-i18n="yamlName">YAML <em>格式化</em></h1>
  <p class="tool-lead" data-i18n="yamlLead">粘贴 YAML，即可格式化、校验或转换为 JSON。内容仅在当前浏览器中处理。</p>
  <div class="formatter" data-yaml-formatter>
    <div class="formatter-bar"><span><i></i> <span data-i18n="localOnly">本地处理，不会上传</span></span><div class="formatter-actions"><button data-action="sample" data-i18n="sample">示例</button><button data-action="clear" data-i18n="clear">清空</button></div></div>
    <label class="sr-only" for="yaml-input" data-i18n="yamlInputLabel">YAML 输入</label>
    <div class="editor"><pre class="line-numbers" aria-hidden="true"></pre><textarea id="yaml-input" spellcheck="false" data-i18n="yamlPlaceholder" data-i18n-attr="placeholder" placeholder="在这里粘贴 YAML …&#10;&#10;例如：&#10;name: JiangYu&#10;tools:&#10;  - YAML Formatter"></textarea></div>
    <div class="formatter-controls"><button class="button button-primary" data-action="format"><span data-i18n="format">格式化</span> <span>⌘↵</span></button><button class="button button-secondary" data-action="json" data-i18n="toJson">转为 JSON</button><button class="button button-secondary" data-action="copy" data-i18n="copy">复制结果</button><p class="status" aria-live="polite"></p></div>
  </div>
  <div class="tool-notes"><div><span>01</span><h2 data-i18n="format">格式化</h2><p data-i18n="formatNote">统一缩进与结构，让内容更易读。</p></div><div><span>02</span><h2 data-i18n="validate">校验</h2><p data-i18n="validateNote">有语法问题时，会提示具体的位置。</p></div><div><span>03</span><h2 data-i18n="localOnly">本地处理</h2><p data-i18n="privacyNote">零上传、零存储，内容始终留在本地。</p></div></div>
</section>
<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script src="{{ '/assets/js/yaml-formatter.js' | relative_url }}?v=20260831-1"></script>
