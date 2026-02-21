# docusaurus-theme-mintysaurus

A Docusaurus theme that replicates Mintlify's [Almond](https://almond.mintlify.app) theme. Write markdown, get a polished docs site with the signature inset panel layout, clean typography, and scroll-aware TOC.

## Quick Start

```bash
npx create-docusaurus@latest my-docs classic
cd my-docs
npm install github:amarcin/docusaurus-theme-mintysaurus
```

Add the theme to `docusaurus.config.js`:

```js
export default {
  themes: ['docusaurus-theme-mintysaurus'],
  presets: [
    ['classic', {
      docs: {
        sidebarItemsGenerator: require('docusaurus-theme-mintysaurus/sidebar'),
      },
    }],
  ],
};
```

Run `npm start` and your docs look like Mintlify.

## Architecture

The theme is a Docusaurus theme plugin that provides CSS and swizzled React components. No build step — source files are used directly.

### Swizzled Components

These components override Docusaurus defaults to control layout and content rendering:

| Component | Purpose |
|---|---|
| `DocRoot/Layout/Main` | Replaces Docusaurus's `<main>` wrapper. Removes the built-in `padding-top--md` and `container` classes that fight CSS overrides. Applies `.mintysaurus-panel` for the inset card. |
| `DocItem/Layout` | Replaces the `row`/`col`/`col--3` grid with a clean flex layout (`.mintysaurus-content-row`, `.mintysaurus-article`, `.mintysaurus-toc`). |
| `DocItem/Content` | Adds the category eyebrow label and page description below the title. Reads `sidebar_group` from the sidebar breadcrumbs. |
| `DocItem/Footer` | Minimal footer — removes "Edit this page" and metadata row. |
| `DocSidebar/Desktop/Content` | Moves the search bar from the navbar into the sidebar, matching Mintlify's layout. |
| `DocBreadcrumbs` | Returns null — Mintlify/Almond doesn't show breadcrumbs. |
| `TOC` | Custom "On this page" heading with filter icon. |
| `TOCItems` + `TOCItems/Tree` | Renders TOC links with left-border active indicator. |
| `Heading` | Adds anchor links on hover. |
| `Footer/Layout` | Minimal centered footer. |

### CSS Structure

All styles live in `src/css/mintysaurus.css` (~430 lines). Key sections:

- **Variables** — color palette, typography, spacing, all as CSS custom properties
- **Inset panel** — the signature Almond layout: sidebar on page background, content in a bordered rounded card
- **Sidebar** — 264px width, 14px links, 12px border-radius active state, group headers with icons
- **Content area** — 48px/64px panel padding, 48px inner padding-left, 576px max content width
- **Typography** — Inter font, 30px H1, 24px H2, 16px body, 18px subtitle
- **TOC** — 14px links, primary-colored active with left border, transparent border on inactive
- **Dark mode** — full dark palette via `[data-theme='dark']`

### Layout Chain (Desktop, 1440px)

```
viewport (1440px)
└── docsWrapper (margin: 0 8px → 1424px)
    └── docRoot (flex row)
        ├── sidebar (264px, transparent bg, own scroll)
        └── .mintysaurus-panel (flex:1, left:272, width:1160)
            │  border-radius: 16px 16px 0 0
            │  border: 1px solid rgba(223,225,224,0.7)
            │  padding: 48px 64px 0
            └── .mintysaurus-content-row (flex, max-width:884px, margin:0 auto)
                ├── .mintysaurus-article (max-width:576px, overflow-x:auto)
                │   gap: 88px
                └── .mintysaurus-toc (flex:0 0 220px)
```

### Responsive Breakpoints

| Viewport | TOC | Content row | Notes |
|---|---|---|---|
| ≥1280px | Visible (220px) | Centered, 88px gap | Full layout with TOC |
| 997–1279px | Hidden | Centered, max-width 576px | Content fills panel width |
| ≤996px | Mobile collapsible | Full width | Standard mobile layout |

### File Map

```
src/
├── index.js                              ← Plugin entry: registers theme path + CSS
├── sidebar.js                            ← Custom sidebar generator (groups, ordering)
├── css/
│   └── mintysaurus.css                   ← All styles
└── theme/
    ├── DocRoot/Layout/Main/index.js      ← Panel wrapper (swizzled)
    ├── DocItem/Layout/index.js           ← Content + TOC flex layout (swizzled)
    ├── DocItem/Content/index.js          ← Eyebrow + description (swizzled)
    ├── DocItem/Footer/index.js           ← Minimal footer (swizzled)
    ├── DocSidebar/Desktop/Content/index.js ← Search in sidebar (swizzled)
    ├── DocBreadcrumbs/index.js           ← Disabled (swizzled)
    ├── TOC/index.js                      ← "On this page" heading (swizzled)
    ├── TOCItems/index.js                 ← TOC link list (swizzled)
    ├── TOCItems/Tree.js                  ← TOC link rendering (swizzled)
    ├── TOC/styles.module.css             ← TOC styles
    ├── Heading/index.js                  ← Anchor headings (swizzled)
    ├── Heading/styles.module.css         ← Heading styles
    └── Footer/Layout/index.js            ← Minimal footer (swizzled)
```

## Writing Docs

Put markdown files in `docs/`. Organize with folders. The sidebar builds itself automatically.

