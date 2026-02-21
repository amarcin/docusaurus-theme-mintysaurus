# Agent Operational Notes — Mintysaurus Theme Development

Notes on effective approaches when working in this environment (two Debian machines, Docker containers, headless browser automation).

## Git Workflow

- **Submodule**: The theme lives at `~/apps/docusaurus/theme/` as a Git submodule pointing at `github:amarcin/docusaurus-theme-mintysaurus`. This IS the standalone repo — no copying.
- **Commit flow**: Edit in `~/apps/docusaurus/theme/`, then `cd theme && git commit && git push` for the theme, then `cd .. && git add theme && git commit && git push` for the apps repo submodule pointer.
- **Commit before changing direction**: Always commit working CSS before starting a new round of changes. This provides a safety net.
- **Be selective with git add**: The homelab repo has unrelated files (db dumps, other services). Always `git add` specific paths, never `git add -A` on the whole repo.

## CSS Internals

### CSS Sections

`mintysaurus.css` is organized in labeled sections:

| Section | What it styles |
|---|---|
| Variables | `:root` and `[data-theme='dark']` color tokens, fonts, spacing |
| Global | Font smoothing, background transitions |
| Navbar | 56px height, backdrop blur, no border, link styles |
| Inset Panel | Rounded card below navbar on docs pages (Mintlify signature) |
| Sidebar | 264px width, 12px radius links, category headers |
| Content Area | 576px max-width, centered with TOC |
| Typography | h1–h3 sizes, body text, lists, links, inline code |
| TOC | "On this page" heading, border-left active indicator |
| Code Blocks | 14px, rounded borders, title bar |
| Pagination | Grid layout, reversed column (title above sublabel) |
| Footer | Compact, border-top |
| Admonitions | Rounded, thin left border |
| Doc Cards | Rounded, hover border |
| Tables | Compact, uppercase headers |
| Search Bar | Rounded pill shape |
| Scrollbar | Thin, custom thumb |

### Key CSS Variables

```css
--ifm-color-primary: #166e3f;
--mintlify-body-color: #3f4140;
--mintlify-heading-color: #171a18;
--mintlify-muted: #505351;
--mintlify-content-max-width: 576px;
--mintlify-border-solid: #dfe1e0;
--mintlify-border: rgba(223, 225, 224, 0.7);
--mintlify-page-bg: #f5f5f4;
--mintlify-panel-bg: #ffffff;
```

### Layout Dimensions (≥997px)

| Element | Width |
|---|---|
| Sidebar | 264px |
| Content | 576px |
| Gap (article↔TOC) | 88px |
| TOC column | 220px |

Responsive: TOC visible ≥1280px, hidden 997–1279px, mobile ≤996px. The content row (article + gap + TOC) is centered within the panel via `max-width` + `margin: 0 auto`.

## Pitfalls & Competing Styles

### 1. Docusaurus default rules still load

The classic theme's CSS loads alongside ours. Key conflicts:

| Docusaurus default | Our override | Risk |
|---|---|---|
| `.table-of-contents li { margin: 0.5rem }` | `.table-of-contents li { margin: 0 }` | Gaps in the TOC border line if our rule loses |
| `.table-of-contents__left-border { border-left: 1px solid }` | `.table-of-contents { border-left: none }` | Double border (ul + per-link) |
| `.table-of-contents__link { color: var(--ifm-toc-link-color) }` | `.table-of-contents__link { color: var(--mintlify-muted) }` | Wrong text color |

### 2. Inset panel breaks scroll events

The panel (`overflow-y: auto` on `main`) means content scrolls inside the panel, NOT the document. This breaks anything that listens for `scroll` on `document` or `window`:

- **TOC highlight tracking**: We swizzled `TOCItems/index.js` with a custom hook that finds `.theme-doc-sidebar-container + main` and attaches the scroll listener there.
- **Anchor navigation**: `scrollIntoView()` works because it scrolls the nearest scrollable ancestor.

If you add any scroll-dependent feature, attach the listener to the panel element, not `document`.

### 3. TOC border alignment

The border is on each `<a>` tag (not `<li>` or `<ul>`). For h3 items, text indents via `padding-left: 2rem` on the `<a>`, but the border stays at the left edge. Do NOT add `padding-left` to `.toc-h3` `<li>` elements — that breaks the straight line.

### 4. No CSS transitions on the TOC border

Do NOT add `transition: border-color` to `.table-of-contents__link` — it causes the indicator bar to visibly fade between items as you scroll. Only `transition: color` is used (for text color on hover).

### 5. Panel padding vs sticky positioning

