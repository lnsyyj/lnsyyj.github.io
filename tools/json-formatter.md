---
layout: default
title: JSON / YAML / XML 转换
description: 免费、私密的在线 JSON、YAML 和 XML 格式化与转换工具。
permalink: /tools/json-formatter/
---

<section class="tool-page" id="top">
  <p class="eyebrow">TOOL / 01</p><h1 data-i18n="jsonTitle">JSON / YAML / XML <em>转换</em></h1>
  <p class="tool-lead" data-i18n="jsonLead">粘贴 JSON、YAML 或 XML，直接转换为其他格式。数据只在当前浏览器中处理。</p>
  <div class="formatter" data-formatter>
    <div class="formatter-bar"><span><i></i> <span data-i18n="localOnly">本地处理，不会上传</span></span><div class="formatter-actions"><button data-action="sample" data-i18n="sample">示例</button><button data-action="clear" data-i18n="clear">清空</button></div></div>
    <label class="sr-only" for="json-input" data-i18n="jsonInputLabel">JSON、YAML 或 XML 输入</label>
    <div class="editor"><pre class="line-numbers" aria-hidden="true"></pre><textarea id="json-input" spellcheck="false" data-i18n="jsonPlaceholder" data-i18n-attr="placeholder" placeholder='在这里粘贴 JSON、YAML 或 XML …&#10;&#10;例如：{ "hello": "world" }'></textarea></div>
    <div class="formatter-controls"><button class="button button-primary" data-action="format"><span data-i18n="toJson">转 JSON</span> <span>⌘↵</span></button><button class="button button-secondary" data-action="minify" data-i18n="minifyJson">压缩 JSON</button><button class="button button-secondary" data-action="yaml" data-i18n="toYaml">转 YAML</button><button class="button button-secondary" data-action="xml" data-i18n="toXml">转 XML</button><button class="button button-secondary" data-action="copy" data-i18n="copy">复制结果</button><p class="status" aria-live="polite"></p></div>
  </div>
  <div class="tool-notes"><div><span>01</span><h2 data-i18n="format">格式化</h2><p data-i18n="formatNote">自动缩进，让复杂的数据结构更易读。</p></div><div><span>02</span><h2 data-i18n="validate">校验</h2><p data-i18n="validateNote">有语法问题时，会提示具体的位置。</p></div><div><span>03</span><h2 data-i18n="privacy">隐私</h2><p data-i18n="privacyNote">零上传、零存储，内容始终留在本地。</p></div></div>

  <section class="tool-guide" data-lang-block>
    <div data-lang="zh-CN">
    <h2>一、什么时候需要这个工具</h2>
    <p>三种格式各有各的地盘，实际工作里经常要在它们之间来回搬数据：接口返回的是一行挤在一起的 JSON，肉眼几乎没法读；Kubernetes、CI 流水线、各类配置文件用 YAML；而一些老系统的配置文件和移动端布局文件坚持用 XML。</p>
    <ul>
      <li><strong>调试接口</strong>：把 <code>curl</code> 拿到的压缩 JSON 粘进来，一键缩进成能看懂的结构；</li>
      <li><strong>改配置</strong>：把 YAML 转成 JSON 放进程序里读，或者反过来把 JSON 改写成 YAML；</li>
      <li><strong>排查报错</strong>：先校验格式，让工具指出出错的位置，再去改内容。</li>
    </ul>

    <h2>二、怎么用</h2>
    <ol>
      <li>把内容粘贴进输入框（也可以点「示例」先看看效果）；</li>
      <li>选一个转换方向：转 JSON、压缩 JSON、转 YAML、转 XML；</li>
      <li>看下方状态提示：成功会说明结果，失败会指出错误在第几行；</li>
      <li>点「复制」取走结果。</li>
    </ol>

    <h2>三、几个一定会踩到的坑</h2>
    <p><strong>JSON 比你想的更严格。</strong>它不允许尾随逗号（<code>[1,2,]</code>）、不允许注释、字符串必须用双引号。这三条是「从 JavaScript 对象复制过来」时最常见的失败原因。</p>
    <p><strong>YAML 的类型推断很主动。</strong><code>version: 1.20</code> 会被当成数字 <code>1.2</code>，<code>on</code>、<code>yes</code> 在部分解析器里会被读成布尔值。要保留原样，请加引号：<code>version: "1.20"</code>。</p>
    <p><strong>YAML 的锚点和别名会被展开。</strong>用 <code>&amp;anchor</code> 和 <code>*anchor</code> 复用的段落，转成 JSON 后会变成完整复制的内容，体积可能变大，但语义不变。</p>
    <p><strong>XML 是有序的，JSON 对象是无序的。</strong>XML 同名标签会转成数组，属性会带上 <code>@</code> 前缀；往返转换后文本排版可能变化，这是格式差异导致的，不是数据丢失。</p>

    <h2>四、数据安全</h2>
    <p>所有解析和转换都在你的浏览器里完成，不会把内容发到任何服务器。不过仍建议：涉及密钥、令牌、身份证号的内容，用完随手点「清空」，不要把生产凭据留在公共电脑的输入框里。</p>
    </div>
    <div data-lang="en" hidden>
      <h2>When you need this</h2>
      <p>Each format owns a different corner of the world, and real work keeps moving data between them: APIs return JSON squeezed onto one line, Kubernetes and CI pipelines speak YAML, and older systems still insist on XML.</p>
      <ul>
        <li><strong>Debugging an API</strong> &mdash; paste the minified JSON from <code>curl</code> and get a structure you can actually read;</li>
        <li><strong>Editing config</strong> &mdash; convert YAML to JSON to load it in code, or rewrite JSON as YAML;</li>
        <li><strong>Chasing a parse error</strong> &mdash; validate first, let the tool point at the line, then fix the content.</li>
      </ul>

      <h2>How to use it</h2>
      <ol>
        <li>Paste your content (or press Sample to see the tool in action);</li>
        <li>Pick a direction: to JSON, minify JSON, to YAML, to XML;</li>
        <li>Read the status line &mdash; success describes the output, failure names the line;</li>
        <li>Press Copy to take the result away.</li>
      </ol>

      <h2>Pitfalls you will hit</h2>
      <p><strong>JSON is stricter than you remember.</strong> No trailing commas (<code>[1,2,]</code>), no comments, double quotes only. Those three break most attempts at pasting straight from JavaScript.</p>
      <p><strong>YAML infers types eagerly.</strong> <code>version: 1.20</code> becomes the number <code>1.2</code>, and <code>on</code> or <code>yes</code> become booleans in some parsers. Quote the value to keep it literal: <code>version: "1.20"</code>.</p>
      <p><strong>YAML anchors are expanded.</strong> Blocks reused via <code>&amp;anchor</code> and <code>*anchor</code> come out as full copies in JSON: same meaning, larger payload.</p>
      <p><strong>XML is ordered, JSON objects are not.</strong> Repeated tags become arrays and attributes gain an <code>@</code> prefix. Round-tripping may reflow the text, but no data is lost.</p>

      <h2>Data safety</h2>
      <p>Parsing and conversion happen entirely in your browser; nothing is uploaded. Still, if the content carries keys, tokens or ID numbers, clear the box when you are done &mdash; especially on a shared machine.</p>
    </div>
  </section>
</section>
<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script src="{{ '/assets/js/json-formatter.js' | relative_url }}?v=20260831-9"></script>
