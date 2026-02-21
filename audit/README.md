# Theme Audit

Compares the Mintysaurus theme against [Almond](https://almond.mintlify.app) by extracting live computed styles from both sites via CDP.

```bash
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/audit.js
```

## Architecture

The audit runs inside the `docusaurus` container (Node 22), connects to the `chromium` container (CDP on port 9223), opens both sites in browser tabs, and extracts computed styles. All files are bind-mounted from `~/apps/docusaurus/theme/audit/` — no `docker cp`.

## Test Categories

- **CSS (39 elements, 32 testable)** — Extracts ~106 computed properties per element from both sites. Each element has `focus` properties (critical) and everything else (informational). 7 elements are skipped (no Almond equivalent).
- **Behavioral (25 tests)** — Scroll tracking, hover states, sticky positioning, element visibility, interactive behaviors.
- **Layout (9 tests)** — Bounding rectangle comparisons: widths, positions, gaps.
- **DOM Structure (18 tests)** — Z-index stacking, flex order, inheritance chains, element hierarchy.
- **Responsive (38 tests at 4 breakpoints)** — Element visibility, panel styling, overflow, navbar at 1440/1024/768/375px.
- **Visual Diff (12 tests)** — Color sampling at landmarks, vertical rhythm, dark mode smoke tests.

## Test Page

Runs against `/docs/audit-test` — a dedicated page with every component type (headings, code blocks, tables, blockquotes, admonitions, lists, pagination, etc.). Source: `site/docs/audit-test.md`.

Uses frontmatter `title` instead of `# heading` so the description renders via the synthetic title path.

## Comparison Rules

- **Primary color** — Almond's teal and our green are both treated as "primary." `rgba(0,150,137,0.1)` matches `rgba(22,110,63,0.1)`.
- **Border-style when width=0** — `solid` vs `none` is visually identical. Treated as match.
- **Outline when style=none** — Color difference is irrelevant. Treated as match.
- **Tolerance** — 1px for dimensions, 3 for RGB channels, 0.03 for alpha.
- **Skipped globally** — `fontFamily` (different brand fonts), `transition*` (animation timing).
- **NOT skipped** — `overflowWrap`, `display`, `position`, `overflow`, border colors when visible. These are real work items.

## Intentional Differences from Almond

These are tested but accepted as valid:

- **overflow-wrap: break-word** — Almond uses `normal`. Our `break-word` prevents long URLs/code from breaking layout.
- **body line-height: 28px** — Almond uses 24px. Our 1.75 × 16px is an intentional typography choice.
- **h2 marginTop: 48px** — Almond uses 0px (flex gap handles spacing). Our margin creates the same visual spacing.
- **Pagination flexDirection: column-reverse** — Almond uses `row` with internal positioning. Both produce title-above-sublabel visually.
- **Sidebar groups: non-collapsible** — Top-level groups are intentionally non-collapsible (pointer-events: none). Nested groups have carets.

## Almond-Side Skips

Seven elements have no Almond equivalent: `body-link`, `unordered-list`, `ordered-list`, `list-item`, `horizontal-rule`, `code-block-title`, `h4`. Almond uses custom components instead of standard HTML for these.

## CLI

```bash
node audit.js --json                    # JSON output
node audit.js --focus sidebar-link      # Single element
node audit.js --tolerance-px 2          # Wider tolerance
node audit.js --only css                # Single category (css|behavioral|layout|dom|responsive|visual)
node audit.js --skip-responsive         # Skip responsive tests (faster)
ALMOND_URL=https://almond.mintlify.app/essentials/code node audit.js  # Different page
```

## Screenshots

Standalone screenshot capture at 4 breakpoints:

```bash
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/screenshots.js
```

Saves PNGs to `audit/shots/` for manual visual comparison. Not automated — use for eyeballing.

## Files

| File | Purpose |
|---|---|
| `audit.js` | Main runner |
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

## Known Gaps

The audit does NOT currently test:

- **Dark mode** beyond 4 smoke tests (panel bg, text, heading, page bg)
- **Hover/focus states in dark mode**
- **Transition animations** (Almond has smooth transitions on sidebar links, TOC highlights)
- **Print styles**
- **Scroll behavior nuances** (smooth scrolling verified indirectly, no scroll-padding tests)
- **Font rendering** (weight, anti-aliasing differences)
- **Z-index during scroll** (tested statically, not during actual scroll overlap)
- **Non-docs pages** (landing page, blog, 404)
- **Automated screenshot diffing** (screenshots are captured but compared manually)

## Gotchas

- Container IPs change on restart — pass `DOCUSAURUS_IP` if needed.
- Almond's assistant panel is closed automatically before extraction.
- Almond can change their DOM at any time — broken selectors show as "Element not found."
- Hover tests use CDP mouse events — elements must be in viewport for hover to work.
- The TOC hover test scrolls to top first because prior tests may have scrolled the panel.
