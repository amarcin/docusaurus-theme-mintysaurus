import React from 'react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';

function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  return shouldRender ? metadata.title : null;
}

export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();
  const {metadata, frontMatter} = useDoc();
  const description = metadata.description;
  const sectionLabel = frontMatter.sidebar_class_name || null;

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          {sectionLabel && (
            <p className="mintlify-section-label">{sectionLabel}</p>
          )}
          <Heading as="h1">{syntheticTitle}</Heading>
          {description && (
            <p className="mintlify-description">{description}</p>
          )}
        </header>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
