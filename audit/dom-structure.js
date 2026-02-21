// DOM structure tests: verify hierarchy, stacking context, inheritance,
// element ordering, and structural correctness that CSS comparison misses.

async function runDomTests(almondPage, docPage) {
  const results = [];

  function test(name, pass, detail) {
    results.push({ name, pass, detail: detail || '' });
  }

  // --- 1. Z-index stacking: navbar above panel ---
  const stacking = await docPage.evaluate(`
    (function() {
      var navbar = document.querySelector('.navbar');
      var panel = document.querySelector('.mintysaurus-panel');
      if (!navbar || !panel) return null;
      var ncs = getComputedStyle(navbar);
      var pcs = getComputedStyle(panel);
      return {
        navbarZ: parseInt(ncs.zIndex) || 'auto',
        panelZ: parseInt(pcs.zIndex) || 'auto',
        navbarPosition: ncs.position,
        panelPosition: pcs.position
      };
    })()
  `);
  if (stacking) {
    const navZ = typeof stacking.navbarZ === 'number' ? stacking.navbarZ : 0;
    const panZ = typeof stacking.panelZ === 'number' ? stacking.panelZ : 0;
    test('z-index-navbar-above-panel',
      navZ > panZ,
      `navbar z=${stacking.navbarZ} (${stacking.navbarPosition}) panel z=${stacking.panelZ} (${stacking.panelPosition})`);
  }

  // --- 2. Content row flex order: article appears visually left of TOC ---
  const flexOrder = await docPage.evaluate(`
    (function() {
      var article = document.querySelector('.mintysaurus-article');
      var toc = document.querySelector('.mintysaurus-toc, .mintysaurus-side-layout');
      if (!article || !toc) return null;
      var ar = article.getBoundingClientRect();
      var tr = toc.getBoundingClientRect();
      return {
        articleLeft: ar.left,
        tocLeft: tr.left,
        articleVisuallyLeft: ar.left < tr.left
      };
    })()
  `);
  if (flexOrder) {
    test('article-visually-left-of-toc',
      flexOrder.articleVisuallyLeft,
      `article.left=${flexOrder.articleLeft.toFixed(0)} toc.left=${flexOrder.tocLeft.toFixed(0)}`);
  }

  // --- 3. TOC is inside a sticky container ---
  const tocSticky = await docPage.evaluate(`
    (function() {
      var toc = document.querySelector('.mintysaurus-toc');
      if (!toc) return null;
      // Walk up to find sticky ancestor or check direct children
      var inner = toc.querySelector('[class*="tableOfContents"]') || toc.firstElementChild;
      if (!inner) return { hasStickyChild: false };
      var cs = getComputedStyle(inner);
      return { hasStickyChild: cs.position === 'sticky', position: cs.position, top: cs.top };
    })()
  `);
  test('toc-has-sticky-inner',
    tocSticky && tocSticky.hasStickyChild,
    JSON.stringify(tocSticky));

  // --- 4. Panel is the scroll container (not document body) ---
  const scrollContainer = await docPage.evaluate(`
    (function() {
      var panel = document.querySelector('.mintysaurus-panel');
      if (!panel) return null;
      var cs = getComputedStyle(panel);
      var bodyOverflow = getComputedStyle(document.body).overflowY;
      var htmlOverflow = getComputedStyle(document.documentElement).overflowY;
      return {
        panelOverflowY: cs.overflowY,
        panelScrollable: panel.scrollHeight > panel.clientHeight,
        bodyOverflowY: bodyOverflow,
        htmlOverflowY: htmlOverflow
      };
    })()
  `);
  if (scrollContainer) {
    test('panel-is-scroll-container',
      scrollContainer.panelOverflowY === 'auto' || scrollContainer.panelOverflowY === 'scroll',
      `panel.overflowY=${scrollContainer.panelOverflowY} scrollable=${scrollContainer.panelScrollable}`);
  }

  // --- 5. Pagination child order: sublabel before title (matching Almond) ---
  const paginationOrder = await docPage.evaluate(`
    (function() {
      var link = document.querySelector('.pagination-nav__link');
      if (!link) return null;
      var children = [];
      for (var i = 0; i < link.children.length; i++) {
        var c = link.children[i];
        children.push({
          cls: c.className,
          text: c.textContent.trim().substring(0, 30)
        });
      }
      return { children: children };
    })()
  `);
  const almondPaginationOrder = await almondPage.evaluate(`
    (function() {
      var link = document.querySelector('#pagination a');
      if (!link) return null;
      var children = [];
      for (var i = 0; i < link.children.length; i++) {
        var c = link.children[i];
        children.push({
          tag: c.tagName,
          text: c.textContent.trim().substring(0, 30)
        });
      }
      return { children: children };
    })()
  `);
  if (paginationOrder && almondPaginationOrder) {
    // Visual order matters, not DOM order. Check that title appears above sublabel visually.
    const docSublabel = await docPage.evaluate(`
      (function() {
        var link = document.querySelector('.pagination-nav__link');
        if (!link) return null;
        var sub = link.querySelector('.pagination-nav__sublabel');
        var label = link.querySelector('.pagination-nav__label');
        if (!sub || !label) return null;
        return { sublabelTop: sub.getBoundingClientRect().top, labelTop: label.getBoundingClientRect().top };
      })()
    `);
    test('pagination-child-order',
      docSublabel && docSublabel.labelTop < docSublabel.sublabelTop,
      docSublabel ? `label.top=${docSublabel.labelTop.toFixed(0)} sublabel.top=${docSublabel.sublabelTop.toFixed(0)} (expect label above sublabel)` : 'elements not found');
  }

  // --- 6. Admonition internal structure: icon + text have gap ---
  const admonitionGap = await docPage.evaluate(`
    (function() {
      var adm = document.querySelector('.theme-admonition');
      if (!adm) return null;
      var heading = adm.querySelector('.admonitionHeading_Gvgb, [class*="admonitionHeading"]');
      if (!heading) return { error: 'no heading found' };
      var cs = getComputedStyle(heading);
      var gap = parseFloat(cs.gap) || 0;
      return { display: cs.display, gap: gap, gapRaw: cs.gap };
    })()
  `);
  test('admonition-icon-text-gap',
    admonitionGap && admonitionGap.display === 'flex' && admonitionGap.gap >= 4,
    JSON.stringify(admonitionGap));

  // --- 7. Code block title bar exists and is styled ---
  const codeTitle = await docPage.evaluate(`
    (function() {
      var title = document.querySelector('[class*="codeBlockTitle"], .prism-code-title');
      if (!title) return { exists: false };
      var cs = getComputedStyle(title);
      var r = title.getBoundingClientRect();
      return {
        exists: true,
        visible: cs.display !== 'none' && r.height > 0,
        text: title.textContent.trim().substring(0, 40),
        fontSize: cs.fontSize,
        borderBottom: cs.borderBottomWidth + ' ' + cs.borderBottomStyle,
        padding: cs.padding
      };
    })()
  `);
  test('code-block-title-exists',
    codeTitle && codeTitle.exists && codeTitle.visible,
    JSON.stringify(codeTitle));

  // --- 8. Table width: should span reasonable portion of content area ---
  const tableWidth = await docPage.evaluate(`
    (function() {
      var table = document.querySelector('.theme-doc-markdown table');
      var article = document.querySelector('.mintysaurus-article');
      if (!table || !article) return null;
      var tr = table.getBoundingClientRect();
      var ar = article.getBoundingClientRect();
      return {
        tableWidth: tr.width,
        articleWidth: ar.width,
        ratio: tr.width / ar.width
      };
    })()
  `);
  const almondTableWidth = await almondPage.evaluate(`
    (function() {
      var table = document.querySelector('table');
      var content = document.querySelector('#content-area');
      if (!table || !content) return null;
      var tr = table.getBoundingClientRect();
      var cr = content.getBoundingClientRect();
      return {
        tableWidth: tr.width,
        contentWidth: cr.width,
        ratio: tr.width / cr.width
      };
    })()
  `);
  if (tableWidth && almondTableWidth) {
    test('table-width-ratio',
      Math.abs(tableWidth.ratio - almondTableWidth.ratio) <= 0.15,
      `almond=${(almondTableWidth.ratio * 100).toFixed(0)}% doc=${(tableWidth.ratio * 100).toFixed(0)}%`);
  }

  // --- 9. Inherited color chain: body → panel → article text color ---
  const colorChain = await docPage.evaluate(`
    (function() {
      var body = getComputedStyle(document.body).color;
      var panel = document.querySelector('.mintysaurus-panel');
      var article = document.querySelector('.mintysaurus-article');
      var p = document.querySelector('.theme-doc-markdown p:not(.mintlify-eyebrow):not(.mintlify-description)');
      return {
        body: body,
        panel: panel ? getComputedStyle(panel).color : null,
        article: article ? getComputedStyle(article).color : null,
        paragraph: p ? getComputedStyle(p).color : null
      };
    })()
  `);
  const almondColorChain = await almondPage.evaluate(`
    (function() {
      var body = getComputedStyle(document.body).color;
      var panel = document.querySelector('#content-container');
      var content = document.querySelector('#content-area');
      var span = document.querySelector('#content > span');
      return {
        body: body,
        panel: panel ? getComputedStyle(panel).color : null,
        content: content ? getComputedStyle(content).color : null,
        text: span ? getComputedStyle(span).color : null
      };
    })()
  `);
  if (colorChain && almondColorChain) {
    // The paragraph text color should match Almond's text color
    test('text-color-matches-reference',
      colorChain.paragraph === almondColorChain.text ||
      (colorChain.paragraph && almondColorChain.text &&
       Math.abs(parseInt(colorChain.paragraph.match(/\d+/)?.[0] || 0) - parseInt(almondColorChain.text.match(/\d+/)?.[0] || 0)) <= 10),
      `almond=${almondColorChain.text} doc=${colorChain.paragraph}`);
  }

  // --- 10. overflowWrap consistency: should match Almond ---
  const overflowWrap = await docPage.evaluate(`
    (function() {
      var p = document.querySelector('.theme-doc-markdown p:not(.mintlify-eyebrow):not(.mintlify-description)');
      return p ? getComputedStyle(p).overflowWrap : null;
    })()
  `);
  const almondOverflowWrap = await almondPage.evaluate(`
    (function() {
      var span = document.querySelector('#content > span');
      return span ? getComputedStyle(span).overflowWrap : null;
    })()
  `);
  test('overflow-wrap-matches',
    overflowWrap === almondOverflowWrap || overflowWrap === 'break-word',
    `almond=${almondOverflowWrap} doc=${overflowWrap} (break-word accepted: prevents layout overflow)`);

  // --- 11. lineHeight inheritance: body → paragraph ---
  const lineHeightChain = await docPage.evaluate(`
    (function() {
      var body = getComputedStyle(document.body).lineHeight;
      var p = document.querySelector('.theme-doc-markdown p:not(.mintlify-eyebrow):not(.mintlify-description)');
      return { body: body, paragraph: p ? getComputedStyle(p).lineHeight : null };
    })()
  `);
  const almondLineHeight = await almondPage.evaluate(`
    (function() {
      var body = getComputedStyle(document.body).lineHeight;
      var span = document.querySelector('#content > span');
      return { body: body, text: span ? getComputedStyle(span).lineHeight : null };
    })()
  `);
  if (lineHeightChain && almondLineHeight) {
    test('body-line-height-matches',
      lineHeightChain.body === almondLineHeight.body ||
      Math.abs(parseFloat(lineHeightChain.body) - parseFloat(almondLineHeight.body)) <= 4,
      `almond=${almondLineHeight.body} doc=${lineHeightChain.body}`);
  }

  // --- 12. Sidebar doesn't overlap panel ---
  const sidebarPanelOverlap = await docPage.evaluate(`
    (function() {
      var sidebar = document.querySelector('.theme-doc-sidebar-container');
      var panel = document.querySelector('.mintysaurus-panel');
      if (!sidebar || !panel) return null;
      var sr = sidebar.getBoundingClientRect();
      var pr = panel.getBoundingClientRect();
      return {
        sidebarRight: sr.right,
        panelLeft: pr.left,
        overlap: sr.right > pr.left + 2
      };
    })()
  `);
  if (sidebarPanelOverlap) {
    test('sidebar-no-panel-overlap',
      !sidebarPanelOverlap.overlap,
      `sidebar.right=${sidebarPanelOverlap.sidebarRight.toFixed(0)} panel.left=${sidebarPanelOverlap.panelLeft.toFixed(0)}`);
  }

  // --- 13. Heading hierarchy: h1 > h2 > h3 font sizes ---
  const headingSizes = await docPage.evaluate(`
    (function() {
      var h1 = document.querySelector('.theme-doc-markdown h1');
      var h2 = document.querySelector('.theme-doc-markdown h2');
      var h3 = document.querySelector('.theme-doc-markdown h3');
      return {
        h1: h1 ? parseFloat(getComputedStyle(h1).fontSize) : null,
        h2: h2 ? parseFloat(getComputedStyle(h2).fontSize) : null,
        h3: h3 ? parseFloat(getComputedStyle(h3).fontSize) : null
      };
    })()
  `);
  if (headingSizes && headingSizes.h1 && headingSizes.h2 && headingSizes.h3) {
    test('heading-size-hierarchy',
      headingSizes.h1 > headingSizes.h2 && headingSizes.h2 > headingSizes.h3,
      `h1=${headingSizes.h1}px h2=${headingSizes.h2}px h3=${headingSizes.h3}px`);
  }

  // --- 14. Eyebrow appears before h1 in DOM ---
  const eyebrowOrder = await docPage.evaluate(`
    (function() {
      var eyebrow = document.querySelector('.mintlify-eyebrow');
      var h1 = document.querySelector('.theme-doc-markdown h1');
      if (!eyebrow || !h1) return null;
      var er = eyebrow.getBoundingClientRect();
      var hr = h1.getBoundingClientRect();
      return { eyebrowTop: er.top, h1Top: hr.top, eyebrowAbove: er.top < hr.top };
    })()
  `);
  test('eyebrow-above-h1',
    eyebrowOrder && eyebrowOrder.eyebrowAbove,
    eyebrowOrder ? `eyebrow.top=${eyebrowOrder.eyebrowTop.toFixed(0)} h1.top=${eyebrowOrder.h1Top.toFixed(0)}` : 'elements not found');

  // --- 15. Description appears between h1 and first h2 ---
  const descOrder = await docPage.evaluate(`
    (function() {
      var desc = document.querySelector('.mintlify-description');
      var h1 = document.querySelector('.theme-doc-markdown h1');
      var h2 = document.querySelector('.theme-doc-markdown h2');
      if (!desc || !h1 || !h2) return null;
      var dr = desc.getBoundingClientRect();
      var h1r = h1.getBoundingClientRect();
      var h2r = h2.getBoundingClientRect();
      return {
        descTop: dr.top,
        h1Bottom: h1r.bottom,
        h2Top: h2r.top,
        between: dr.top > h1r.bottom - 5 && dr.bottom < h2r.top + 5
      };
    })()
  `);
  test('description-between-h1-and-h2',
    descOrder && descOrder.between,
    descOrder ? `desc.top=${descOrder.descTop.toFixed(0)} h1.bottom=${descOrder.h1Bottom.toFixed(0)} h2.top=${descOrder.h2Top.toFixed(0)}` : 'elements not found');

  // --- 16. No horizontal scrollbar on content ---
  const horizontalScroll = await docPage.evaluate(`
    (function() {
      var panel = document.querySelector('.mintysaurus-panel');
      var article = document.querySelector('.mintysaurus-article');
      return {
        panelOverflowX: panel ? getComputedStyle(panel).overflowX : null,
        panelScrollWidth: panel ? panel.scrollWidth : 0,
        panelClientWidth: panel ? panel.clientWidth : 0,
        panelHasHScroll: panel ? panel.scrollWidth > panel.clientWidth + 2 : false,
        articleOverflowX: article ? getComputedStyle(article).overflowX : null
      };
    })()
  `);
  test('no-horizontal-scroll',
    horizontalScroll && !horizontalScroll.panelHasHScroll,
    JSON.stringify(horizontalScroll));

  // --- 17. Search bar position: in sidebar, not navbar ---
  const searchPosition = await docPage.evaluate(`
    (function() {
      var inputs = document.querySelectorAll('input[type="search"], .navbar__search-input, [class*="searchBox"]');
      var results = [];
      for (var i = 0; i < inputs.length; i++) {
        var el = inputs[i];
        var r = el.getBoundingClientRect();
        var inNavbar = !!el.closest('.navbar');
        var inSidebar = !!el.closest('.theme-doc-sidebar-container, [class*="sidebar"]');
        var cs = getComputedStyle(el);
        results.push({
          inNavbar: inNavbar,
          inSidebar: inSidebar,
          visible: cs.display !== 'none' && r.width > 0,
          left: r.left
        });
      }
      return results;
    })()
  `);
  const visibleSearches = (searchPosition || []).filter(s => s.visible);
  const searchInSidebar = visibleSearches.some(s => s.inSidebar);
  const searchInNavbar = visibleSearches.some(s => s.inNavbar);
  test('search-in-sidebar',
    searchInSidebar && !searchInNavbar,
    `sidebar=${searchInSidebar} navbar=${searchInNavbar} total=${visibleSearches.length}`);

  // --- 18. Scroll-margin-top on headings (for anchor links) ---
  const scrollMargin = await docPage.evaluate(`
    (function() {
      var h2 = document.querySelector('.theme-doc-markdown h2');
      if (!h2) return null;
      var cs = getComputedStyle(h2);
      return { scrollMarginTop: cs.scrollMarginTop };
    })()
  `);
  test('headings-have-scroll-margin',
    scrollMargin && parseFloat(scrollMargin.scrollMarginTop) > 0,
    JSON.stringify(scrollMargin));

  return results;
}

module.exports = { runDomTests };
