import React from 'react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {useSidebarBreadcrumbs} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';

function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  return shouldRender ? metadata.title : null;
}

function useCategoryLabel() {
  const breadcrumbs = useSidebarBreadcrumbs();
  if (!breadcrumbs || breadcrumbs.length === 0) return null;
  // Find the nearest category in the breadcrumb trail
  const category = breadcrumbs.find(item => item.type === 'category');
  return category?.label || null;
}

export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();
  const {metadata} = useDoc();
  const categoryLabel = useCategoryLabel();

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {categoryLabel && (
        <p className="mintlify-eyebrow">{categoryLabel}</p>
      )}
      {syntheticTitle ? (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
          {metadata.description && (
            <p className="mintlify-description">{metadata.description}</p>
          )}
        </header>
      ) : null}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
