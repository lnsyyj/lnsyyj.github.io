---
layout: default
title: JSON 格式化
description: 免费、私密的在线 JSON 格式化、校验和压缩工具。
permalink: /tools/json-formatter/
---

<section class="tool-page" id="top">
  <p class="eyebrow">TOOL / 01</p><h1>JSON <em>格式化</em></h1>
  <p class="tool-lead">粘贴 JSON，即可美化、校验或压缩。数据只在当前浏览器中处理。</p>
  <div class="formatter" data-formatter>
    <div class="formatter-bar"><span><i></i> 本地处理，不会上传</span><div class="formatter-actions"><button data-action="sample">示例</button><button data-action="clear">清空</button></div></div>
    <label class="sr-only" for="json-input">JSON 输入</label>
    <textarea id="json-input" spellcheck="false" placeholder='在这里粘贴 JSON …&#10;&#10;例如：{ "hello": "world" }'></textarea>
    <div class="formatter-controls"><button class="button button-primary" data-action="format">格式化 <span>⌘↵</span></button><button class="button button-secondary" data-action="minify">压缩</button><button class="button button-secondary" data-action="copy">复制结果</button><p class="status" aria-live="polite"></p></div>
  </div>
  <div class="tool-notes"><div><span>01</span><h2>格式化</h2><p>自动缩进，让复杂的数据结构更易读。</p></div><div><span>02</span><h2>校验</h2><p>有语法问题时，会提示具体的位置。</p></div><div><span>03</span><h2>隐私</h2><p>零上传、零存储，内容始终留在本地。</p></div></div>
</section>
<script src="{{ '/assets/js/json-formatter.js' | relative_url }}"></script>
