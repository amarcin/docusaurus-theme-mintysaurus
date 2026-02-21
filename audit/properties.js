// All CSS properties to extract from every element
module.exports = [
  // Typography
  'fontSize', 'fontWeight', 'fontFamily', 'fontStyle', 'fontVariant',
  'lineHeight', 'letterSpacing', 'textTransform', 'textDecoration',
  'textAlign', 'textOverflow', 'textIndent', 'textShadow',
  'whiteSpace', 'wordBreak', 'overflowWrap', 'wordSpacing',
  'color',

  // Box model
  'display', 'boxSizing', 'width', 'height',
  'maxWidth', 'minWidth', 'maxHeight', 'minHeight',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',

  // Background & borders
  'backgroundColor', 'backgroundImage', 'backgroundSize',
  'backgroundPosition', 'backgroundRepeat',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
  'boxShadow', 'outline', 'outlineWidth', 'outlineStyle', 'outlineColor',

  // Layout & positioning
  'position', 'top', 'right', 'bottom', 'left',
  'float', 'clear', 'verticalAlign', 'zIndex',

  // Flexbox
  'flexDirection', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis',
  'justifyContent', 'alignItems', 'alignSelf', 'alignContent',
  'gap', 'columnGap', 'rowGap', 'order',

  // Grid
  'gridTemplateColumns', 'gridTemplateRows', 'gridGap',
  'gridColumn', 'gridRow',

  // Overflow & scroll
  'overflow', 'overflowX', 'overflowY',
  'scrollBehavior', 'scrollMarginTop',

  // Visual
  'opacity', 'visibility', 'cursor', 'pointerEvents',
  'transform', 'transformOrigin',
  'transition', 'transitionProperty', 'transitionDuration',
  'transitionTimingFunction', 'transitionDelay',

  // List
  'listStyleType', 'listStylePosition',

  // Table
  'borderCollapse', 'borderSpacing', 'tableLayout',

  // Misc
  'content', 'resize', 'userSelect',
  'WebkitFontSmoothing',
];
