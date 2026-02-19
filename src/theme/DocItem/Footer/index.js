import React from 'react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import TagsListInline from '@theme/TagsListInline';

export default function DocItemFooter() {
  const {metadata} = useDoc();
  const {tags} = metadata;
  if (tags.length === 0) return null;
  return (
    <footer className={clsx(ThemeClassNames.docs.docFooter, 'docusaurus-mt-lg')}>
      <div className={clsx('row margin-top--sm', ThemeClassNames.docs.docFooterTagsRow)}>
        <div className="col">
          <TagsListInline tags={tags} />
        </div>
      </div>
    </footer>
  );
}
