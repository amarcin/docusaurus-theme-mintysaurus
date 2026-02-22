#!/usr/bin/env node
// Screenshot diff: pixel-level comparison between Almond and Docusaurus.
//
// Captures both sites at each breakpoint, crops to equivalent DOM regions,
// computes exact pixel diff, and saves diff images. No thresholds — every
// difference is reported. Use the diff images to decide what to fix.
//
// Usage: docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/screenshot-diff.js

const fs = require('fs');
const path = require('path');
const { openPage } = require('./cdp');

const ALMOND_URL = process.env.ALMOND_URL || 'https://legacyllc.mintlify.app/essentials/audit-test';
const DOCUSAURUS_IP = process.env.DOCUSAURUS_IP || '172.18.0.8';
const DOC_URL = `http://${DOCUSAURUS_IP}:3000/docs/essentials/audit-test`;
const SHOTS_DIR = '/app/theme/audit/shots';

const BREAKPOINTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768',  width: 768,  height: 1024 },
  { name: '375',  width: 375,  height: 812 },
];

// Scroll positions to capture (fraction of scrollHeight)
const SCROLL_POSITIONS = [
  { suffix: '',    frac: 0 },
  { suffix: '-mid', frac: 0.5 },
  { suffix: '-bot', frac: 1 },
];

const SCROLL_ALMOND = `(function(f){ var p = document.querySelector('#content-container'); if(p) p.scrollTop = p.scrollHeight * f; else window.scrollTo(0, document.body.scrollHeight * f); })`;
const SCROLL_DOC = `(function(f){ var p = document.querySelector('.mintysaurus-panel'); if(p) p.scrollTop = p.scrollHeight * f; else window.scrollTo(0, document.body.scrollHeight * f); })`;

const REGIONS = {
  desktop: [
    { name: 'navbar',  almond: '#navbar',           doc: '.navbar' },
    { name: 'sidebar', almond: '#sidebar-content',  doc: '.theme-doc-sidebar-container' },
    { name: 'panel',   almond: '#content-container', doc: '.mintysaurus-panel' },
    { name: 'toc',     almond: '#table-of-contents', doc: '.mintysaurus-toc' },
  ],
  mobile: [
    { name: 'navbar',  almond: '#navbar',           doc: '.navbar' },
    { name: 'content', almond: '#content-container', doc: 'article' },
  ],
};

async function closeAssistant(page) {
  await page.evaluate(`localStorage.setItem("chat-assistant-sheet-open","false")`);
  await page.reload(3000);
}

async function getRect(page, selector) {
  return page.evaluate(`
    (function() {
      var el = document.querySelector('${selector.replace(/'/g, "\\'")}');
      if (!el) return null;
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      return { left: Math.round(r.left), top: Math.round(r.top),
               width: Math.round(r.width), height: Math.round(r.height) };
    })()
  `);
}

