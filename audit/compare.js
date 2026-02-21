// Comparison logic: extract styles from both sites and compare
const ALL_PROPS = require('./properties');

// Primary colors for each site — used to normalize "primary" comparisons.
// Almond uses teal, Docusaurus uses green. Both are "the primary color".
const ALMOND_PRIMARY = { r: 0, g: 150, b: 137 };
const DOC_PRIMARY = { r: 22, g: 110, b: 63 };

// Build the JS expression that extracts all computed styles from an element
function buildExtractExpression(selectorOrEval) {
  const getEl = selectorOrEval.eval
    ? selectorOrEval.eval
    : `document.querySelector('${selectorOrEval.selector.replace(/'/g, "\\'")}')`;

  const propsStr = JSON.stringify(ALL_PROPS);

  return `(function() {
    var el = ${getEl};
    if (!el) return null;
    var cs = getComputedStyle(el);
    var props = ${propsStr};
    var result = {};
    for (var i = 0; i < props.length; i++) {
      try { result[props[i]] = cs[props[i]] || ''; } catch(e) { result[props[i]] = ''; }
    }
    var r = el.getBoundingClientRect();
    result._rect = { left: r.left, top: r.top, width: r.width, height: r.height };
    result._tag = el.tagName.toLowerCase();
    result._text = el.textContent.trim().substring(0, 80);
    return result;
  })()`;
}

function normalize(prop, value) {
  if (value === undefined || value === null) return '';
  let v = String(value).trim();
  if (prop === 'fontFamily') v = v.replace(/["']/g, '').toLowerCase();
  v = v.replace(/^0(px|em|rem|%)$/, '0px');
  return v;
}

function parseColor(str) {
  const rgba = str.match(/rgba?\(([^)]+)\)/);
  if (!rgba) return null;
  const parts = rgba[1].split(',').map(s => parseFloat(s.trim()));
  return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] : 1 };
}

function isPrimaryColor(colorStr, site) {
  const c = parseColor(colorStr);
  if (!c) return false;
  const ref = site === 'almond' ? ALMOND_PRIMARY : DOC_PRIMARY;
  return Math.abs(c.r - ref.r) <= 5 && Math.abs(c.g - ref.g) <= 5 && Math.abs(c.b - ref.b) <= 5;
}

function isPrimaryAlpha(colorStr, site) {
  const c = parseColor(colorStr);
  if (!c || c.a >= 0.95) return false;
  const ref = site === 'almond' ? ALMOND_PRIMARY : DOC_PRIMARY;
  return Math.abs(c.r - ref.r) <= 5 && Math.abs(c.g - ref.g) <= 5 && Math.abs(c.b - ref.b) <= 5;
}

// Check if a border-style difference is visually meaningless
// "solid" vs "none" when border-width is "0px" looks identical
function isBorderStyleIrrelevant(prop, almondStyles, docStyles) {
  if (!prop.match(/border(Top|Right|Bottom|Left)Style/)) return false;
  const side = prop.replace('Style', 'Width');
  const aw = parseFloat(almondStyles[side]) || 0;
  const dw = parseFloat(docStyles[side]) || 0;
  return aw === 0 && dw === 0;
}

// Check if an outline difference is visually meaningless
// outline-color inherits from color; when outline-style is "none", the color doesn't matter
function isOutlineIrrelevant(prop, almondStyles, docStyles) {
  if (prop === 'outlineColor' || prop === 'outline') {
    const aStyle = almondStyles.outlineStyle || '';
    const dStyle = docStyles.outlineStyle || '';
    const aWidth = parseFloat(almondStyles.outlineWidth) || 0;
    const dWidth = parseFloat(docStyles.outlineWidth) || 0;
    return (aStyle === 'none' && dStyle === 'none') || (aWidth === 0 && dWidth === 0);
  }
  return false;
}

// Compare two values for a given property
function compareValues(prop, almondVal, docVal, tolerance = {}, almondStyles = {}, docStyles = {}) {
  const a = normalize(prop, almondVal);
  const d = normalize(prop, docVal);

  if (a === d) return { match: true };

  // Border-style when width is 0: visually identical
  if (isBorderStyleIrrelevant(prop, almondStyles, docStyles)) {
    return { match: true, note: 'border-style irrelevant (width is 0)' };
  }

  // Outline color when outline is none: visually identical
  if (isOutlineIrrelevant(prop, almondStyles, docStyles)) {
    return { match: true, note: 'outline irrelevant (style is none)' };
  }

  // Primary color normalization: both sites use their own primary
  if (prop.toLowerCase().includes('color') || prop === 'backgroundColor') {
    if (isPrimaryColor(a, 'almond') && isPrimaryColor(d, 'docusaurus')) {
      return { match: true, note: 'both are primary color' };
    }
    if (isPrimaryAlpha(a, 'almond') && isPrimaryAlpha(d, 'docusaurus')) {
      const ca = parseColor(a);
      const cd = parseColor(d);
      if (ca && cd && Math.abs(ca.a - cd.a) <= 0.02) {
        return { match: true, note: 'both are primary color with same alpha' };
      }
    }
  }

  // Color comparison with tolerance
  if (prop.toLowerCase().includes('color') || prop === 'backgroundColor' || prop === 'boxShadow') {
    const ca = parseColor(a);
    const cd = parseColor(d);
    if (ca && cd) {
      const ct = tolerance.color || 3;
      const at = tolerance.alpha || 0.02;
      if (Math.abs(ca.r - cd.r) <= ct && Math.abs(ca.g - cd.g) <= ct &&
          Math.abs(ca.b - cd.b) <= ct && Math.abs(ca.a - cd.a) <= at) {
        return { match: true, note: 'color within tolerance' };
      }
    }
  }

  // Numeric px comparison with tolerance
  const aPx = parseFloat(a);
  const dPx = parseFloat(d);
  if (!isNaN(aPx) && !isNaN(dPx) && a.endsWith('px') && d.endsWith('px')) {
    const pt = tolerance.px || 1;
    if (Math.abs(aPx - dPx) <= pt) {
      return { match: true, note: `within ${pt}px tolerance` };
    }
  }

  return { match: false, reason: `"${a}" vs "${d}"` };
}

module.exports = { buildExtractExpression, compareValues, normalize };