```
docs/
├── intro.md
├── installation.md
├── guides/
│   ├── quickstart.md
│   └── deployment.md
└── api/
    ├── authentication.md
    └── endpoints.md
```

Folders become collapsible dropdowns with chevrons. Files become pages. No config needed.

### Ordering

Add `sidebar_position` to frontmatter:

```yaml
---
sidebar_position: 1
---
```

### Display Names

The sidebar uses your first `# heading` as the label. To override:

```yaml
---
sidebar_label: Getting Started
---
```

### Page Descriptions

Shown as a subtitle below the page title:

```yaml
---
description: A short explanation that appears below the page heading
---
```

### Clickable Folders

Add an `index.md` inside a folder to make the folder name link to a page:

```
docs/
└── guides/
    ├── index.md        ← clicking "Guides" goes here
    ├── quickstart.md
    └── deployment.md
```

## Sidebar Groups

Groups are non-collapsible section headers with optional icons — like Mintlify's navigation groups. They organize your docs into labeled sections without adding URL segments.

### Setup

1. Create `docs/_groups.md` (automatically excluded from your site):

```markdown
---
groups:
  - label: Guides
    icon: book-open
    position: 10
  - label: API
    icon: code
    position: 20
  - label: Resources
    icon: archive
    position: 30
---
```

2. Add `sidebar_group` to each doc's frontmatter:

```yaml
---
sidebar_group: Guides
sidebar_position: 1
---
```

3. Keep `sidebars.js` as the default:

```js
export default {
  docs: [{type: 'autogenerated', dirName: '.'}],
};
```

The theme reads `_groups.md`, groups your docs by `sidebar_group`, and builds the sidebar automatically. Docs without `sidebar_group` appear at the top level.

### How It Works

- `position` in `_groups.md` controls where groups appear relative to each other and to ungrouped docs
- `icon` is a [Lucide](https://lucide.dev/icons/) icon name — the theme ships CSS masks for `server`, `notebook-pen`, and `archive`
- Subfolders within a group still become collapsible dropdowns automatically
- The `sidebar_group` field is a custom frontmatter key that Docusaurus passes through without warnings

### Adding Icons

The theme includes CSS for `server`, `notebook-pen`, and `archive`. To add more, define the icon mask in your `custom.css`:

```css
.sidebar-icon-book-open > .menu__list-item-collapsible > .menu__link::before {
  content: ""; display: block; width: 14px; height: 14px; min-width: 14px;
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center; mask-position: center;
  -webkit-mask-size: 100%; mask-size: 100%;
  -webkit-mask-image: url("data:image/svg+xml,...your-svg...");
  mask-image: url("data:image/svg+xml,...your-svg...");
}
```

Get SVG data URIs from [lucide.dev](https://lucide.dev/icons/).

## Customization

### Accent Color

Override the primary color in your `src/css/custom.css`. This controls the active sidebar link, eyebrow label, TOC active indicator, and all link colors:

```css
:root {
  --ifm-color-primary: #2563eb;
  --ifm-color-primary-dark: #1d4ed8;
  --ifm-color-primary-darker: #1e40af;
  --ifm-color-primary-darkest: #1e3a8a;
  --ifm-color-primary-light: #3b82f6;
  --ifm-color-primary-lighter: #60a5fa;
  --ifm-color-primary-lightest: #93c5fd;
}
```

The active sidebar link background is derived automatically: `rgba(primary, 0.1)`. Update `--mintlify-sidebar-active-bg` if you need a different opacity.

Use the [Docusaurus color generator](https://docusaurus.io/docs/styling-layout#styling-your-site-with-infima) to compute shades.

### Content Width

```css
:root {
  --mintlify-content-max-width: 640px;  /* default: 576px */
}
```

### Theme Tokens

All visual values are CSS custom properties. Key tokens:

| Token | Default | Purpose |
|---|---|---|
| `--mintlify-page-bg` | `#f5f5f4` | Page background (behind the panel) |
| `--mintlify-panel-bg` | `#ffffff` | Content panel background |
| `--mintlify-border` | `rgba(223,225,224,0.7)` | Panel border color |
| `--mintlify-body-color` | `#3f4140` | Body text color |
| `--mintlify-heading-color` | `#171a18` | Heading text color |
| `--mintlify-muted` | `#505351` | Secondary text (TOC links) |
| `--mintlify-content-max-width` | `576px` | Article max width |

All tokens have dark mode equivalents under `[data-theme='dark']`.

## Design Reference

This theme is matched against Mintlify's [Almond starter kit](https://almond.mintlify.app) at 1440×900 viewport. Key verified values:

- Sidebar: 264px, links 14px/20px weight 400, active bg `rgba(primary, 0.1)` with 12px border-radius
- Group headers: 14px weight 500, no background, 16px left padding
- Content panel: 16px border-radius, 1px border, padding 48px 64px 0
- Inner content: 48px left offset, max-width 576px
- H1: 30px/36px weight 700, letter-spacing -0.75px
- H2: 24px/32px weight 600, letter-spacing -0.6px
- Body: 16px/28px weight 400
- Subtitle: 18px/28px weight 400
- Eyebrow: 14px weight 600, primary color
- TOC: 14px, active weight 500 with 1px left border in primary color

## Requirements

- Docusaurus 3.9+
- React 18 or 19

## License

MIT
