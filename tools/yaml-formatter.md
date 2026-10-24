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

  <section class="tool-guide" data-lang-block>
    <div data-lang="zh-CN">
    <h2>一、YAML 适合写什么</h2>
    <p>YAML 的设计目标只有一个：<strong>让人读得下去</strong>。它用缩进表达层级、用短横线表达列表，几乎没有括号和引号，所以特别适合人来手写的场景——Kubernetes 清单、CI 流水线定义、Ansible 剧本、Docker Compose、静态站点配置，基本都是 YAML。</p>
    <p>代价是：它对格式极其敏感。少一个空格、多一个 Tab，含义就变了，甚至直接报错。</p>

    <h2>二、三条必须记住的规则</h2>
    <ul>
      <li><strong>只能用空格缩进，不能用 Tab。</strong>YAML 规范明确禁止制表符。从编辑器里复制过来的内容如果混了 Tab，报错往往指向一个看起来完全正常的行——这是最难查的一类问题。</li>
      <li><strong>同一层级缩进必须完全一致。</strong>有的人写 2 个空格，有的人写 4 个，混在一起就会把同级的两个键变成父子关系。</li>
      <li><strong>冒号后面要有一个空格。</strong><code>name:JiangYu</code> 不是一个键值对，而是一个字符串 <code>"name:JiangYu"</code>。</li>
    </ul>

    <h2>三、怎么用</h2>
    <ol>
      <li>粘贴 YAML，点「格式化」，工具会统一缩进并检查语法；</li>
      <li>如果报错，按提示的行号去看那个位置——通常是缩进异常或缺少冒号后的空格；</li>
      <li>需要给程序消费时，点「转为 JSON」，得到带引号的标准结构；</li>
      <li>把结果复制回编辑器。</li>
    </ol>

    <h2>四、类型推断带来的意外</h2>
    <p>YAML 会自动猜类型，这在配置里是个双刃剑：</p>
    <table>
      <thead><tr><th>你写的</th><th>可能被读成</th><th>怎么避免</th></tr></thead>
      <tbody>
        <tr><td><code>1.20</code></td><td>数字 1.2</td><td>加引号 <code>"1.20"</code></td></tr>
        <tr><td><code>0755</code></td><td>八进制 493</td><td>加引号 <code>"0755"</code></td></tr>
        <tr><td><code>on</code> / <code>no</code></td><td>布尔值（部分解析器）</td><td>加引号</td></tr>
        <tr><td><code>2026-10-24</code></td><td>日期对象</td><td>加引号</td></tr>
      </tbody>
    </table>
    <p>这也是"配置文件在本地没问题，部署到服务器就报错"的常见原因：两边用的解析器版本不同，类型推断规则就不完全一样。凡是"看起来像数字/日期但其实要当字符串"的值，加引号最稳。</p>

    <h2>五、数据安全</h2>
    <p>解析完全在浏览器内完成，不会上传内容。但配置文件里经常含密码和令牌，用完建议清空输入框。</p>
    </div>
    <div data-lang="en" hidden>
      <h2>What YAML is good for</h2>
      <p>YAML has exactly one design goal: <strong>stay readable</strong>. Indentation carries the hierarchy, dashes mark lists, and there are almost no brackets or quotes, which makes it ideal for anything a human hand-edits: Kubernetes manifests, CI pipeline definitions, Ansible playbooks, Docker Compose, static site config.</p>
      <p>The trade-off is fragility. One missing space or one stray tab changes the meaning, or fails outright.</p>

      <h2>Three rules worth memorising</h2>
      <ul>
        <li><strong>Spaces only, never tabs.</strong> The spec forbids tab characters. A tab pasted in from an editor produces an error on a line that looks perfectly fine &mdash; the hardest kind to find.</li>
        <li><strong>Indentation must match exactly at the same level.</strong> Mixing two and four spaces silently turns sibling keys into a parent-child relationship.</li>
        <li><strong>A colon needs a space after it.</strong> <code>name:JiangYu</code> is not a key/value pair; it is the string <code>"name:JiangYu"</code>.</li>
      </ul>

      <h2>How to use it</h2>
      <ol>
        <li>Paste the YAML and press Format to normalise indentation and check the syntax;</li>
        <li>If it errors, jump to the reported line &mdash; it is almost always indentation or a missing space after a colon;</li>
        <li>Use Convert to JSON when a program will consume it;</li>
        <li>Copy the result back into your editor.</li>
      </ol>

      <h2>When type inference bites</h2>
      <p>YAML guesses types automatically, which cuts both ways in configuration files:</p>
      <table>
        <thead><tr><th>You write</th><th>May be read as</th><th>How to avoid it</th></tr></thead>
        <tbody>
          <tr><td><code>1.20</code></td><td>the number 1.2</td><td>quote it: <code>"1.20"</code></td></tr>
          <tr><td><code>0755</code></td><td>octal 493</td><td>quote it: <code>"0755"</code></td></tr>
          <tr><td><code>on</code> / <code>no</code></td><td>a boolean (in some parsers)</td><td>quote it</td></tr>
          <tr><td><code>2026-10-24</code></td><td>a date object</td><td>quote it</td></tr>
        </tbody>
      </table>
      <p>This is also why a config that works locally can fail in production: the two sides run different parser versions with slightly different inference rules. If a value looks like a number or a date but must stay a string, quoting it is always the safe move.</p>

      <h2>Data safety</h2>
      <p>Parsing happens entirely in your browser. Config files often carry passwords and tokens, so clear the input when you are done.</p>
    </div>
  </section>
</section>
<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script src="{{ '/assets/js/yaml-formatter.js' | relative_url }}?v=20260831-1"></script>
