#!/usr/bin/env node
// Standalone screenshot capture — run separately from the audit.
// Saves PNGs to /app/theme/audit/shots/ for manual visual comparison.
//
// Usage: docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/screenshots.js

const fs = require('fs');
const path = require('path');
const { openPage } = require('./cdp');

const ALMOND_URL = process.env.ALMOND_URL || 'https://legacyllc.mintlify.app/essentials/audit-test';
const DOCUSAURUS_IP = process.env.DOCUSAURUS_IP || '172.18.0.8';
const DOC_URL = `http://${DOCUSAURUS_IP}:3000/docs/essentials/audit-test`;
const SHOTS_DIR = '/app/theme/audit/shots';

const BREAKPOINTS = [
  { name: '1440', width: 1440, height: 900, closeSidebar: true },
  { name: '1024', width: 1024, height: 768, closeSidebar: true },
  { name: '768', width: 768, height: 1024, closeSidebar: false },
  { name: '375', width: 375, height: 812, closeSidebar: false },
];

async function closeAssistant(page) {
  await page.evaluate(`
    (function() {
      var bs = document.querySelectorAll('button');
      for (var i = 0; i < bs.length; i++) {
        var r = bs[i].getBoundingClientRect();
        if (r.left > window.innerWidth - 90 && r.top < 50 && r.width < 40) {
          bs[i].click(); return;
        }
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));
}

async function capture(page, filePath) {
  const buf = await page.screenshot();
  fs.writeFileSync(filePath, buf);
  console.log(`  ${path.basename(filePath)} (${buf.length} bytes)`);
}

(async () => {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });

  for (const bp of BREAKPOINTS) {
    console.log(`\n── ${bp.name}px ──`);

    const almond = await openPage(ALMOND_URL, bp.width, bp.height);
    if (bp.closeSidebar) await closeAssistant(almond);
    const doc = await openPage(DOC_URL, bp.width, bp.height);

    // Top
    await capture(almond, path.join(SHOTS_DIR, `almond-${bp.name}-top.png`));
    await capture(doc, path.join(SHOTS_DIR, `doc-${bp.name}-top.png`));

    // Scroll to middle
    await almond.evaluate(`(function(){ var p = document.querySelector('#content-container'); if(p) p.scrollTop = p.scrollHeight/2; else window.scrollTo(0, document.body.scrollHeight/2); })()`);
    await doc.evaluate(`(function(){ var p = document.querySelector('.mintysaurus-panel'); if(p) p.scrollTop = p.scrollHeight/2; else window.scrollTo(0, document.body.scrollHeight/2); })()`);
    await new Promise(r => setTimeout(r, 500));
    await capture(almond, path.join(SHOTS_DIR, `almond-${bp.name}-mid.png`));
    await capture(doc, path.join(SHOTS_DIR, `doc-${bp.name}-mid.png`));

    // Scroll to bottom
    await almond.evaluate(`(function(){ var p = document.querySelector('#content-container'); if(p) p.scrollTop = p.scrollHeight; else window.scrollTo(0, document.body.scrollHeight); })()`);
    await doc.evaluate(`(function(){ var p = document.querySelector('.mintysaurus-panel'); if(p) p.scrollTop = p.scrollHeight; else window.scrollTo(0, document.body.scrollHeight); })()`);
    await new Promise(r => setTimeout(r, 500));
    await capture(almond, path.join(SHOTS_DIR, `almond-${bp.name}-bottom.png`));
    await capture(doc, path.join(SHOTS_DIR, `doc-${bp.name}-bottom.png`));

    await almond.destroy();
    await doc.destroy();
  }

  console.log(`\nDone. Screenshots saved to ${SHOTS_DIR}/`);
  process.exit(0);
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
