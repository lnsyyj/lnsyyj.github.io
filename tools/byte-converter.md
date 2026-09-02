---
layout: default
title: 字节转换
description: 免费在线字节转换工具，支持 bit、Byte、KB、MB、GB、TB、PB 与 EB 的实时换算。
permalink: /tools/byte-converter/
---

<section class="tool-page byte-page" id="top" data-byte-converter>
  <p class="eyebrow">TOOL / 06</p>
  <h1 data-i18n="byteTitle">字节 <em>转换</em></h1>
  <p class="tool-lead" data-i18n="byteLead">在 bit、Byte、KB、MB、GB、TB 等常见存储单位之间实时换算；所有计算仅在浏览器中完成。</p>

  <div class="byte-converter">
    <div class="byte-toolbar">
      <div>
        <p class="byte-toolbar-label" data-i18n="byteMode">换算进制</p>
        <div class="byte-mode" role="group" data-byte-mode>
          <button type="button" class="is-active" data-byte-base="1024" data-i18n="byteBinary">二进制 · 1024</button>
          <button type="button" data-byte-base="1000" data-i18n="byteDecimal">十进制 · 1000</button>
        </div>
      </div>
      <div class="byte-toolbar-actions"><button class="button button-secondary" type="button" data-byte-sample data-i18n="byteSample">示例：1 TB</button><button class="button button-secondary" type="button" data-byte-clear data-i18n="byteClear">清空</button></div>
    </div>
    <p class="byte-status" data-byte-status aria-live="polite"></p>
    <div class="byte-fields">
      <label class="byte-field"><span data-i18n="byteBit">比特 bit (b)</span><input data-byte-unit="bit" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><small data-byte-caption="bit"></small></label>
      <label class="byte-field"><span data-i18n="byteByte">字节 byte (B)</span><input data-byte-unit="byte" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><small data-byte-caption="byte"></small></label>
      <label class="byte-field"><span data-i18n="byteKilobyte">千字节 kilobyte (KB)</span><input data-byte-unit="kilobyte" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><small data-byte-caption="kilobyte"></small></label>
      <label class="byte-field"><span data-i18n="byteMegabyte">兆字节 megabyte (MB)</span><input data-byte-unit="megabyte" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><small data-byte-caption="megabyte"></small></label>
      <label class="byte-field"><span data-i18n="byteGigabyte">吉字节 gigabyte (GB)</span><input data-byte-unit="gigabyte" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><small data-byte-caption="gigabyte"></small></label>
      <label class="byte-field"><span data-i18n="byteTerabyte">太字节 terabyte (TB)</span><input data-byte-unit="terabyte" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><small data-byte-caption="terabyte"></small></label>
      <label class="byte-field"><span data-i18n="bytePetabyte">拍字节 petabyte (PB)</span><input data-byte-unit="petabyte" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><small data-byte-caption="petabyte"></small></label>
      <label class="byte-field"><span data-i18n="byteExabyte">艾字节 exabyte (EB)</span><input data-byte-unit="exabyte" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><small data-byte-caption="exabyte"></small></label>
    </div>
    <p class="byte-local" data-i18n="byteLocalOnly">不上传输入内容；超大或极小数值会以科学计数法显示。</p>
  </div>

  <div class="tool-notes">
    <div><span>01</span><h2 data-i18n="byteInfo1Title">bit 与 Byte</h2><p data-i18n="byteInfo1Text">1 Byte 等于 8 bit。网络带宽常用 bit，文件大小通常使用 Byte。</p></div>
    <div><span>02</span><h2 data-i18n="byteInfo2Title">1024 或 1000？</h2><p data-i18n="byteInfo2Text">内存和部分系统常按 1024 换算；硬盘厂商与国际单位制通常按 1000 换算。</p></div>
    <div><span>03</span><h2 data-i18n="byteInfo3Title">实时且私密</h2><p data-i18n="byteInfo3Text">输入任一单位后，其余单位会立即更新，整个过程只在当前浏览器中进行。</p></div>
  </div>
</section>
<script src="{{ '/assets/js/byte-converter.js' | relative_url }}?v=20260902-1"></script>
