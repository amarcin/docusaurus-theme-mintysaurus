import React from 'react';
import {useWindowSize} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import DocItemPaginator from '@theme/DocItem/Paginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import DocVersionBadge from '@theme/DocVersionBadge';
import DocItemFooter from '@theme/DocItem/Footer';
import DocItemTOCMobile from '@theme/DocItem/TOC/Mobile';
import DocItemTOCDesktop from '@theme/DocItem/TOC/Desktop';
import DocItemContent from '@theme/DocItem/Content';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import ContentVisibility from '@theme/ContentVisibility';

function useDocTOC() {
  const {frontMatter, toc} = useDoc();
  const windowSize = useWindowSize();
  const hidden = frontMatter.hide_table_of_contents;
  const canRender = !hidden && toc.length > 0;
  return {
    hidden,
    mobile: canRender ? <DocItemTOCMobile /> : undefined,
    desktop: canRender && (windowSize === 'desktop' || windowSize === 'ssr')
      ? <DocItemTOCDesktop />
      : undefined,
  };
}

export default function DocItemLayout({children}) {
  const docTOC = useDocTOC();
  const {metadata} = useDoc();
  return (
    <div className="mintysaurus-content-row">
      <div className="mintysaurus-article">
        <ContentVisibility metadata={metadata} />
        <DocVersionBanner />
        <DocVersionBadge />
        {docTOC.mobile}
        <article>
          <DocBreadcrumbs />
          <DocItemContent>{children}</DocItemContent>
          <DocItemFooter />
        </article>
        <DocItemPaginator />
      </div>
      {docTOC.desktop && (
        <div className="mintysaurus-toc">{docTOC.desktop}</div>
      )}
    </div>
  );
}
