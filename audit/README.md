# Theme Audit

Compares the Mintysaurus theme against [Almond](https://almond.mintlify.app) via CDP, using two complementary tools:

1. **Screenshot diff** (primary) — pixel-level visual comparison at 4 breakpoints
2. **Property audit** (diagnostic) — CSS property extraction, behavioral tests, layout checks

Both run inside the `docusaurus` container, connecting to the `chromium` container (CDP on port 9223). Files are bind-mounted from `~/apps/docusaurus/theme/audit/`.

## Screenshot Diff (Primary)

Captures both sites at each breakpoint, crops to equivalent DOM regions, and produces diff images showing every pixel that differs. No thresholds — every difference is reported.

```bash
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/screenshot-diff.js
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/screenshot-diff.js --json
```

Breakpoints: 1440, 1024, 768, 375px.

Regions compared at desktop (≥997px): navbar, sidebar, panel, toc, full-page.
Regions compared at mobile (<997px): navbar, content, full-page.

Output: diff percentages per region + diff images in `audit/shots/diff-*.png`. Red pixels = different, dimmed gray = matching.

## Property Audit (Diagnostic)

Use this to diagnose *why* something looks wrong after the screenshot diff shows a difference.

```bash
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/audit.js
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/audit.js --json
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/audit.js --focus sidebar-link
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/audit.js --only css
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/audit.js --skip-responsive
```

### Categories

- **CSS (39 elements, 32 testable)** — ~106 computed properties per element. Each has `focus` properties (critical) and the rest (informational). 7 elements skipped (no Almond equivalent: `body-link`, `unordered-list`, `ordered-list`, `list-item`, `horizontal-rule`, `code-block-title`, `h4`).
- **Behavioral (25 tests)** — Scroll tracking, hover states, sticky positioning, visibility, interactions.
- **Layout (9 tests)** — Bounding rectangle comparisons: widths, positions, gaps.
- **DOM Structure (18 tests)** — Z-index stacking, flex order, inheritance chains, element hierarchy.
- **Responsive (38 tests at 4 breakpoints)** — Element visibility, panel styling, overflow, navbar.
- **Visual Diff (15 tests)** — Color sampling at landmarks, vertical rhythm, dark mode smoke tests.

### Standalone Screenshots

```bash
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/screenshots.js
```

Saves PNGs to `audit/shots/` at all 4 breakpoints (top/mid/bottom scroll positions).

## Test Page

Both tools run against `/docs/audit-test` — a page with every component type. Source: `site/docs/audit-test.md`. Uses frontmatter `title` so the description renders via the synthetic title path.

## Comparison Rules (Property Audit)

- **Primary color** — Almond's teal and our green are both "primary." `rgba(0,150,137,0.1)` matches `rgba(22,110,63,0.1)`.
- **Border-style when width=0** — `solid` vs `none` is visually identical. Treated as match.
- **Outline when style=none** — Color difference is irrelevant. Treated as match.
- **Tolerance** — 1px for dimensions, 3 for RGB channels, 0.03 for alpha.
- **Skipped globally** — `fontFamily` (different brand fonts), `transition*` (animation timing).
- **NOT skipped** — `overflowWrap`, `display`, `position`, `overflow`, border colors when visible.

## Files

| File | Purpose |
|---|---|
| `screenshot-diff.js` | **Primary tool** — pixel-level screenshot comparison |
| `audit.js` | Diagnostic runner (CSS, behavioral, layout, DOM, responsive, visual) |
| `cdp.js` | CDP client (Node 22 built-in WebSocket) |
| `elements.js` | Element selectors and focus properties |
| `properties.js` | All 106 CSS properties to extract |
| `compare.js` | Normalization and comparison logic |
| `behavioral.js` | Scroll, hover, visibility, interaction tests |
| `layout.js` | Bounding rectangle tests |
| `dom-structure.js` | Z-index, flex order, inheritance, hierarchy tests |
| `responsive.js` | Multi-breakpoint visibility and layout tests |
| `visual-diff.js` | Color sampling, vertical rhythm, dark mode tests |
| `screenshots.js` | Standalone screenshot capture tool |

## Adding Elements

Add to `elements.js`, then add the component to `site/docs/audit-test.md`:

```js
{
  name: 'my-element',
  almond: { selector: '#almond-id' },       // or { eval: `...` }
  docusaurus: { selector: '.my-class' },
  skip: [...GLOBAL_SKIP],
  focus: ['fontSize', 'color', 'padding'],
}
```

## Gotchas

- Container IPs change on restart — pass `DOCUSAURUS_IP` if needed.
- Almond's assistant panel is closed automatically before extraction.
- Almond can change their DOM at any time — broken selectors show as "Element not found."
- Hover tests use CDP mouse events — elements must be in viewport for hover to work.
- Screenshot diff opens pages sequentially (one at a time) due to chromium resource limits.