// Diff two base64 PNGs within given rects. Opens a temporary page for canvas work.
async function diffRegion(aB64, dB64, aRect, dRect) {
  const page = await openPage('about:blank', 100, 100);
  try {
    await page.evaluate(`window.__a = "${aB64}";`);
    await page.evaluate(`window.__d = "${dB64}";`);

    const result = await page.evaluate(`
      (function() {
        var aR = ${JSON.stringify(aRect)};
        var dR = ${JSON.stringify(dRect)};
        return new Promise(function(resolve, reject) {
          var loaded = 0;
          var aImg = new Image();
          var dImg = new Image();
          function done() {
            loaded++;
            if (loaded < 2) return;
            var w = Math.min(aR.width, dR.width);
            var h = Math.min(aR.height, dR.height);
            if (w <= 0 || h <= 0) { resolve({ error: 'zero region' }); return; }

            var aC = document.createElement('canvas'); aC.width = w; aC.height = h;
            aC.getContext('2d').drawImage(aImg, aR.left, aR.top, w, h, 0, 0, w, h);

            var dC = document.createElement('canvas'); dC.width = w; dC.height = h;
            dC.getContext('2d').drawImage(dImg, dR.left, dR.top, w, h, 0, 0, w, h);

            var aData = aC.getContext('2d').getImageData(0, 0, w, h).data;
            var dData = dC.getContext('2d').getImageData(0, 0, w, h).data;

            var diffC = document.createElement('canvas'); diffC.width = w; diffC.height = h;
            var diffOut = diffC.getContext('2d').createImageData(w, h);
            var total = w * h, diffCount = 0;

            for (var i = 0; i < aData.length; i += 4) {
              var dr = Math.abs(aData[i] - dData[i]);
              var dg = Math.abs(aData[i+1] - dData[i+1]);
              var db = Math.abs(aData[i+2] - dData[i+2]);
              if (dr > 0 || dg > 0 || db > 0) {
                diffCount++;
                var intensity = Math.min(255, Math.max(dr, dg, db) * 3);
                diffOut.data[i] = intensity;
                diffOut.data[i+1] = 0;
                diffOut.data[i+2] = 0;
                diffOut.data[i+3] = 255;
              } else {
                diffOut.data[i] = dData[i] * 0.3;
                diffOut.data[i+1] = dData[i+1] * 0.3;
                diffOut.data[i+2] = dData[i+2] * 0.3;
                diffOut.data[i+3] = 255;
              }
            }
            diffC.getContext('2d').putImageData(diffOut, 0, 0);

            resolve({
              width: w, height: h, totalPixels: total,
              diffPixels: diffCount,
              diffPercent: Math.round(diffCount / total * 10000) / 100,
              diffImageB64: diffC.toDataURL('image/png').split(',')[1]
            });
          }
          aImg.onload = done; dImg.onload = done;
          aImg.onerror = function() { reject(new Error('almond load failed')); };
          dImg.onerror = function() { reject(new Error('doc load failed')); };
          aImg.src = 'data:image/png;base64,' + window.__a;
          dImg.src = 'data:image/png;base64,' + window.__d;
        });
      })()
    `);
    return result;
  } finally {
    await page.destroy().catch(() => {});
  }
}

