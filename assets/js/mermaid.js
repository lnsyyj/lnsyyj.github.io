(function () {
  'use strict';

  function render() {
    var blocks = document.querySelectorAll('pre > code.language-mermaid');
    if (!blocks.length) return;

    blocks.forEach(function (code) {
      var pre = code.parentNode;
      var host = document.createElement('div');
      host.className = 'mermaid';
      host.textContent = code.textContent;
      pre.parentNode.replaceChild(host, pre);
    });

    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
      window.mermaid.run({ querySelector: '.mermaid' });
    }
  }

  function loadLibrary() {
    if (window.mermaid) {
      render();
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    script.onload = render;
    script.onerror = function () {
      var fallback = document.createElement('script');
      fallback.src = 'https://unpkg.com/mermaid@11/dist/mermaid.min.js';
      fallback.onload = render;
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  }

  function boot() {
    // Only load the library when the page actually contains a Mermaid block.
    if (!document.querySelector('pre > code.language-mermaid')) return;
    loadLibrary();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
