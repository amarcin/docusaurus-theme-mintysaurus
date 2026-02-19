# docusaurus-theme-mintysaurus

A Mintlify-style theme for Docusaurus. Clean typography, tight layout, dark mode, and all the little details that make docs look polished.

## Install

```bash
npm install github:amarcin/docusaurus-theme-mintysaurus
```

## Setup

Add the theme to your `docusaurus.config.js`:

```js
export default {
  themes: ['docusaurus-theme-mintysaurus'],
  // ...
};
```

Load the Inter font in your `src/css/custom.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

That's it. Rebuild your site.

## What it changes

**CSS overrides** — variables, navbar, sidebar (264px), content area (576px centered), TOC column (304px), typography, code blocks, pagination, footer, admonitions, cards, tables, search bar, scrollbar, dark mode.

**Swizzled components:**

| Component | What it does |
|---|---|
| `TOC` | "On this page" heading with icon |
| `TOCItems` | Custom scroll-aware TOC highlight hook for the inset panel |
| `TOCItems/Tree` | Flattens nested h2/h3 into single-level list |
| `DocBreadcrumbs` | Hidden (returns null) |
| `DocItem/Content` | Renders front matter `description` below h1 |
| `DocItem/Footer` | Simplified — tags only |
| `Footer/Layout` | Border-top separator, hidden on docs pages |
| `Heading` | Hash link anchors on h2+ |

**Inset panel layout** — the signature Mintlify look. The content + TOC area renders as a rounded white card with its own scroll, separated from the navbar and sidebar which sit on the page background. The sidebar and content scroll independently.

## Customization

Override CSS variables in your `src/css/custom.css` after the font import:

```css
/* Change accent color */
:root {
  --ifm-color-primary: #2563eb;
  --ifm-color-primary-dark: #1d4ed8;
  --ifm-color-primary-darker: #1e40af;
  --ifm-color-primary-darkest: #1e3a8a;
  --ifm-color-primary-light: #3b82f6;
  --ifm-color-primary-lighter: #60a5fa;
  --ifm-color-primary-lightest: #93c5fd;
}

/* Change content width */
:root {
  --mintlify-content-max-width: 640px;
}
```

Use the [Docusaurus color generator](https://docusaurus.io/docs/styling-layout#styling-your-site-with-infima) to compute color shades.

## Show breadcrumbs

The theme hides breadcrumbs by default. To restore them, add your own `src/theme/DocBreadcrumbs/index.js` — it will take precedence over the theme's version (Docusaurus layered architecture). Delete the file to use the theme's null component again.

## Requirements

- Docusaurus 3.9+
- React 18 or 19

## License

MIT
