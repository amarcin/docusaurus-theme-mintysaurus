// Element mapping: what to compare between Almond and Docusaurus
//
// `skip` — properties that CANNOT be the same (e.g. fontFamily)
// `focus` — most important properties. Mismatches here = CRITICAL failure.
//
// RULE: Do NOT add properties to `skip` just because they currently differ.

const GLOBAL_SKIP = [
  'fontFamily',  // Different fonts (Inter vs Google Sans)
];

module.exports = [
  // ─── PAGE LAYOUT ───────────────────────────────────────────
  {
    name: 'page-background',
    description: 'Background area behind the content panel',
    almond: { selector: '.almond-layout' },
    docusaurus: { selector: '[class*="docsWrapper"]' },
    skip: [...GLOBAL_SKIP],
    focus: ['backgroundColor', 'paddingLeft', 'paddingRight', 'paddingBottom'],
  },
  {
    name: 'content-panel',
    description: 'White card containing content + TOC',
    almond: { selector: '#content-container' },
    docusaurus: { selector: '.mintysaurus-panel' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'backgroundColor',
      'borderTopLeftRadius', 'borderTopRightRadius',
      'borderBottomLeftRadius', 'borderBottomRightRadius',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'paddingTop', 'paddingRight', 'paddingLeft',
      'overflowY', 'boxShadow',
    ],
  },
  {
    name: 'content-row',
    description: 'Flex row containing article + TOC',
    almond: { eval: `document.querySelector('#content-container > div')` },
    docusaurus: { selector: '.mintysaurus-content-row' },
    skip: [...GLOBAL_SKIP],
    focus: ['display', 'flexDirection', 'gap', 'columnGap', 'paddingLeft',
            'justifyContent', 'maxWidth', 'marginLeft', 'marginRight'],
  },
  {
    name: 'content-area',
    description: 'Article content column',
    almond: { selector: '#content-area' },
    docusaurus: { selector: '.mintysaurus-article' },
    skip: [...GLOBAL_SKIP],
    focus: ['maxWidth', 'width', 'overflowX'],
  },

  // ─── SIDEBAR ───────────────────────────────────────────────
  {
    name: 'sidebar',
    description: 'Left sidebar container',
    almond: { selector: '#sidebar-content' },
    docusaurus: { selector: '.theme-doc-sidebar-container' },
    skip: [...GLOBAL_SKIP],
    focus: ['width', 'minWidth', 'backgroundColor', 'borderRightWidth', 'overflowY'],
  },
  {
    name: 'sidebar-link',
    description: 'Normal sidebar link (inactive)',
    almond: {
      eval: `(function() {
        var links = document.querySelectorAll('.sidebar-group a');
        for (var i = 0; i < links.length; i++) {
          var cs = getComputedStyle(links[i]);
          if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') return links[i];
        }
        return links[0];
      })()`,
    },
    docusaurus: {
      eval: `(function() {
        var links = document.querySelectorAll('ul.menu__list .menu__link:not(.menu__link--active):not(.menu__link--sublist):not(.menu__link--sublist-caret)');
        return links[0];
      })()`,
    },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'lineHeight', 'fontWeight', 'color',
      'backgroundColor', 'borderRadius',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    ],
  },
  {
    name: 'sidebar-link-active',
    description: 'Active sidebar link',
    almond: {
      eval: `(function() {
        var links = document.querySelectorAll('.sidebar-group a');
        for (var i = 0; i < links.length; i++) {
          var cs = getComputedStyle(links[i]);
          if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') return links[i];
        }
        return null;
      })()`,
    },
    docusaurus: {
      eval: `(function() {
        var links = document.querySelectorAll('.menu__link--active:not(.menu__link--sublist)');
        for (var i = 0; i < links.length; i++) {
          if (getComputedStyle(links[i]).pointerEvents !== 'none') return links[i];
        }
        return null;
      })()`,
    },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'lineHeight', 'fontWeight', 'color',
      'backgroundColor', 'borderRadius',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    ],
  },
  {
    name: 'sidebar-group-header',
    description: 'Sidebar group header (e.g. "Essentials")',
    almond: { selector: '.sidebar-group-header' },
    docusaurus: {
      eval: `document.querySelector('.theme-doc-sidebar-item-category-level-1 > .menu__list-item-collapsible > .menu__link')`,
    },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'color', 'lineHeight',
      'paddingLeft', 'backgroundColor', 'textTransform', 'letterSpacing',
    ],
  },

  // ─── TYPOGRAPHY ────────────────────────────────────────────
  {
    name: 'eyebrow',
    description: 'Category label above page title',
    almond: {
      eval: `(function() {
        var h = document.querySelector('#header');
        if (!h) return null;
        var d = h.querySelector('div');
        return d ? d.children[0] : null;
      })()`,
    },
    docusaurus: { selector: '.mintlify-eyebrow' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'fontWeight', 'color', 'lineHeight', 'marginBottom'],
  },
  {
    name: 'h1',
    description: 'Page title (h1)',
    almond: { selector: '#header h1' },
    docusaurus: { selector: '.theme-doc-markdown h1' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
      'color', 'marginBottom', 'marginTop',
    ],
  },
  {
    name: 'description',
    description: 'Page subtitle/description below h1',
    almond: { selector: '#header .prose' },
    docusaurus: { selector: '.mintlify-description' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'lineHeight', 'color', 'fontWeight', 'marginTop', 'marginBottom'],
  },
  {
    name: 'h2',
    description: 'Section heading (h2)',
    almond: { selector: '#content h2' },
    docusaurus: { selector: '.theme-doc-markdown h2' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
      'color', 'marginTop', 'marginBottom', 'paddingBottom', 'borderBottomWidth',
    ],
  },
  {
    name: 'h3',
    description: 'Subsection heading (h3)',
    almond: { selector: '#content h3' },
    docusaurus: { selector: '.theme-doc-markdown h3' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
      'color', 'marginTop', 'marginBottom',
    ],
  },
  {
    name: 'body-paragraph',
    description: 'Body text paragraph',
    almond: {
      eval: `(function() {
        var spans = document.querySelectorAll('#content > span');
        for (var i = 0; i < spans.length; i++) {
          if (spans[i].textContent.trim().length > 20) return spans[i];
        }
        return spans[0];
      })()`,
    },
    docusaurus: {
      eval: `(function() {
        var ps = document.querySelectorAll('.theme-doc-markdown p');
        for (var i = 0; i < ps.length; i++) {
          if (!ps[i].classList.contains('mintlify-eyebrow') && !ps[i].classList.contains('mintlify-description')) return ps[i];
        }
        return null;
      })()`,
    },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'lineHeight', 'color', 'fontWeight', 'marginBottom'],
  },
  {
    name: 'body-link',
    description: 'Inline link in body text',
    almond: { eval: `document.querySelector('#content a:not([class])')` },
    docusaurus: { selector: '.theme-doc-markdown p a' },
    skip: [...GLOBAL_SKIP],
    focus: ['color', 'fontWeight', 'textDecoration'],
  },
  {
    name: 'unordered-list',
    description: 'Unordered list (ul)',
    almond: { eval: `document.querySelector('#content ul')` },
    docusaurus: { selector: '.theme-doc-markdown ul' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'lineHeight', 'color', 'paddingLeft', 'listStyleType', 'marginBottom'],
  },
  {
    name: 'ordered-list',
    description: 'Ordered list (ol)',
    almond: { eval: `document.querySelector('#content ol')` },
    docusaurus: { selector: '.theme-doc-markdown ol' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'lineHeight', 'color', 'paddingLeft', 'listStyleType', 'marginBottom'],
  },
  {
    name: 'list-item',
    description: 'List item (li)',
    almond: { eval: `document.querySelector('#content li')` },
    docusaurus: { selector: '.theme-doc-markdown li' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'lineHeight', 'marginBottom'],
  },

  // ─── TOC ───────────────────────────────────────────────────
  {
    name: 'toc-container',
    description: 'Table of contents container',
    almond: { selector: '#table-of-contents' },
    docusaurus: { selector: '.mintysaurus-toc' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'paddingTop'],
  },
  {
    name: 'toc-heading',
    description: '"On this page" heading above TOC',
    almond: {
      eval: `(function() {
        var toc = document.querySelector('#table-of-contents');
        if (!toc) return null;
        for (var i = 0; i < toc.children.length; i++) {
          if (toc.children[i].textContent.trim().toLowerCase().includes('on this page')) return toc.children[i];
        }
        return null;
      })()`,
    },
    docusaurus: { selector: '.toc-heading' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'fontWeight', 'color', 'marginBottom', 'lineHeight'],
  },
  {
    name: 'toc-link-h2',
    description: 'TOC link for h2 heading (inactive, top-level)',
    almond: {
      eval: `(function() {
        var links = document.querySelectorAll('#table-of-contents a');
        for (var i = 0; i < links.length; i++) {
          var cs = getComputedStyle(links[i]);
          if (cs.fontWeight === '500' && cs.borderLeftColor !== 'rgb(0, 150, 137)' && cs.paddingLeft === '16px') return links[i];
        }
        return links[2] || links[1];
      })()`,
    },
    docusaurus: {
      eval: `(function() {
        var links = document.querySelectorAll('.table-of-contents__link:not(.table-of-contents__link--active)');
        for (var i = 0; i < links.length; i++) {
          var li = links[i].closest('li');
          if (li && !li.classList.contains('toc-h3')) return links[i];
        }
        return links[0];
      })()`,
    },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'lineHeight', 'color',
      'paddingTop', 'paddingBottom', 'paddingLeft',
      'borderLeftWidth', 'borderLeftColor', 'borderLeftStyle',
    ],
  },
  {
    name: 'toc-link-h3',
    description: 'TOC link for h3 heading (indented)',
    almond: {
      eval: `(function() {
        var links = document.querySelectorAll('#table-of-contents a');
        for (var i = 0; i < links.length; i++) {
          var cs = getComputedStyle(links[i]);
          if (cs.fontWeight === '400') return links[i];
        }
        return null;
      })()`,
    },
    docusaurus: {
      eval: `(function() {
        var li = document.querySelector('.table-of-contents li.toc-h3');
        return li ? li.querySelector('a') : null;
      })()`,
    },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'lineHeight', 'color',
      'paddingLeft', 'borderLeftWidth',
    ],
  },
  {
    name: 'toc-link-active',
    description: 'Active TOC link',
    almond: {
      eval: `(function() {
        var links = document.querySelectorAll('#table-of-contents a');
        for (var i = 0; i < links.length; i++) {
          var cs = getComputedStyle(links[i]);
          if (cs.borderLeftColor === 'rgb(0, 150, 137)') return links[i];
        }
        return null;
      })()`,
    },
    docusaurus: { selector: '.table-of-contents__link--active' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'color',
      'borderLeftWidth', 'borderLeftColor', 'borderLeftStyle',
      'paddingLeft',
    ],
  },

  // ─── CODE ──────────────────────────────────────────────────
  {
    name: 'code-block',
    description: 'Fenced code block container',
    almond: { selector: '.code-block' },
    docusaurus: { selector: 'div[class*="codeBlockContainer"]' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'borderRadius',
      'borderTopWidth', 'borderTopColor',
      'borderRightWidth', 'borderRightColor',
      'borderBottomWidth', 'borderBottomColor',
      'borderLeftWidth', 'borderLeftColor',
      'backgroundColor', 'boxShadow', 'marginBottom', 'marginTop', 'overflow',
    ],
  },
  {
    name: 'code-block-pre',
    description: 'Code block pre/code element',
    almond: {
      eval: `document.querySelector('.code-block pre') || document.querySelector('.code-block code')`,
    },
    docusaurus: { selector: '.prism-code' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'lineHeight',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderRadius',
    ],
  },
  {
    name: 'inline-code',
    description: 'Inline code element',
    almond: {
      eval: `(function() {
        var codes = document.querySelectorAll('#content code');
        for (var i = 0; i < codes.length; i++) {
          if (!codes[i].closest('pre') && !codes[i].closest('.code-block')) return codes[i];
        }
        return null;
      })()`,
    },
    docusaurus: {
      eval: `(function() {
        var codes = document.querySelectorAll('.theme-doc-markdown code');
        for (var i = 0; i < codes.length; i++) {
          if (!codes[i].closest('pre')) return codes[i];
        }
        return null;
      })()`,
    },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'color', 'backgroundColor',
      'borderRadius', 'paddingLeft', 'paddingRight',
      'paddingTop', 'paddingBottom',
    ],
  },

  // ─── PAGINATION ────────────────────────────────────────────
  {
    name: 'pagination',
    description: 'Pagination nav container',
    almond: { selector: '#pagination' },
    docusaurus: { selector: '.pagination-nav' },
    skip: [...GLOBAL_SKIP],
    focus: ['display', 'gridTemplateColumns', 'gap', 'marginTop'],
  },
  {
    name: 'pagination-link',
    description: 'Pagination link card',
    almond: { eval: `document.querySelector('#pagination a')` },
    docusaurus: { selector: '.pagination-nav__link' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'borderRadius',
      'borderTopWidth', 'borderTopColor',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'display', 'flexDirection',
    ],
  },
  {
    name: 'pagination-title',
    description: 'Pagination link title text',
    almond: {
      eval: `(function() {
        var a = document.querySelector('#pagination a');
        if (!a) return null;
        var els = a.querySelectorAll('span, div, p');
        for (var i = 0; i < els.length; i++) {
          var cs = getComputedStyle(els[i]);
          if (parseFloat(cs.fontWeight) >= 500) return els[i];
        }
        return null;
      })()`,
    },
    docusaurus: { selector: '.pagination-nav__label' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'fontWeight', 'color'],
  },
  {
    name: 'pagination-sublabel',
    description: 'Pagination "Previous"/"Next" sublabel',
    almond: {
      eval: `(function() {
        var a = document.querySelector('#pagination a');
        if (!a) return null;
        var els = a.querySelectorAll('span, div, p');
        for (var i = 0; i < els.length; i++) {
          var cs = getComputedStyle(els[i]);
          if (parseFloat(cs.fontWeight) < 500 && els[i].textContent.trim().length < 20) return els[i];
        }
        return null;
      })()`,
    },
    docusaurus: { selector: '.pagination-nav__sublabel' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'fontWeight', 'color', 'textTransform', 'letterSpacing'],
  },

  // ─── TABLE ─────────────────────────────────────────────────
  {
    name: 'table',
    description: 'Table element',
    almond: { selector: 'table' },
    docusaurus: { selector: '.theme-doc-markdown table' },
    skip: [...GLOBAL_SKIP],
    focus: ['fontSize', 'borderCollapse'],
  },
  {
    name: 'table-header',
    description: 'Table header cell (th)',
    almond: { selector: 'th' },
    docusaurus: { selector: '.theme-doc-markdown th' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'textTransform', 'letterSpacing',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderBottomWidth', 'borderBottomColor',
    ],
  },
  {
    name: 'table-cell',
    description: 'Table data cell (td)',
    almond: { selector: 'td' },
    docusaurus: { selector: '.theme-doc-markdown td' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderBottomWidth', 'borderBottomColor',
    ],
  },

  // ─── BLOCKQUOTE ────────────────────────────────────────────
  {
    name: 'blockquote',
    description: 'Blockquote element',
    almond: { selector: 'blockquote' },
    docusaurus: { selector: '.theme-doc-markdown blockquote' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'borderLeftWidth', 'borderLeftColor', 'borderLeftStyle',
      'paddingLeft', 'paddingTop', 'paddingBottom',
      'marginLeft', 'marginTop', 'marginBottom',
      'backgroundColor', 'borderRadius', 'color',
    ],
  },

  // ─── ADMONITION ────────────────────────────────────────────
  {
    name: 'admonition',
    description: 'Admonition/callout box',
    almond: { selector: '.callout' },
    docusaurus: { selector: '.theme-admonition' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'borderRadius', 'borderLeftWidth',
      'fontSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    ],
  },

  // ─── HORIZONTAL RULE ──────────────────────────────────────
  {
    name: 'horizontal-rule',
    description: 'Horizontal rule (hr)',
    almond: { eval: `document.querySelector('#content hr')` },
    docusaurus: { selector: '.theme-doc-markdown hr' },
    skip: [...GLOBAL_SKIP],
    focus: ['borderTopWidth', 'borderTopColor', 'marginTop', 'marginBottom'],
  },

  // ─── CODE BLOCK TITLE ───────────────────────────────────────
  {
    name: 'code-block-title',
    description: 'Code block title bar (e.g. filename)',
    almond: {
      eval: `(function() {
        var blocks = document.querySelectorAll('.code-block');
        for (var i = 0; i < blocks.length; i++) {
          var title = blocks[i].querySelector('[class*="title"], [class*="filename"]');
          if (title && title.textContent.trim().length > 0) return title;
        }
        return null;
      })()`,
    },
    docusaurus: { eval: `document.querySelector('[class*="codeBlockTitle"]')` },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'color', 'backgroundColor',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderBottomWidth', 'borderBottomColor',
    ],
  },

  // ─── H4 ────────────────────────────────────────────────────
  {
    name: 'h4',
    description: 'Sub-subsection heading (h4)',
    almond: { eval: `document.querySelector('#content h4')` },
    docusaurus: { selector: '.theme-doc-markdown h4' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'fontSize', 'fontWeight', 'lineHeight', 'color', 'marginTop', 'marginBottom',
    ],
  },

  // ─── NAVBAR ────────────────────────────────────────────────
  {
    name: 'navbar',
    description: 'Top navigation bar',
    almond: { selector: '#navbar' },
    docusaurus: { selector: '.navbar' },
    skip: [...GLOBAL_SKIP],
    focus: [
      'height', 'position', 'backgroundColor', 'borderBottomWidth',
      'boxShadow', 'zIndex', 'paddingLeft', 'paddingRight',
    ],
  },
];
