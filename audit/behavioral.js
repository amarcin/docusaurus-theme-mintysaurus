// Behavioral tests: scroll tracking, hover states, sticky positioning, interactions.
// These can't be tested by static CSS comparison alone.

async function runBehavioralTests(page, site) {
  const results = [];

  function test(name, pass, detail) {
    results.push({ name: `[${site}] ${name}`, pass, detail });
  }

  if (site !== 'docusaurus') return results;

  // 1. Scroll container: content scrolls inside the panel, not the document
  const scrollInfo = await page.evaluate(`
    (function() {
      var panel = document.querySelector('.mintysaurus-panel');
      if (!panel) return { error: 'no panel' };
      var cs = getComputedStyle(panel);
      return {
        overflowY: cs.overflowY,
        scrollHeight: panel.scrollHeight,
        clientHeight: panel.clientHeight,
        canScroll: panel.scrollHeight > panel.clientHeight
      };
    })()
  `);
  test('panel-is-scroll-container',
    scrollInfo && scrollInfo.overflowY === 'auto' && scrollInfo.canScroll,
    JSON.stringify(scrollInfo));

  // 2. TOC sticky positioning
  const tocSticky = await page.evaluate(`
    (function() {
      var toc = document.querySelector('.mintysaurus-toc > div');
      if (!toc) return { error: 'no toc' };
      var cs = getComputedStyle(toc);
      return { position: cs.position, top: cs.top };
    })()
  `);
  test('toc-is-sticky',
    tocSticky && tocSticky.position === 'sticky',
    JSON.stringify(tocSticky));

  // 3. TOC active tracking on scroll
  const before = await page.evaluate(`
    (function() {
      var active = document.querySelector('.table-of-contents__link--active');
      return active ? active.textContent.trim() : null;
    })()
  `);
  await page.scrollTo('.mintysaurus-panel', 800);
  const after = await page.evaluate(`
    (function() {
      var active = document.querySelector('.table-of-contents__link--active');
      return active ? active.textContent.trim() : null;
    })()
  `);
  await page.scrollTo('.mintysaurus-panel', 0);
  test('toc-tracks-scroll',
    before !== null && after !== null,
    `before="${before}" after="${after}"`);

  // 4. Sidebar link hover state changes background
  const linkSelector = 'ul.menu__list .menu__link:not(.menu__link--active):not(.menu__link--sublist):not(.menu__link--sublist-caret)';
  const preHover = await page.evaluate(`
    (function() {
      var el = document.querySelector('${linkSelector}');
      if (!el) return null;
      var cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    })()
  `);
  await page.hover(linkSelector);
  const postHover = await page.evaluate(`
    (function() {
      var el = document.querySelector('${linkSelector}');
      if (!el) return null;
      var cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    })()
  `);
  test('sidebar-link-hover-changes',
    preHover && postHover && (preHover.bg !== postHover.bg || preHover.color !== postHover.color),
    `pre=${JSON.stringify(preHover)} post=${JSON.stringify(postHover)}`);

  // 5. Heading anchor link appears on hover
  const preHoverAnchor = await page.evaluate(`
    (function() {
      var h = document.querySelector('.theme-doc-markdown h2 .hash-link');
      if (!h) return null;
      return { opacity: getComputedStyle(h).opacity };
    })()
  `);
  await page.hover('.theme-doc-markdown h2');
  const postHoverAnchor = await page.evaluate(`
    (function() {
      var h = document.querySelector('.theme-doc-markdown h2 .hash-link');
      if (!h) return null;
      return { opacity: getComputedStyle(h).opacity };
    })()
  `);
  test('heading-anchor-shows-on-hover',
    preHoverAnchor && postHoverAnchor &&
    parseFloat(preHoverAnchor.opacity) < 0.5 && parseFloat(postHoverAnchor.opacity) > 0.5,
    `pre=${JSON.stringify(preHoverAnchor)} post=${JSON.stringify(postHoverAnchor)}`);

  // 6. Panel border-radius should match Almond (16px all corners)
  const panelRadius = await page.evaluate(`
    (function() {
      var p = document.querySelector('.mintysaurus-panel');
      if (!p) return null;
      var cs = getComputedStyle(p);
      return {
        topLeft: cs.borderTopLeftRadius,
        topRight: cs.borderTopRightRadius,
        bottomLeft: cs.borderBottomLeftRadius,
        bottomRight: cs.borderBottomRightRadius
      };
    })()
  `);
  test('panel-radius-all-16px',
    panelRadius &&
    parseFloat(panelRadius.topLeft) === 16 &&
    parseFloat(panelRadius.topRight) === 16 &&
    parseFloat(panelRadius.bottomLeft) === 16 &&
    parseFloat(panelRadius.bottomRight) === 16,
    JSON.stringify(panelRadius));

  // 7. Sidebar has no right border
  const sidebarBorder = await page.evaluate(`
    (function() {
      var s = document.querySelector('.theme-doc-sidebar-container');
      if (!s) return null;
      var cs = getComputedStyle(s);
      return { borderRightWidth: cs.borderRightWidth, borderRightStyle: cs.borderRightStyle };
    })()
  `);
  test('sidebar-no-right-border',
    sidebarBorder && (sidebarBorder.borderRightWidth === '0px' || sidebarBorder.borderRightStyle === 'none'),
    JSON.stringify(sidebarBorder));

  // 8. Footer hidden on docs pages
  const footerVisible = await page.evaluate(`
    (function() {
      var f = document.querySelector('.theme-layout-footer');
      if (!f) return { exists: false };
      var cs = getComputedStyle(f);
      return { exists: true, display: cs.display, visibility: cs.visibility };
    })()
  `);
  test('footer-hidden-on-docs',
    footerVisible && (footerVisible.display === 'none' || !footerVisible.exists),
    JSON.stringify(footerVisible));

  // 9. Breadcrumbs hidden
  const breadcrumbs = await page.evaluate(`
    (function() {
      var b = document.querySelector('.theme-doc-breadcrumbs');
      if (!b) return { exists: false };
      var cs = getComputedStyle(b);
      return { exists: true, display: cs.display };
    })()
  `);
  test('breadcrumbs-hidden',
    breadcrumbs && (!breadcrumbs.exists || breadcrumbs.display === 'none'),
    JSON.stringify(breadcrumbs));

  // 10. Search bar in sidebar (not navbar)
  const searchLocation = await page.evaluate(`
    (function() {
      var navSearch = document.querySelector('.navbar .navbar__search-input');
      var sidebarSearch = document.querySelector('.sidebar-search-container .navbar__search-input');
      var navVisible = navSearch ? getComputedStyle(navSearch.closest('.navbar__search') || navSearch).display : 'none';
      return {
        navbarSearchVisible: navVisible !== 'none',
        sidebarSearchExists: !!sidebarSearch
      };
    })()
  `);
  test('search-in-sidebar-not-navbar',
    searchLocation && !searchLocation.navbarSearchVisible && searchLocation.sidebarSearchExists,
    JSON.stringify(searchLocation));

  // 11. Pagination link hover changes border color (scroll to pagination first)
  await page.scrollTo('.mintysaurus-panel', 99999);
  await new Promise(r => setTimeout(r, 300));
  const preHoverPag = await page.evaluate(`
    (function() {
      var el = document.querySelector('.pagination-nav__link');
      if (!el) return null;
      return { borderColor: getComputedStyle(el).borderTopColor };
    })()
  `);
  await page.hover('.pagination-nav__link');
  await new Promise(r => setTimeout(r, 400));
  const postHoverPag = await page.evaluate(`
    (function() {
      var el = document.querySelector('.pagination-nav__link');
      if (!el) return null;
      return { borderColor: getComputedStyle(el).borderTopColor };
    })()
  `);
  // Scroll back to top for subsequent tests
  await page.scrollTo('.mintysaurus-panel', 0);
  test('pagination-hover-changes-border',
    preHoverPag && postHoverPag && preHoverPag.borderColor !== postHoverPag.borderColor,
    `pre=${JSON.stringify(preHoverPag)} post=${JSON.stringify(postHoverPag)}`);

  // 12. Admonition icon-to-text spacing
  const admSpacing = await page.evaluate(`
    (function() {
      var adm = document.querySelector('.theme-admonition');
      if (!adm) return null;
      // Find the heading/title row
      var heading = adm.querySelector('[class*="admonitionHeading"]');
      if (!heading) return { error: 'no heading element' };
      var icon = heading.querySelector('svg, [class*="icon"]');
      // Get the text node or span after the icon
      var textEl = null;
      for (var i = 0; i < heading.childNodes.length; i++) {
        var node = heading.childNodes[i];
        if (node.nodeType === 3 && node.textContent.trim().length > 0) {
          textEl = node; break;
        }
        if (node.nodeType === 1 && node !== icon && !node.querySelector('svg')) {
          textEl = node; break;
        }
      }
      if (!icon) return { error: 'no icon found' };
      var iconRect = icon.getBoundingClientRect();
      var headingRect = heading.getBoundingClientRect();
      var cs = getComputedStyle(heading);
      return {
        headingDisplay: cs.display,
        headingGap: cs.gap,
        iconRight: iconRect.right,
        headingLeft: headingRect.left,
        iconWidth: iconRect.width
      };
    })()
  `);
  test('admonition-heading-has-gap',
    admSpacing && (admSpacing.headingGap !== 'normal' && admSpacing.headingGap !== '0px' || admSpacing.headingDisplay === 'flex'),
    JSON.stringify(admSpacing));

  // 13. Code block with title has visible title bar
  const codeTitleBar = await page.evaluate(`
    (function() {
      var titles = document.querySelectorAll('[class*="codeBlockTitle"]');
      for (var i = 0; i < titles.length; i++) {
        var cs = getComputedStyle(titles[i]);
        var r = titles[i].getBoundingClientRect();
        if (cs.display !== 'none' && r.height > 0) {
          return {
            exists: true,
            text: titles[i].textContent.trim(),
            height: r.height,
            fontSize: cs.fontSize,
            borderBottom: cs.borderBottomWidth
          };
        }
      }
      return { exists: false };
    })()
  `);
  test('code-block-title-visible',
    codeTitleBar && codeTitleBar.exists,
    JSON.stringify(codeTitleBar));

  // 14. Inline code has distinct background
  const inlineCodeBg = await page.evaluate(`
    (function() {
      var codes = document.querySelectorAll('.theme-doc-markdown code');
      for (var i = 0; i < codes.length; i++) {
        if (!codes[i].closest('pre')) {
          var cs = getComputedStyle(codes[i]);
          return {
            bg: cs.backgroundColor,
            hasDistinctBg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent',
            borderRadius: cs.borderRadius,
            padding: cs.padding
          };
        }
      }
      return null;
    })()
  `);
  test('inline-code-has-background',
    inlineCodeBg && inlineCodeBg.hasDistinctBg,
    JSON.stringify(inlineCodeBg));

  // 15. Active sidebar link has distinct background
  const activeLinkBg = await page.evaluate(`
    (function() {
      var links = document.querySelectorAll('.menu__link--active:not(.menu__link--sublist)');
      for (var i = 0; i < links.length; i++) {
        if (getComputedStyle(links[i]).pointerEvents !== 'none') {
          var cs = getComputedStyle(links[i]);
          return {
            bg: cs.backgroundColor,
            hasDistinctBg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent',
            color: cs.color,
            fontWeight: cs.fontWeight
          };
        }
      }
      return null;
    })()
  `);
  test('active-sidebar-link-has-background',
    activeLinkBg && activeLinkBg.hasDistinctBg,
    JSON.stringify(activeLinkBg));

  // 16. TOC active link has left border indicator
  const tocActiveBorder = await page.evaluate(`
    (function() {
      var link = document.querySelector('.table-of-contents__link--active');
      if (!link) return null;
      var cs = getComputedStyle(link);
      return {
        borderLeftWidth: cs.borderLeftWidth,
        borderLeftColor: cs.borderLeftColor,
        borderLeftStyle: cs.borderLeftStyle,
        hasBorder: parseFloat(cs.borderLeftWidth) > 0 && cs.borderLeftStyle !== 'none'
      };
    })()
  `);
  test('toc-active-has-left-border',
    tocActiveBorder && tocActiveBorder.hasBorder,
    JSON.stringify(tocActiveBorder));

  // 17. Navbar is transparent (not opaque white/colored)
  const navbarBg = await page.evaluate(`
    (function() {
      var nav = document.querySelector('.navbar');
      if (!nav) return null;
      var cs = getComputedStyle(nav);
      return {
        bg: cs.backgroundColor,
        isTransparent: cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent'
      };
    })()
  `);
  test('navbar-is-transparent',
    navbarBg && navbarBg.isTransparent,
    JSON.stringify(navbarBg));

  // 18. Panel has bottom padding/margin (content doesn't touch bottom edge)
  const panelBottom = await page.evaluate(`
    (function() {
      var panel = document.querySelector('.mintysaurus-panel');
      if (!panel) return null;
      var cs = getComputedStyle(panel);
      var r = panel.getBoundingClientRect();
      return {
        paddingBottom: cs.paddingBottom,
        marginBottom: cs.marginBottom,
        bottomEdge: r.bottom,
        viewportHeight: window.innerHeight,
        hasPadding: parseFloat(cs.paddingBottom) > 0 || parseFloat(cs.marginBottom) > 0
      };
    })()
  `);
  test('panel-has-bottom-spacing',
    panelBottom && parseFloat(panelBottom.paddingBottom) >= 8,
    JSON.stringify(panelBottom));

  // 19. TOC link hover changes color
  const tocLinkSel = '.table-of-contents__link:not(.table-of-contents__link--active)';
  const preTocHover = await page.evaluate(`
    (function() {
      var el = document.querySelector('${tocLinkSel}');
      if (!el) return null;
      return { color: getComputedStyle(el).color };
    })()
  `);
  await page.hover(tocLinkSel);
  const postTocHover = await page.evaluate(`
    (function() {
      var el = document.querySelector('${tocLinkSel}');
      if (!el) return null;
      return { color: getComputedStyle(el).color };
    })()
  `);
  test('toc-link-hover-changes-color',
    preTocHover && postTocHover && preTocHover.color !== postTocHover.color,
    `pre=${JSON.stringify(preTocHover)} post=${JSON.stringify(postTocHover)}`);

  // 20. Body link hover shows underline
  const linkSel = '.theme-doc-markdown p a';
  const preLinkHover = await page.evaluate(`
    (function() {
      var el = document.querySelector('${linkSel}');
      if (!el) return null;
      return { textDecoration: getComputedStyle(el).textDecorationLine };
    })()
  `);
  await page.hover(linkSel);
  const postLinkHover = await page.evaluate(`
    (function() {
      var el = document.querySelector('${linkSel}');
      if (!el) return null;
      return { textDecoration: getComputedStyle(el).textDecorationLine };
    })()
  `);
  test('link-hover-shows-underline',
    postLinkHover && postLinkHover.textDecoration.includes('underline'),
    `pre=${JSON.stringify(preLinkHover)} post=${JSON.stringify(postLinkHover)}`);

  // 21. Sidebar group header is expandable (has caret/toggle)
  const sidebarGroupToggle = await page.evaluate(`
    (function() {
      var el = document.querySelector('.menu__list-item-collapsible');
      if (!el) return null;
      var caret = el.querySelector('.menu__caret, .menu__link--sublist-caret, [class*="caret"]');
      var link = el.querySelector('.menu__link--sublist');
      return {
        hasCollapsible: true,
        hasCaret: !!caret,
        hasSublistLink: !!link
      };
    })()
  `);
  test('sidebar-group-expandable',
    sidebarGroupToggle && (sidebarGroupToggle.hasCaret || sidebarGroupToggle.hasSublistLink),
    JSON.stringify(sidebarGroupToggle));

  // 22. Table spans reasonable width (not auto-shrunk)
  const tableSpan = await page.evaluate(`
    (function() {
      var table = document.querySelector('.theme-doc-markdown table');
      var article = document.querySelector('.mintysaurus-article');
      if (!table || !article) return null;
      var tw = table.getBoundingClientRect().width;
      var aw = article.getBoundingClientRect().width;
      return { tableWidth: tw, articleWidth: aw, ratio: tw / aw };
    })()
  `);
  test('table-spans-content-width',
    tableSpan && tableSpan.ratio >= 0.5,
    tableSpan ? `table=${tableSpan.tableWidth.toFixed(0)}px article=${tableSpan.articleWidth.toFixed(0)}px ratio=${(tableSpan.ratio * 100).toFixed(0)}%` : 'not found');

  // 23. Pagination visual order: title appears above sublabel
  const pagOrder = await page.evaluate(`
    (function() {
      var link = document.querySelector('.pagination-nav__link');
      if (!link) return null;
      var sub = link.querySelector('.pagination-nav__sublabel');
      var label = link.querySelector('.pagination-nav__label');
      if (!sub || !label) return null;
      var sr = sub.getBoundingClientRect();
      var lr = label.getBoundingClientRect();
      return { sublabelTop: sr.top, labelTop: lr.top, titleAbove: lr.top < sr.top };
    })()
  `);
  test('pagination-title-above-sublabel',
    pagOrder && pagOrder.titleAbove,
    JSON.stringify(pagOrder));

  // 24. Navbar stays above content during scroll
  await page.scrollTo('.mintysaurus-panel', 500);
  const navOverContent = await page.evaluate(`
    (function() {
      var nav = document.querySelector('.navbar');
      var panel = document.querySelector('.mintysaurus-panel');
      if (!nav || !panel) return null;
      var nr = nav.getBoundingClientRect();
      var pr = panel.getBoundingClientRect();
      var navZ = parseInt(getComputedStyle(nav).zIndex) || 0;
      return {
        navbarTop: nr.top,
        navbarVisible: nr.top >= 0 && nr.height > 0,
        navbarAbovePanel: nr.top <= pr.top,
        zIndex: navZ
      };
    })()
  `);
  await page.scrollTo('.mintysaurus-panel', 0);
  test('navbar-visible-during-scroll',
    navOverContent && navOverContent.navbarVisible && navOverContent.zIndex >= 10,
    JSON.stringify(navOverContent));

  // 25. Anchor link scroll: clicking a TOC link scrolls to the heading
  const anchorScroll = await page.evaluate(`
    (function() {
      var panel = document.querySelector('.mintysaurus-panel');
      if (!panel) return null;
      var beforeScroll = panel.scrollTop;
      // Find a TOC link and simulate click
      var tocLink = document.querySelector('.table-of-contents__link:not(.table-of-contents__link--active)');
      if (!tocLink) return { error: 'no toc link' };
      var href = tocLink.getAttribute('href');
      if (!href) return { error: 'no href' };
      tocLink.click();
      // Check scroll position changed
      return new Promise(function(resolve) {
        setTimeout(function() {
          var afterScroll = panel.scrollTop;
          resolve({
            before: beforeScroll,
            after: afterScroll,
            scrolled: Math.abs(afterScroll - beforeScroll) > 10,
            href: href
          });
        }, 500);
      });
    })()
  `);
  test('anchor-link-scrolls-to-heading',
    anchorScroll && anchorScroll.scrolled,
    JSON.stringify(anchorScroll));
  // Reset scroll
  await page.scrollTo('.mintysaurus-panel', 0);

  return results;
}

module.exports = { runBehavioralTests };
