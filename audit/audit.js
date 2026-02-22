#!/usr/bin/env node
// Theme Audit: exhaustive comparison of Docusaurus theme vs Almond reference
//
// Usage: node audit.js [--json] [--focus element-name] [--tolerance-px N] [--tolerance-color N]
//                      [--skip-responsive] [--only CATEGORY]
//
// Screenshots are a separate tool: node screenshots.js
//
// Runs inside the docusaurus container:
//   docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/audit.js

const { openPage } = require('./cdp');
const elements = require('./elements');
const { buildExtractExpression, compareValues } = require('./compare');
const { runBehavioralTests } = require('./behavioral');
const { runLayoutTests } = require('./layout');
const { runResponsiveTests } = require('./responsive');
const { runDomTests } = require('./dom-structure');
const { runVisualDiffTests } = require('./visual-diff');
const ALL_PROPS = require('./properties');

// Config
const ALMOND_URL = process.env.ALMOND_URL || 'https://legacyllc.mintlify.app/essentials/audit-test';
const DOCUSAURUS_IP = process.env.DOCUSAURUS_IP || '172.18.0.8';
const DOCUSAURUS_URL = process.env.DOCUSAURUS_URL || `http://${DOCUSAURUS_IP}:3000/docs/essentials/audit-test`;
const VIEWPORT = { width: 1440, height: 900 };

// Parse args
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const focusIdx = args.indexOf('--focus');
const focusName = focusIdx >= 0 ? args[focusIdx + 1] : null;
const pxTolIdx = args.indexOf('--tolerance-px');
const pxTol = pxTolIdx >= 0 ? parseFloat(args[pxTolIdx + 1]) : 1;
const colorTolIdx = args.indexOf('--tolerance-color');
const colorTol = colorTolIdx >= 0 ? parseFloat(args[colorTolIdx + 1]) : 3;
const tolerance = { px: pxTol, color: colorTol, alpha: 0.03 };
const skipResponsive = args.includes('--skip-responsive');
const onlyIdx = args.indexOf('--only');
const onlyCategory = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

function shouldRun(category) {
  if (onlyCategory) return onlyCategory === category;
  if (category === 'responsive' && skipResponsive) return false;
  return true;
}

