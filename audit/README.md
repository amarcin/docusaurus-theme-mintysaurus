# Theme Audit

Compares the Mintysaurus theme against [Almond](https://almond.mintlify.app) by extracting live computed styles from both sites via CDP.

```bash
docker exec -e DOCUSAURUS_IP=172.18.0.8 docusaurus node /app/theme/audit/audit.js
```

## Architecture

The audit runs inside the `docusaurus` container (Node 22), connects to the `chromium` container (CDP on port 9223), opens both sites in browser tabs, and extracts computed styles. All files are bind-mounted from `~/apps/docusaurus/theme/audit/` — no `docker cp`.

## Test Categories

- **CSS (37 elements)** — Extracts ~106 computed properties per element from both sites. Each element has `focus` properties (critical) and everything else (informational).
- **Behavioral (11 tests)** — Scroll tracking, hover states, sticky positioning, element visibility.
- **Layout (9 tests)** — Bounding rectangle comparisons: widths, positions, gaps.

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

## Almond-Side Skips

Five elements have no Almond equivalent: `body-link`, `unordered-list`, `ordered-list`, `list-item`, `horizontal-rule`. Almond uses custom components instead of standard HTML for these. Options: hardcode reference values in the spec, or style them to be consistent with matched elements.

## CLI

```bash
node audit.js --json                    # JSON output
node audit.js --focus sidebar-link      # Single element
node audit.js --tolerance-px 2          # Wider tolerance
ALMOND_URL=https://almond.mintlify.app/essentials/code node audit.js  # Different page
```

## Files

| File | Purpose |
|---|---|
| `audit.js` | Main runner |
| `cdp.js` | CDP client (Node 22 built-in WebSocket) |
| `elements.js` | Element selectors and focus properties |
| `properties.js` | All 106 CSS properties to extract |
| `compare.js` | Normalization and comparison logic |
| `behavioral.js` | Scroll, hover, visibility tests |
| `layout.js` | Bounding rectangle tests |

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
- Hover tests use CDP mouse events — JS-driven hover effects won't be detected.