The TOC uses `position: sticky; top: 0` inside the scrolling panel. `max-height` must be `calc(100dvh - var(--ifm-navbar-height))` — NOT `100vh` or `100%`. Using `100%` resolves to the full row height. Using `100vh` ignores the navbar.

### 6. CSS class names are hashed in builds

Docusaurus CSS modules hash class names. Use attribute selectors `[class*='docsWrapper']` instead of `.docsWrapper_xxxx`. But prefer targeting stable class names like `.theme-doc-sidebar-container`, `.pagination-nav`.

### 7. Dark mode TOC borders

Light mode uses `rgba(10, 13, 12, 0.05)` for the faint TOC border. A separate `[data-theme='dark']` rule sets `border-left-color: rgba(255, 255, 255, 0.1)`. If you change the light border, update the dark one too.

### 8. Footer is hidden on docs pages

`html.docs-wrapper .theme-layout-footer { display: none }`. The `docs-wrapper` class is added by `Footer/Layout/index.js`. If you want a footer on docs pages, it needs to be inside the scrolling `main` element.

### 9. Eyebrow color specificity

`.mintlify-eyebrow` (0,1,0) loses to `.theme-doc-markdown p` (0,1,1). Fix: `.theme-doc-markdown .mintlify-eyebrow { color: var(--ifm-color-primary) }` (0,2,0).

### 10. Verifying CSS changes

```bash
docker exec docusaurus sh -c 'cat build/assets/css/*.css' > /tmp/styles.css
python3 -c "
css = open('/tmp/styles.css').read()
idx = css.find('YOUR_PROPERTY_VALUE')
if idx > -1:
    print('FOUND:', css[max(0,idx-80):idx+80])
else:
    print('NOT FOUND')
"
```

## CSS Development in Docusaurus

### Swizzle over override

When Docusaurus applies styles with `!important`, swizzle the component that generates the problematic markup and remove the class entirely. Don't fight `!important` with more `!important`.

### CSS load order

Docusaurus loads its own CSS after theme CSS. Theme `!important` declarations lose to Docusaurus core `!important` declarations. Fix: higher specificity selectors or swizzle the component.

### Use your own class names

Define your own classes in swizzled components (`.mintysaurus-panel`, `.mintysaurus-article`, etc.) instead of targeting Docusaurus internal classes.

## Browser Automation Pipeline

The visual comparison workflow uses Chromium in a Docker container with CDP exposed via socat relay, and Puppeteer running inside the Docusaurus container.

### What works

- **Dynamic IP resolution**: Always resolve container IPs with `docker inspect` before each run. IPs change on restart.
- **WebSocket URL**: Fetch fresh from `http://$CHROMIUM_IP:9223/json/version` every time.
- **Close Mintlify's assistant panel**: Click the X button (rightmost small button with `left > 1350 && top < 50 && width < 40`) and wait 1500ms before screenshotting.
- **Extract computed styles, not class names**: Mintlify uses Tailwind utility classes. Always use `getComputedStyle()`.
- **Trace layout chains**: Walk up from target to `document.body`, logging `left`, `width`, `paddingLeft`, `marginLeft`, `maxWidth`.

### What doesn't work

- **Guessing CSS selectors**: Mintlify's DOM uses dynamic class names. Dump broad HTML structure first.
- **Narrow viewports for Mintlify**: At 1440px, the assistant panel covers the TOC. Use 1920px OR close the assistant.
- **npm pack for theme source**: The `mintlify` npm package is just a CLI wrapper. The live site is the only reliable reference.

## Container Workflow

- **Dev server hot reload**: CSS changes are picked up automatically. New swizzled components require `docker restart docusaurus`.
- **Build vs dev**: The dev server is the primary workflow. `docusaurus build` fails due to permission issues on the build dir but that doesn't matter for development.

## Visual Comparison Methodology

1. Screenshot both sites at the same viewport size
2. Identify differences visually
3. Extract computed styles from the reference site for the specific elements that differ
4. Trace the layout chain if positions don't match
5. Make targeted CSS fixes based on extracted values
6. Re-screenshot and compare — iterate until matched

Reference: `https://almond.mintlify.app`, NOT `https://www.mintlify.com/docs`.

## Comparing Against Mintlify

Extract computed styles with Playwright:

```js
await page.goto('https://www.mintlify.com/docs/organize/settings');
const styles = await page.evaluate(() => {
  const el = document.querySelector('[class*="toc"] a');
  const cs = getComputedStyle(el);
  return { fontSize: cs.fontSize, lineHeight: cs.lineHeight, color: cs.color };
});
```

Always extract actual computed CSS rather than guessing from screenshots.
