---
layout: default
title: JSON 格式化
description: 免费、私密的在线 JSON 格式化、校验和压缩工具。
permalink: /tools/json-formatter/
---

<section class="tool-page" id="top">
  <p class="eyebrow">TOOL / 01</p><h1 data-i18n="jsonName">JSON <em>格式化</em></h1>
  <p class="tool-lead" data-i18n="jsonLead">粘贴 JSON，即可美化、校验或压缩。数据只在当前浏览器中处理。</p>
  <div class="formatter" data-formatter>
    <div class="formatter-bar"><span><i></i> <span data-i18n="localOnly">本地处理，不会上传</span></span><div class="formatter-actions"><button data-action="sample" data-i18n="sample">示例</button><button data-action="clear" data-i18n="clear">清空</button></div></div>
    <label class="sr-only" for="json-input">JSON 输入</label>
    <div class="editor"><pre class="line-numbers" aria-hidden="true"></pre><textarea id="json-input" spellcheck="false" placeholder='在这里粘贴 JSON …&#10;&#10;例如：{ "hello": "world" }'></textarea></div>
    <div class="formatter-controls"><button class="button button-primary" data-action="format"><span data-i18n="format">格式化</span> <span>⌘↵</span></button><button class="button button-secondary" data-action="minify" data-i18n="minify">压缩</button><button class="button button-secondary" data-action="copy" data-i18n="copy">复制结果</button><p class="status" aria-live="polite"></p></div>
  </div>
  <div class="tool-notes"><div><span>01</span><h2 data-i18n="format">格式化</h2><p data-i18n="formatNote">自动缩进，让复杂的数据结构更易读。</p></div><div><span>02</span><h2 data-i18n="validate">校验</h2><p data-i18n="validateNote">有语法问题时，会提示具体的位置。</p></div><div><span>03</span><h2 data-i18n="privacy">隐私</h2><p data-i18n="privacyNote">零上传、零存储，内容始终留在本地。</p></div></div>
</section>
<script src="{{ '/assets/js/json-formatter.js' | relative_url }}"></script>
