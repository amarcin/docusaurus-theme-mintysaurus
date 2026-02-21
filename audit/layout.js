// Layout tests: compare bounding rectangles and spatial relationships
// These verify that elements are positioned correctly relative to each other.

async function runLayoutTests(almondPage, docPage) {
  const results = [];

  function test(name, pass, detail) {
    results.push({ name, pass, detail });
  }

  // Extract rects from both sites
  async function getRect(page, selectorOrEval) {
    const expr = selectorOrEval.eval
      ? `(function() { var el = ${selectorOrEval.eval}; if (!el) return null; var r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; })()`
      : `(function() { var el = document.querySelector('${selectorOrEval.selector.replace(/'/g, "\\'")}'); if (!el) return null; var r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; })()`;
    return page.evaluate(expr);
  }

  // 1. Sidebar width matches
  const aSidebar = await getRect(almondPage, { selector: '#sidebar-content' });
  const dSidebar = await getRect(docPage, { selector: '.theme-doc-sidebar-container' });
  if (aSidebar && dSidebar) {
    test('sidebar-width', Math.abs(aSidebar.width - dSidebar.width) <= 2,
      `almond=${aSidebar.width}px doc=${dSidebar.width}px`);
  }

  // 2. Content panel left edge (should be at sidebar width + gap)
  const aPanel = await getRect(almondPage, { selector: '#content-container' });
  const dPanel = await getRect(docPage, { selector: '.mintysaurus-panel' });
  if (aPanel && dPanel) {
    test('panel-left-edge', Math.abs(aPanel.left - dPanel.left) <= 4,
      `almond=${aPanel.left}px doc=${dPanel.left}px`);
    test('panel-top-edge', Math.abs(aPanel.top - dPanel.top) <= 4,
      `almond=${aPanel.top}px doc=${dPanel.top}px`);
  }

  // 3. Content area width
  const aContent = await getRect(almondPage, { selector: '#content-area' });
  const dContent = await getRect(docPage, { selector: '.mintysaurus-article' });
  if (aContent && dContent) {
    test('content-width', Math.abs(aContent.width - dContent.width) <= 2,
      `almond=${aContent.width}px doc=${dContent.width}px`);
  }

  // 4. Content area left position (relative to panel)
  if (aContent && dContent && aPanel && dPanel) {
    const aOffset = aContent.left - aPanel.left;
    const dOffset = dContent.left - dPanel.left;
    test('content-left-offset', Math.abs(aOffset - dOffset) <= 8,
      `almond=${aOffset.toFixed(1)}px doc=${dOffset.toFixed(1)}px`);
  }

  // 5. TOC position
  const aToc = await getRect(almondPage, { selector: '#table-of-contents' });
  const dToc = await getRect(docPage, { selector: '.mintysaurus-toc' });
  if (aToc && dToc) {
    test('toc-width', Math.abs(aToc.width - dToc.width) <= 10,
      `almond=${aToc.width}px doc=${dToc.width}px`);
  }

  // 6. Gap between content and TOC
  if (aContent && aToc && dContent && dToc) {
    const aGap = aToc.left - (aContent.left + aContent.width);
    const dGap = dToc.left - (dContent.left + dContent.width);
    test('content-toc-gap', Math.abs(aGap - dGap) <= 10,
      `almond=${aGap.toFixed(1)}px doc=${dGap.toFixed(1)}px`);
  }

  // 7. Navbar height
  const aNav = await getRect(almondPage, { selector: '#navbar' });
  const dNav = await getRect(docPage, { selector: '.navbar' });
  if (aNav && dNav) {
    test('navbar-height', Math.abs(aNav.height - dNav.height) <= 2,
      `almond=${aNav.height}px doc=${dNav.height}px`);
  }

  // 8. H1 position relative to panel top
  const aH1 = await getRect(almondPage, { selector: '#header h1' });
  const dH1 = await getRect(docPage, { selector: '.theme-doc-markdown h1' });
  if (aH1 && dH1 && aPanel && dPanel) {
    const aH1Offset = aH1.top - aPanel.top;
    const dH1Offset = dH1.top - dPanel.top;
    test('h1-top-offset', Math.abs(aH1Offset - dH1Offset) <= 15,
      `almond=${aH1Offset.toFixed(1)}px doc=${dH1Offset.toFixed(1)}px`);
  }

  return results;
}

module.exports = { runLayoutTests };
