// Polyfill navigator.clipboard for non-HTTPS contexts (e.g. Docker dev server)
if (typeof navigator !== 'undefined' && !navigator.clipboard) {
  navigator.clipboard = {
    writeText(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return Promise.resolve();
    },
  };
}
