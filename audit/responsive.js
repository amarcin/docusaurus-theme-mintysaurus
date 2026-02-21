// Responsive tests: verify layout correctness at multiple breakpoints.
// Each breakpoint checks element visibility, panel styling, and layout structure.

const BREAKPOINTS = [
  { name: '1440-desktop', width: 1440, height: 900 },
  { name: '1024-small-desktop', width: 1024, height: 768 },
  { name: '768-tablet', width: 768, height: 1024 },
  { name: '375-mobile', width: 375, height: 812 },
];

async function runResponsiveTests(openPageFn, almondUrl, docUrl, closeAssistantFn) {
  const results = [];

  function test(name, pass, detail) {
    results.push({ name, pass, detail: detail || '' });
  }

  for (const bp of BREAKPOINTS) {
    const prefix = `[${bp.name}]`;

    let almond, doc;
    try {
      almond = await openPageFn(almondUrl, bp.width, bp.height);
      if (bp.width >= 1024 && closeAssistantFn) await closeAssistantFn(almond);
      doc = await openPageFn(docUrl, bp.width, bp.height);
    } catch (e) {
      test(`${prefix} open-pages`, false, e.message);
      if (almond) await almond.destroy().catch(() => {});
      if (doc) await doc.destroy().catch(() => {});
      continue;
    }

    try {
      // --- Panel existence and border-radius ---
      const almondPanel = await almond.evaluate(`
        (function() {
          var el = document.querySelector('#content-container');
          if (!el) return null;
          var cs = getComputedStyle(el);
          var r = el.getBoundingClientRect();
          return {
            exists: true,
            borderRadius: cs.borderTopLeftRadius,
            bg: cs.backgroundColor,
            width: r.width,
            left: r.left,
            visible: cs.display !== 'none' && cs.visibility !== 'hidden'
          };
        })()
      `);
      const docPanel = await doc.evaluate(`
        (function() {
          var el = document.querySelector('.mintysaurus-panel');
          if (!el) return null;
          var cs = getComputedStyle(el);
          var r = el.getBoundingClientRect();
          return {
            exists: true,
            borderRadius: cs.borderTopLeftRadius,
            bg: cs.backgroundColor,
            width: r.width,
            left: r.left,
            visible: cs.display !== 'none' && cs.visibility !== 'hidden'
          };
        })()
      `);

      if (almondPanel && almondPanel.visible) {
        test(`${prefix} panel-exists`,
          docPanel && docPanel.visible,
          `almond=visible doc=${docPanel ? (docPanel.visible ? 'visible' : 'hidden') : 'missing'}`);

        if (docPanel && docPanel.visible) {
          const aRadius = parseFloat(almondPanel.borderRadius) || 0;
          const dRadius = parseFloat(docPanel.borderRadius) || 0;
          test(`${prefix} panel-border-radius`,
            Math.abs(aRadius - dRadius) <= 2,
            `almond=${aRadius}px doc=${dRadius}px`);
        }
      }

      // --- Sidebar visibility ---
      const almondSidebar = await almond.evaluate(`
        (function() {
          var el = document.querySelector('#sidebar-content');
          if (!el) return { visible: false };
          var r = el.getBoundingClientRect();
          var cs = getComputedStyle(el);
          return {
            visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.left >= -10,
            width: r.width
          };
        })()
      `);
      const docSidebar = await doc.evaluate(`
        (function() {
          var el = document.querySelector('.theme-doc-sidebar-container');
          if (!el) return { visible: false };
          var r = el.getBoundingClientRect();
          var cs = getComputedStyle(el);
          return {
            visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.left >= -10,
            width: r.width
          };
        })()
      `);

      test(`${prefix} sidebar-visibility-matches`,
        almondSidebar.visible === docSidebar.visible,
        `almond=${almondSidebar.visible ? 'visible(' + almondSidebar.width + 'px)' : 'hidden'} doc=${docSidebar.visible ? 'visible(' + docSidebar.width + 'px)' : 'hidden'}`);

      // --- TOC visibility ---
      const almondToc = await almond.evaluate(`
        (function() {
          var el = document.querySelector('#table-of-contents');
          if (!el) return { visible: false };
          var r = el.getBoundingClientRect();
          var cs = getComputedStyle(el);
          return {
            visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.right <= ${bp.width + 10},
            width: r.width
          };
        })()
      `);
      const docToc = await doc.evaluate(`
        (function() {
          var el = document.querySelector('.mintysaurus-toc');
          if (!el) return { visible: false };
          var r = el.getBoundingClientRect();
          var cs = getComputedStyle(el);
          return {
            visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.right <= ${bp.width + 10},
            width: r.width
          };
        })()
      `);

      test(`${prefix} toc-visibility-matches`,
        almondToc.visible === docToc.visible,
        `almond=${almondToc.visible ? 'visible(' + almondToc.width + 'px)' : 'hidden'} doc=${docToc.visible ? 'visible(' + docToc.width + 'px)' : 'hidden'}`);

      // --- Breadcrumbs visibility ---
      const almondBreadcrumbs = await almond.evaluate(`
        (function() {
          var el = document.querySelector('nav[aria-label="breadcrumb"], .breadcrumbs, [class*="breadcrumb"]');
          if (!el) return { visible: false };
          var cs = getComputedStyle(el);
          return { visible: cs.display !== 'none' && cs.visibility !== 'hidden' };
        })()
      `);
      const docBreadcrumbs = await doc.evaluate(`
        (function() {
          var el = document.querySelector('.theme-doc-breadcrumbs, nav[aria-label="Breadcrumbs"]');
          if (!el) return { visible: false };
          var cs = getComputedStyle(el);
          return { visible: cs.display !== 'none' && cs.visibility !== 'hidden' };
        })()
      `);

      test(`${prefix} breadcrumbs-visibility-matches`,
        almondBreadcrumbs.visible === docBreadcrumbs.visible,
        `almond=${almondBreadcrumbs.visible ? 'visible' : 'hidden'} doc=${docBreadcrumbs.visible ? 'visible' : 'hidden'}`);

      // --- Navbar position ---
      const almondNav = await almond.evaluate(`
        (function() {
          var el = document.querySelector('#navbar');
          if (!el) return null;
          var cs = getComputedStyle(el);
          return { position: cs.position, height: parseFloat(cs.height) };
        })()
      `);
      const docNav = await doc.evaluate(`
        (function() {
          var el = document.querySelector('.navbar');
          if (!el) return null;
          var cs = getComputedStyle(el);
          return { position: cs.position, height: parseFloat(cs.height) };
        })()
      `);

      if (almondNav && docNav) {
        test(`${prefix} navbar-position`,
          almondNav.position === docNav.position,
          `almond=${almondNav.position} doc=${docNav.position}`);
      }

      // --- Content area doesn't overflow viewport ---
      const docContentOverflow = await doc.evaluate(`
        (function() {
          var article = document.querySelector('.mintysaurus-article') || document.querySelector('article');
          if (!article) return null;
          var r = article.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            width: r.width,
            viewportWidth: ${bp.width},
            overflowsRight: r.right > ${bp.width + 5},
            overflowsLeft: r.left < -5,
            tooNarrow: r.width < 200
          };
        })()
      `);

      if (docContentOverflow) {
        test(`${prefix} content-no-overflow`,
          !docContentOverflow.overflowsRight && !docContentOverflow.overflowsLeft,
          `left=${docContentOverflow.left.toFixed(0)} right=${docContentOverflow.right.toFixed(0)} viewport=${bp.width}`);

        test(`${prefix} content-not-too-narrow`,
          !docContentOverflow.tooNarrow,
          `width=${docContentOverflow.width.toFixed(0)}px (min 200px)`);
      }

      // --- Mobile: hamburger menu exists ---
      if (bp.width < 997) {
        const docHamburger = await doc.evaluate(`
          (function() {
            var el = document.querySelector('.navbar__toggle, button[aria-label="Toggle navigation bar"]');
            if (!el) return { exists: false };
            var cs = getComputedStyle(el);
            return { exists: true, visible: cs.display !== 'none' };
          })()
        `);
        test(`${prefix} hamburger-menu-exists`,
          docHamburger && docHamburger.exists && docHamburger.visible,
          JSON.stringify(docHamburger));
      }

      // --- Footer hidden on docs at all breakpoints ---
      const docFooter = await doc.evaluate(`
        (function() {
          var el = document.querySelector('.theme-layout-footer, footer.footer');
          if (!el) return { visible: false };
          var cs = getComputedStyle(el);
          return { visible: cs.display !== 'none' && cs.visibility !== 'hidden' };
        })()
      `);
      test(`${prefix} footer-hidden`,
        !docFooter.visible,
        `visible=${docFooter.visible}`);

    } finally {
      await almond.destroy().catch(() => {});
      await doc.destroy().catch(() => {});
    }
  }

  return results;
}

module.exports = { runResponsiveTests, BREAKPOINTS };