async function main() {
  const jsonOutput = process.argv.includes('--json');
  const results = [];
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  // Clean old diff files
  for (const f of fs.readdirSync(SHOTS_DIR)) {
    if (f.startsWith('diff-')) fs.unlinkSync(path.join(SHOTS_DIR, f));
  }

  for (const bp of BREAKPOINTS) {
    console.error(`\n── ${bp.name}px ──`);
    const isDesktop = bp.width >= 997;
    const regionDefs = isDesktop ? REGIONS.desktop : REGIONS.mobile;

    // Capture Almond (one page at a time to avoid resource exhaustion)
    console.error('  Opening Almond...');
    const almond = await openPage(ALMOND_URL, bp.width, bp.height);
    await closeAssistant(almond);
    const almondCaptures = [];
    for (const sp of SCROLL_POSITIONS) {
      if (sp.frac > 0) {
        await almond.evaluate(`${SCROLL_ALMOND}(${sp.frac})`);
        await new Promise(r => setTimeout(r, 500));
      }
      const rects = {};
      for (const region of regionDefs) rects[region.name] = await getRect(almond, region.almond);
      console.error(`  Capturing Almond${sp.suffix || ' top'}...`);
      const b64 = (await almond.screenshot()).toString('base64');
      almondCaptures.push({ sp, rects, b64 });
    }
    await almond.destroy();

    // Capture Docusaurus
    console.error('  Opening Docusaurus...');
    const doc = await openPage(DOC_URL, bp.width, bp.height);
    await new Promise(r => setTimeout(r, 1000));
    const docCaptures = [];
    for (const sp of SCROLL_POSITIONS) {
      if (sp.frac > 0) {
        await doc.evaluate(`${SCROLL_DOC}(${sp.frac})`);
        await new Promise(r => setTimeout(r, 500));
      }
      const rects = {};
      for (const region of regionDefs) rects[region.name] = await getRect(doc, region.doc);
      console.error(`  Capturing Docusaurus${sp.suffix || ' top'}...`);
      const b64 = (await doc.screenshot()).toString('base64');
      docCaptures.push({ sp, rects, b64 });
    }
    await doc.destroy();

    // Diff captured data
    for (let i = 0; i < SCROLL_POSITIONS.length; i++) {
      const sp = SCROLL_POSITIONS[i];
      const aB64 = almondCaptures[i].b64;
      const dB64 = docCaptures[i].b64;
      const almondRects = almondCaptures[i].rects;
      const docRects = docCaptures[i].rects;

      fs.writeFileSync(path.join(SHOTS_DIR, `diff-almond-${bp.name}${sp.suffix}.png`), Buffer.from(aB64, 'base64'));
      fs.writeFileSync(path.join(SHOTS_DIR, `diff-doc-${bp.name}${sp.suffix}.png`), Buffer.from(dB64, 'base64'));

      for (const region of regionDefs) {
        const aRect = almondRects[region.name];
        const dRect = docRects[region.name];
        const label = `${region.name}${sp.suffix}`;

        if (!aRect && !dRect) {
          results.push({ breakpoint: bp.name, region: label, diffPercent: null, detail: 'Both missing' });
          continue;
        }
        if (!aRect) {
          results.push({ breakpoint: bp.name, region: label, diffPercent: null, detail: 'Almond element not found' });
          continue;
        }
        if (!dRect) {
          results.push({ breakpoint: bp.name, region: label, diffPercent: 100, detail: 'Docusaurus element missing' });
          continue;
        }

        console.error(`  Diffing ${label}...`);
        try {
          const diff = await diffRegion(aB64, dB64, aRect, dRect);
          if (diff.error) {
            results.push({ breakpoint: bp.name, region: label, diffPercent: null, detail: diff.error });
            continue;
          }
          if (diff.diffImageB64) {
            fs.writeFileSync(path.join(SHOTS_DIR, `diff-${bp.name}-${label}.png`), Buffer.from(diff.diffImageB64, 'base64'));
          }
          results.push({
            breakpoint: bp.name, region: label,
            diffPercent: diff.diffPercent, diffPixels: diff.diffPixels,
            totalPixels: diff.totalPixels, size: `${diff.width}x${diff.height}`,
            almondRect: aRect, docRect: dRect,
          });
        } catch (e) {
          results.push({ breakpoint: bp.name, region: label, diffPercent: null, detail: e.message });
        }
      }

      // Full-page diff
      console.error(`  Diffing full page${sp.suffix}...`);
      try {
        const fpRect = { left: 0, top: 0, width: bp.width, height: bp.height };
        const diff = await diffRegion(aB64, dB64, fpRect, fpRect);
        if (!diff.error) {
          if (diff.diffImageB64) {
            fs.writeFileSync(path.join(SHOTS_DIR, `diff-${bp.name}-fullpage${sp.suffix}.png`), Buffer.from(diff.diffImageB64, 'base64'));
          }
          results.push({
            breakpoint: bp.name, region: `full-page${sp.suffix}`,
            diffPercent: diff.diffPercent, diffPixels: diff.diffPixels,
            totalPixels: diff.totalPixels, size: `${diff.width}x${diff.height}`,
          });
        }
      } catch (e) {
        results.push({ breakpoint: bp.name, region: `full-page${sp.suffix}`, diffPercent: null, detail: e.message });
      }
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║           SCREENSHOT DIFF REPORT                           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    let currentBp = '';
    for (const r of results) {
      if (r.breakpoint !== currentBp) {
        currentBp = r.breakpoint;
        console.log(`── ${currentBp}px ──${'─'.repeat(50)}\n`);
      }
      if (r.diffPercent === null) {
        console.log(`⚠️  ${r.region}: ${r.detail}`);
      } else if (r.diffPercent === 0) {
        console.log(`   ${r.region}: 0% — identical`);
      } else {
        console.log(`   ${r.region}: ${r.diffPercent}% different (${r.diffPixels}/${r.totalPixels} px) [${r.size}]`);
      }
    }
    console.log(`\nDiff images: ${SHOTS_DIR}/diff-*.png\n`);
  }

  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e.stack || e.message); process.exit(2); });
