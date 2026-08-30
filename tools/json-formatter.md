---
layout: default
title: JSON / YAML / XML 转换
description: 免费、私密的在线 JSON、YAML 和 XML 格式化与转换工具。
permalink: /tools/json-formatter/
---

<section class="tool-page" id="top">
  <p class="eyebrow">TOOL / 01</p><h1>JSON / YAML / XML <em>转换</em></h1>
  <p class="tool-lead">粘贴 JSON、YAML 或 XML，直接转换为其他格式或 Go 结构体。数据只在当前浏览器中处理。</p>
  <div class="formatter" data-formatter>
    <div class="formatter-bar"><span><i></i> <span data-i18n="localOnly">本地处理，不会上传</span></span><div class="formatter-actions"><button data-action="sample" data-i18n="sample">示例</button><button data-action="clear" data-i18n="clear">清空</button></div></div>
    <label class="sr-only" for="json-input">JSON、YAML 或 XML 输入</label>
    <div class="editor"><pre class="line-numbers" aria-hidden="true"></pre><textarea id="json-input" spellcheck="false" placeholder='在这里粘贴 JSON、YAML 或 XML …&#10;&#10;例如：{ "hello": "world" }'></textarea></div>
    <div class="formatter-controls"><button class="button button-primary" data-action="format">转 JSON <span>⌘↵</span></button><button class="button button-secondary" data-action="minify">压缩 JSON</button><button class="button button-secondary" data-action="yaml">转 YAML</button><button class="button button-secondary" data-action="xml">转 XML</button><button class="button button-secondary" data-action="go">转 Go 结构体</button><button class="button button-secondary" data-action="copy" data-i18n="copy">复制结果</button><p class="status" aria-live="polite"></p></div>
  </div>
  <div class="tool-notes"><div><span>01</span><h2 data-i18n="format">格式化</h2><p data-i18n="formatNote">自动缩进，让复杂的数据结构更易读。</p></div><div><span>02</span><h2 data-i18n="validate">校验</h2><p data-i18n="validateNote">有语法问题时，会提示具体的位置。</p></div><div><span>03</span><h2 data-i18n="privacy">隐私</h2><p data-i18n="privacyNote">零上传、零存储，内容始终留在本地。</p></div></div>
</section>
<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script src="{{ '/assets/js/json-formatter.js' | relative_url }}?v=20260831-5"></script>
