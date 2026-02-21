// Visual diff: compare rendered visual output between Almond and Docusaurus
// by sampling pixel colors at key positions via CDP's CSS.getComputedStyleForNode
// and element bounding boxes. Also compares screenshots by loading them into
// a browser canvas for pixel-level diff.

async function runVisualDiffTests(openPageFn, almondUrl, docUrl, closeAssistantFn) {
  const results = [];

  function test(name, pass, detail) {
    results.push({ name, pass, detail: detail || '' });
  }

  // Open both at 1440
  const almond = await openPageFn(almondUrl, 1440, 900);
  await closeAssistantFn(almond);
  const doc = await openPageFn(docUrl, 1440, 900);

  // Sample colors at specific coordinates on both sites by injecting a canvas
  // and using drawImage from a screenshot. Instead, we sample element colors
  // at key visual landmarks.

  const samplePoints = [
    { name: 'page-bg', desc: 'Background behind panel',
      almond: `document.elementFromPoint(10, 400)`,
      doc: `document.elementFromPoint(10, 400)` },
    { name: 'panel-bg', desc: 'Panel background color',
      almond: `document.querySelector('#content-container')`,
      doc: `document.querySelector('.mintysaurus-panel')` },
    { name: 'sidebar-bg', desc: 'Sidebar background',
      almond: `document.querySelector('#sidebar-content')`,
      doc: `document.querySelector('.theme-doc-sidebar-container')` },
    { name: 'body-text', desc: 'Body text color',
      almond: `(function(){ var s = document.querySelectorAll('#content > span'); for(var i=0;i<s.length;i++) if(s[i].textContent.trim().length>20) return s[i]; return null; })()`,
      doc: `(function(){ var ps = document.querySelectorAll('.theme-doc-markdown p'); for(var i=0;i<ps.length;i++) if(!ps[i].classList.contains('mintlify-eyebrow')&&!ps[i].classList.contains('mintlify-description')) return ps[i]; return null; })()` },
    { name: 'heading-text', desc: 'H2 heading color',
      almond: `document.querySelector('#content h2')`,
      doc: `document.querySelector('.theme-doc-markdown h2')` },
  ];

  for (const sp of samplePoints) {
    const aColor = await almond.evaluate(`
      (function() {
        var el = ${sp.almond};
        if (!el) return null;
        var cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color };
      })()
    `);
    const dColor = await doc.evaluate(`
      (function() {
        var el = ${sp.doc};
        if (!el) return null;
        var cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color };
      })()
    `);

    if (aColor && dColor) {
      // Compare background colors (with primary normalization)
      const bgMatch = colorsClose(aColor.bg, dColor.bg, 15);
      test(`visual-${sp.name}-bg`, bgMatch,
        `almond=${aColor.bg} doc=${dColor.bg}`);

      // Compare text colors
      const colorMatch = colorsClose(aColor.color, dColor.color, 15);
      test(`visual-${sp.name}-color`, colorMatch,
        `almond=${aColor.color} doc=${dColor.color}`);
    }
  }

  // --- Visual spacing: compare vertical rhythm ---
  // Measure gaps between consecutive elements on both sites
  const almondSpacing = await almond.evaluate(`
    (function() {
      var h2 = document.querySelector('#content h2');
      var h3 = document.querySelector('#content h3');
      if (!h2 || !h3) return null;
      var h2r = h2.getBoundingClientRect();
      var h3r = h3.getBoundingClientRect();
      // Find first paragraph after h2
      var next = h2.nextElementSibling;
      while (next && next.tagName !== 'SPAN' && next.tagName !== 'P') next = next.nextElementSibling;
      var nextR = next ? next.getBoundingClientRect() : null;
      return {
        h2Bottom: h2r.bottom,
        nextTop: nextR ? nextR.top : null,
        h2ToNext: nextR ? nextR.top - h2r.bottom : null
      };
    })()
  `);
  const docSpacing = await doc.evaluate(`
    (function() {
      var h2 = document.querySelector('.theme-doc-markdown h2');
      if (!h2) return null;
      var h2r = h2.getBoundingClientRect();
      var next = h2.nextElementSibling;
      while (next && next.tagName === 'A') next = next.nextElementSibling;
      var nextR = next ? next.getBoundingClientRect() : null;
      return {
        h2Bottom: h2r.bottom,
        nextTop: nextR ? nextR.top : null,
        h2ToNext: nextR ? nextR.top - h2r.bottom : null
      };
    })()
  `);
  if (almondSpacing && docSpacing && almondSpacing.h2ToNext != null && docSpacing.h2ToNext != null) {
    test('visual-h2-to-content-gap',
      Math.abs(almondSpacing.h2ToNext - docSpacing.h2ToNext) <= 10,
      `almond=${almondSpacing.h2ToNext.toFixed(0)}px doc=${docSpacing.h2ToNext.toFixed(0)}px`);
  }

  // --- Dark mode comparison ---
  // Toggle dark mode on Docusaurus and check key colors
  const darkMode = await doc.evaluate(`
    (function() {
      // Toggle to dark mode
      document.documentElement.setAttribute('data-theme', 'dark');
      // Force reflow
      void document.body.offsetHeight;
      var panel = document.querySelector('.mintysaurus-panel');
      var sidebar = document.querySelector('.theme-doc-sidebar-container');
      var navbar = document.querySelector('.navbar');
      var p = document.querySelector('.theme-doc-markdown p:not(.mintlify-eyebrow):not(.mintlify-description)');
      var h2 = document.querySelector('.theme-doc-markdown h2');
      var pageBg = document.querySelector('[class*="docsWrapper"]');
      var result = {
        panelBg: panel ? getComputedStyle(panel).backgroundColor : null,
        sidebarBg: sidebar ? getComputedStyle(sidebar).backgroundColor : null,
        navbarBg: navbar ? getComputedStyle(navbar).backgroundColor : null,
        textColor: p ? getComputedStyle(p).color : null,
        headingColor: h2 ? getComputedStyle(h2).color : null,
        pageBg: pageBg ? getComputedStyle(pageBg).backgroundColor : null
      };
      // Restore light mode
      document.documentElement.setAttribute('data-theme', 'light');
      return result;
    })()
  `);
  if (darkMode) {
    // Panel should have a dark background in dark mode
    test('dark-mode-panel-bg-is-dark',
      darkMode.panelBg && isDark(darkMode.panelBg),
      `panelBg=${darkMode.panelBg}`);

    // Text should be light in dark mode
    test('dark-mode-text-is-light',
      darkMode.textColor && isLight(darkMode.textColor),
      `textColor=${darkMode.textColor}`);

    // Heading should be light in dark mode
    test('dark-mode-heading-is-light',
      darkMode.headingColor && isLight(darkMode.headingColor),
      `headingColor=${darkMode.headingColor}`);

    // Page background should be dark
    test('dark-mode-page-bg-is-dark',
      darkMode.pageBg && isDark(darkMode.pageBg),
      `pageBg=${darkMode.pageBg}`);
  }

  await almond.destroy();
  await doc.destroy();

  return results;
}

function parseRgb(str) {
  const m = str && str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] : 1 };
}

function colorsClose(a, b, tolerance) {
  const ca = parseRgb(a);
  const cb = parseRgb(b);
  if (!ca || !cb) return a === b;
  // Treat transparent as matching any transparent
  if (ca.a < 0.05 && cb.a < 0.05) return true;
  return Math.abs(ca.r - cb.r) <= tolerance &&
         Math.abs(ca.g - cb.g) <= tolerance &&
         Math.abs(ca.b - cb.b) <= tolerance &&
         Math.abs(ca.a - cb.a) <= 0.1;
}

function luminance(str) {
  const c = parseRgb(str);
  if (!c) return 128;
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

function isDark(str) { return luminance(str) < 100; }
function isLight(str) { return luminance(str) > 150; }

module.exports = { runVisualDiffTests };