async function closeAlmondAssistant(page) {
  await page.evaluate(`
    (function() {
      var buttons = document.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var rect = buttons[i].getBoundingClientRect();
        if (rect.left > 1350 && rect.top < 50 && rect.width < 40) {
          buttons[i].click();
          return true;
        }
      }
      return false;
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
}

async function main() {
  const allResults = {
    css: [], behavioral: [], layout: [],
    dom: [], responsive: [], visual: [],
    summary: {}
  };

  // Open both pages at desktop viewport for CSS/behavioral/layout/dom tests
  let almondPage, docPage;
  const needDesktop = shouldRun('css') || shouldRun('behavioral') || shouldRun('layout') || shouldRun('dom');

  if (needDesktop) {
    console.error('Opening Almond reference...');
    almondPage = await openPage(ALMOND_URL, VIEWPORT.width, VIEWPORT.height);
    await closeAlmondAssistant(almondPage);

    console.error('Opening Docusaurus site...');
    docPage = await openPage(DOCUSAURUS_URL, VIEWPORT.width, VIEWPORT.height);
  }

  // ─── CSS COMPARISON ────────────────────────────────────────
  if (shouldRun('css')) {
    console.error('\n=== CSS Property Comparison ===\n');

    const elementsToTest = focusName
      ? elements.filter(e => e.name === focusName)
      : elements;

    for (const elem of elementsToTest) {
      console.error(`Testing: ${elem.name}...`);

      const almondExpr = buildExtractExpression(elem.almond);
      const docExpr = buildExtractExpression(elem.docusaurus);

      let almondStyles, docStyles;
      try {
        almondStyles = await almondPage.evaluate(almondExpr);
      } catch (e) {
        allResults.css.push({
          element: elem.name, status: 'error',
          detail: `Almond extraction failed: ${e.message}`
        });
        continue;
      }
      try {
        docStyles = await docPage.evaluate(docExpr);
      } catch (e) {
        allResults.css.push({
          element: elem.name, status: 'error',
          detail: `Docusaurus extraction failed: ${e.message}`
        });
        continue;
      }

      if (!almondStyles) {
        allResults.css.push({ element: elem.name, status: 'skip', detail: 'Element not found on Almond' });
        continue;
      }
      if (!docStyles) {
        allResults.css.push({ element: elem.name, status: 'fail', detail: 'Element not found on Docusaurus' });
        continue;
      }

      const skipSet = new Set(elem.skip || []);
      const focusSet = elem.focus ? new Set(elem.focus) : null;
      const mismatches = [];
      let totalChecked = 0;
      let totalMatched = 0;

      for (const prop of ALL_PROPS) {
        if (skipSet.has(prop)) continue;
        if (prop === 'fontFamily') continue;
        if (prop === 'transition' || prop === 'transitionProperty' ||
            prop === 'transitionDuration' || prop === 'transitionTimingFunction' ||
            prop === 'transitionDelay') continue;

        totalChecked++;
        const result = compareValues(prop, almondStyles[prop], docStyles[prop], tolerance, almondStyles, docStyles);
        if (result.match) {
          totalMatched++;
        } else {
          mismatches.push({
            property: prop,
            almond: almondStyles[prop],
            docusaurus: docStyles[prop],
            isFocus: focusSet ? focusSet.has(prop) : false,
          });
        }
      }

      const focusMismatches = mismatches.filter(m => m.isFocus);
      const otherMismatches = mismatches.filter(m => !m.isFocus);
      const status = focusMismatches.length === 0 ? 'pass' : 'fail';

      allResults.css.push({
        element: elem.name,
        description: elem.description,
        status,
        checked: totalChecked,
        matched: totalMatched,
        focusMismatches,
        otherMismatches,
        almondTag: almondStyles._tag,
        docTag: docStyles._tag,
      });
    }
  }

  // ─── BEHAVIORAL TESTS ─────────────────────────────────────
  if (shouldRun('behavioral')) {
    console.error('\n=== Behavioral Tests ===\n');
    allResults.behavioral = await runBehavioralTests(docPage, 'docusaurus');
  }

  // ─── LAYOUT TESTS ─────────────────────────────────────────
  if (shouldRun('layout')) {
    console.error('\n=== Layout Tests ===\n');
    allResults.layout = await runLayoutTests(almondPage, docPage);
  }

  // ─── DOM STRUCTURE TESTS ──────────────────────────────────
  if (shouldRun('dom')) {
    console.error('\n=== DOM Structure Tests ===\n');
    allResults.dom = await runDomTests(almondPage, docPage);
  }

  // Clean up desktop pages before opening responsive/screenshot pages
  if (almondPage) await almondPage.destroy().catch(() => {});
  if (docPage) await docPage.destroy().catch(() => {});

  // ─── RESPONSIVE TESTS ─────────────────────────────────────
  if (shouldRun('responsive')) {
    console.error('\n=== Responsive Tests ===\n');
    allResults.responsive = await runResponsiveTests(
      openPage, ALMOND_URL, DOCUSAURUS_URL, closeAlmondAssistant
    );
  }

  // ─── VISUAL DIFF TESTS ────────────────────────────────────
  if (shouldRun('visual')) {
    console.error('\n=== Visual Diff Tests ===\n');
    allResults.visual = await runVisualDiffTests(
      openPage, ALMOND_URL, DOCUSAURUS_URL, closeAlmondAssistant
    );
  }

  // ─── SUMMARY ───────────────────────────────────────────────
  const categories = ['css', 'behavioral', 'layout', 'dom', 'responsive', 'visual'];
  const summary = {};
  let totalPass = 0, totalFail = 0, totalAll = 0;

  for (const cat of categories) {
    const items = allResults[cat] || [];
    let pass, fail, skip, total;
    if (cat === 'css') {
      pass = items.filter(r => r.status === 'pass').length;
      fail = items.filter(r => r.status === 'fail').length;
      skip = items.filter(r => r.status === 'skip').length;
      total = items.length;
    } else {
      pass = items.filter(r => r.pass).length;
      fail = items.filter(r => !r.pass).length;
      skip = 0;
      total = items.length;
    }
    summary[cat] = { pass, fail, skip, total };
    totalPass += pass;
    totalFail += fail;
    totalAll += total;
  }
  summary.overall = { pass: totalPass, fail: totalFail, total: totalAll };
  allResults.summary = summary;

  // ─── OUTPUT ────────────────────────────────────────────────
  if (jsonOutput) {
    console.log(JSON.stringify(allResults, null, 2));
  } else {
    printReport(allResults);
  }

  process.exit(allResults.summary.overall.fail > 0 ? 1 : 0);
}

function printReport(results) {
  const { css, behavioral, layout, dom, responsive, visual, summary } = results;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              MINTYSAURUS THEME AUDIT REPORT                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // CSS Results
  if (css.length > 0) {
    console.log('── CSS Property Comparison ──────────────────────────────────\n');
    for (const r of css) {
      const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : r.status === 'skip' ? '⏭️' : '⚠️';
      const score = r.checked ? ` (${r.matched}/${r.checked} props)` : '';
      console.log(`${icon} ${r.element}${score} — ${r.description || ''}`);

      if (r.focusMismatches && r.focusMismatches.length > 0) {
        console.log('   CRITICAL mismatches (focus properties):');
        for (const m of r.focusMismatches) {
          console.log(`     ├─ ${m.property}: almond="${m.almond}" vs doc="${m.docusaurus}"`);
        }
      }
      if (r.otherMismatches && r.otherMismatches.length > 0) {
        const shown = r.otherMismatches.slice(0, 5);
        const more = r.otherMismatches.length - shown.length;
        console.log(`   Other mismatches (${r.otherMismatches.length}):`);
        for (const m of shown) {
          console.log(`     ├─ ${m.property}: "${m.almond}" vs "${m.docusaurus}"`);
        }
        if (more > 0) console.log(`     └─ ... and ${more} more`);
      }
      console.log('');
    }
  }

  // Generic list printer for pass/fail tests
  function printTests(title, tests) {
    if (!tests || tests.length === 0) return;
    console.log(`── ${title} ──${'─'.repeat(Math.max(0, 56 - title.length))}\n`);
    for (const r of tests) {
      console.log(`${r.pass ? '✅' : '❌'} ${r.name}`);
      if (!r.pass && r.detail) console.log(`     ${r.detail}`);
    }
    console.log('');
  }

  printTests('Behavioral Tests', behavioral);
  printTests('Layout Tests', layout);
  printTests('DOM Structure Tests', dom);
  printTests('Responsive Tests', responsive);
  printTests('Visual Diff Tests', visual);

  // Summary
  console.log('── Summary ─────────────────────────────────────────────────\n');
  const cats = ['css', 'behavioral', 'layout', 'dom', 'responsive', 'visual'];
  for (const cat of cats) {
    const s = summary[cat];
    if (!s || s.total === 0) continue;
    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
    const pad = ' '.repeat(Math.max(0, 14 - label.length));
    console.log(`  ${label}:${pad}${s.pass}/${s.total} pass${s.fail > 0 ? ` (${s.fail} failing)` : ''}`);
  }
  console.log(`  ─────────────────────────`);
  console.log(`  OVERALL:      ${summary.overall.pass}/${summary.overall.total} pass`);
  if (summary.overall.fail > 0) {
    console.log(`\n  ⚠️  ${summary.overall.fail} test(s) failing`);
  } else {
    console.log(`\n  🎉 All tests passing!`);
  }
  console.log('');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(2);
});
