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

  <section class="tool-guide">
    <h2>一、为什么"1 TB 硬盘只有 931 GB"</h2>
    <p>这是所有存储单位换算问题的源头，值得讲清楚。</p>
    <p>硬盘厂商按<strong>十进制</strong>标容量：1 TB = 1000 GB = 1000<sup>4</sup> 字节。而 Windows 等系统在显示时按<strong>二进制</strong>计算，并且沿用了 GB 这个单位名：1 TiB = 1024 GiB = 1024<sup>4</sup> 字节。两者相差约 9.95%。</p>
    <p>所以一块标称 1 TB 的硬盘，在系统里显示为 1000<sup>4</sup> ÷ 1024<sup>4</sup> ≈ 0.909 TiB，约等于 931 GiB。硬盘没有缩水，是两套进制在用同一个词。</p>
    <p>国际电工委员会为此定了两组明确的写法：<strong>KB/MB/GB</strong> 属于 SI 十进制（1000 进制），<strong>KiB/MiB/GiB</strong> 属于 IEC 二进制（1024 进制）。本工具的「二进制 / 十进制」开关，就是在这两套体系之间切换。</p>

    <h2>二、bit 和 Byte 差了一个 8 倍</h2>
    <p>网络带宽用 <strong>bit/s</strong>（小写 b，常写成 Mbps、Gbps），文件大小用 <strong>Byte</strong>（大写 B）。1 Byte = 8 bit，所以：</p>
    <p><code>500 Mbps ÷ 8 = 62.5 MB/s</code></p>
    <p>这就是"办了 500 兆宽带，下载却只有 60 多兆"的全部原因——单位不同，不是被运营商坑了（实际速率还会再低一些，因为有协议开销）。</p>

    <h2>三、怎么用</h2>
    <ol>
      <li>先在顶部选进制：看硬盘、给用户展示容量用「十进制 · 1000」，看内存、算进程占用用「二进制 · 1024」；</li>
      <li>在任意一个输入框里填数字，其余七个单位会同步换算；</li>
      <li>数字特别大或特别小时会以科学计数法显示，避免一长串零看错位。</li>
    </ol>

    <h2>四、常见场景对照</h2>
    <ul>
      <li><strong>服务器内存</strong>：标 16 GB，系统里显示 16 GiB，实际约 17.18 × 10<sup>9</sup> 字节；</li>
      <li><strong>云盘容量</strong>：多数按十进制卖，扣掉文件系统元数据后可用空间略小于标称；</li>
      <li><strong>日志文件</strong>：<code>ls -lh</code> 用的是 1024 进制，<code>ls --si</code> 用的是 1000 进制，同一文件会显示两个数。</li>
    </ul>
  </section>
</section>
<script src="{{ '/assets/js/byte-converter.js' | relative_url }}?v=20260902-1"></script>
