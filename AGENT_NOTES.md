# Agent Operational Notes — Mintysaurus Theme Development

Notes on effective approaches when working in this environment (two Debian machines, Docker containers, headless browser automation).

## Browser Automation Pipeline

The visual comparison workflow uses Chromium in a Docker container with CDP (Chrome DevTools Protocol) exposed via socat relay, and Puppeteer running inside the Docusaurus container.

### What works

- **Dynamic IP resolution**: Always resolve container IPs with `docker inspect` before each automation run. IPs change on container restart.
- **WebSocket URL**: Fetch fresh from `http://$CHROMIUM_IP:9223/json/version` every time. Stale WS URLs cause silent failures.
- **Close Mintlify's assistant panel**: The assistant panel hides the TOC. Click the X button (rightmost small button with `left > 1350 && top < 50 && width < 40`) and wait 1500ms before screenshotting.
- **Extract computed styles, not class names**: Mintlify uses Tailwind utility classes that are meaningless for comparison. Always use `getComputedStyle()` to get actual rendered values.
- **Trace layout chains**: When debugging position mismatches, walk up from the target element to `document.body`, logging each ancestor's `left`, `width`, `paddingLeft`, `marginLeft`, and `maxWidth`. This reveals which container is causing the offset.

### What doesn't work

- **Guessing CSS selectors**: Mintlify's DOM uses dynamic class names. Never assume selectors — dump broad HTML structure first, then narrow down.
- **Fragile extraction scripts**: Scripts that target specific elements by class name break when the page structure changes. Use position-based heuristics (e.g., "links with left < 250 and top > 80") as a fallback.
- **Narrow viewports for Mintlify**: At 1440px, the assistant panel covers the TOC. Use 1920px OR close the assistant to see the full layout.
- **npm pack for theme source**: The `mintlify` npm package is just a CLI wrapper. The actual theme/layout code is in Mintlify's private Next.js app. The `@mintlify/components` package has UI components and a `styles.css` but not the page layout. The live site is the only reliable reference.

## CSS Development in Docusaurus

### Swizzle over override

When Docusaurus applies styles with `!important` (like `padding-top--md`), don't fight it with more `!important`. Swizzle the component that generates the problematic markup and remove the class entirely. This is cleaner and survives upgrades.

Components worth swizzling for layout control:
- `DocRoot/Layout/Main` — owns the `<main>` wrapper and padding classes
- `DocItem/Layout` — owns the content/TOC grid (`row`/`col`/`col--3`)
- `DocItem/Content` — owns what renders inside the article

### CSS load order

Docusaurus loads its own CSS after theme CSS. When both use `!important`, the last one wins. This means theme `!important` declarations lose to Docusaurus core `!important` declarations. The fix is to either use higher specificity selectors or (better) swizzle the component.

### Use your own class names

Instead of targeting Docusaurus internal classes like `[class*='docMainContainer']`, define your own classes in swizzled components (`.mintysaurus-panel`, `.mintysaurus-article`, etc.). This makes CSS self-documenting and immune to Docusaurus internal changes.

## Container Workflow

- **No host installs**: Everything runs in containers. Puppeteer-core is installed in the Docusaurus container. Chromium has its own container with CDP relay.
- **Dev server hot reload**: CSS changes are picked up automatically. New swizzled components require a container restart (`docker restart docusaurus`).
- **Screenshots in /tmp**: All screenshots go to `/tmp/` inside the Docusaurus container, then `docker cp` to the host. `/tmp` is cleared on reboot.
- **Build vs dev**: The dev server is the primary workflow. `docusaurus build` fails due to permission issues on the build dir but that doesn't matter for development.

## Git Workflow

- **Commit before changing direction**: Always commit working CSS before starting a new round of changes. This provides a safety net.
- **Two repos**: homelab (`~/apps/`) and standalone theme (`~/docusaurus-theme-mintysaurus/`). After changes, `cp -r` the theme src to the standalone repo, commit both, push both.
- **Be selective with git add**: The homelab repo has unrelated files (db dumps, other services). Always `git add` specific paths, never `git add -A` on the whole repo.

## Visual Comparison Methodology

1. **Screenshot both sites** at the same viewport size
2. **Identify differences visually** — don't guess, look at the screenshots
3. **Extract computed styles** from the reference site for the specific elements that differ
4. **Trace the layout chain** if positions don't match — walk up the DOM
5. **Make targeted CSS fixes** based on extracted values
6. **Re-screenshot and compare** — iterate until matched

The reference site for the Almond theme is `https://almond.mintlify.app`, NOT `https://www.mintlify.com/docs` (which uses a customized version of the theme with additional features like the assistant panel).
