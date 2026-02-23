import React, {useMemo, useEffect, useRef} from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useFilteredAndTreeifiedTOC} from '@docusaurus/theme-common/internal';
import TOCItemTree from '@theme/TOCItems/Tree';

function getVisibleBoundingClientRect(el) {
  const rect = el.getBoundingClientRect();
  if (rect.top === rect.bottom) return getVisibleBoundingClientRect(el.parentNode);
  return rect;
}

function usePanelTOCHighlight(config) {
  const lastActiveRef = useRef(undefined);

  useEffect(() => {
    if (!config) return;
    const {linkClassName, linkActiveClassName, minHeadingLevel, maxHeadingLevel} = config;

    // Find the scroll container: the inset panel (main after sidebar)
    const panel = document.querySelector('.theme-doc-sidebar-container + main') || document;

    const selectors = [];
    for (let i = minHeadingLevel; i <= maxHeadingLevel; i++) selectors.push(`h${i}.anchor`);

    function update() {
      const anchors = Array.from(document.querySelectorAll(selectors.join(',')));
      const links = Array.from(document.getElementsByClassName(linkClassName));

      // Use panel's top as the offset reference
      const panelTop = panel === document ? 0 : panel.getBoundingClientRect().top;
      const offset = panelTop + 10;

      // Find first anchor below offset
      const next = anchors.find(a => getVisibleBoundingClientRect(a).top >= offset);
      let active;
      if (next) {
        const rect = getVisibleBoundingClientRect(next);
        const panelMid = panel === document
          ? window.innerHeight / 2
          : panelTop + panel.clientHeight / 2;
        active = rect.top < panelMid ? next : anchors[anchors.indexOf(next) - 1] ?? null;
      } else {
        active = anchors[anchors.length - 1] ?? null;
      }

      const activeLink = links.find(l => active && active.id === decodeURIComponent(l.href.substring(l.href.indexOf('#') + 1)));
      // Find parent H2 link if active is an H3+
      let parentH2Link = null;
      if (activeLink && activeLink.closest('li.toc-h3')) {
        let prev = activeLink.closest('li').previousElementSibling;
        while (prev && prev.classList.contains('toc-h3')) prev = prev.previousElementSibling;
        if (prev) parentH2Link = prev.querySelector('a');
      }
      links.forEach(l => {
        if (l === activeLink || l === parentH2Link) {
          l.classList.add(linkActiveClassName);
        } else {
          l.classList.remove(linkActiveClassName);
        }
      });
      lastActiveRef.current = activeLink;
    }

    const target = panel === document ? document : panel;
    target.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [config]);
}

export default function TOCItems({
  toc,
  className = 'table-of-contents table-of-contents__left-border',
  linkClassName = 'table-of-contents__link',
  linkActiveClassName = undefined,
  minHeadingLevel: minHeadingLevelOption,
  maxHeadingLevel: maxHeadingLevelOption,
  ...props
}) {
  const themeConfig = useThemeConfig();
  const minHeadingLevel = minHeadingLevelOption ?? themeConfig.tableOfContents.minHeadingLevel;
  const maxHeadingLevel = maxHeadingLevelOption ?? themeConfig.tableOfContents.maxHeadingLevel;
  const tocTree = useFilteredAndTreeifiedTOC({toc, minHeadingLevel, maxHeadingLevel});

  const tocHighlightConfig = useMemo(() => {
    if (linkClassName && linkActiveClassName) {
      return {linkClassName, linkActiveClassName, minHeadingLevel, maxHeadingLevel};
    }
    return undefined;
  }, [linkClassName, linkActiveClassName, minHeadingLevel, maxHeadingLevel]);

  usePanelTOCHighlight(tocHighlightConfig);

  return <TOCItemTree toc={tocTree} className={className} linkClassName={linkClassName} {...props} />;
}
