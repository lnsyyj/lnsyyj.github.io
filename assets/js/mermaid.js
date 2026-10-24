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
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          background: '#fbfbf8',
          fontFamily: "'PingFang SC', 'Segoe UI', system-ui, sans-serif",
          fontSize: '14px',
          primaryColor: '#e6efeb',
          primaryTextColor: '#16211e',
          primaryBorderColor: '#1b6355',
          secondaryColor: '#f2f5f1',
          tertiaryColor: '#ffffff',
          mainBkg: '#e6efeb',
          nodeBorder: '#1b6355',
          clusterBkg: '#ffffff',
          clusterBorder: '#e0e5df',
          lineColor: '#8fa79f',
          edgeLabelBackground: '#fbfbf8',
          noteBkgColor: '#f2f5f1',
          noteBorderColor: '#e0e5df',
          noteTextColor: '#16211e',
          actorBkg: '#f2f5f1',
          actorBorder: '#1b6355',
          actorTextColor: '#16211e',
          signalColor: '#5f6b66',
          signalTextColor: '#16211e',
          labelBoxBkgColor: '#e6efeb',
          labelBoxBorderColor: '#1b6355',
          labelTextColor: '#16211e',
          loopTextColor: '#16211e',
          sequenceNumberColor: '#ffffff'
        }
      });
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
