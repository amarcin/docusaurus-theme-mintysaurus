import React from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import styles from './styles.module.css';

const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

export default function TOC({className, ...props}) {
  return (
    <div className={clsx(styles.tableOfContents, 'thin-scrollbar', className)}>
      <div className="toc-heading" onClick={() => {
        const panel = document.querySelector('.mintysaurus-panel');
        if (panel) panel.scrollTo({top: 0, behavior: 'smooth'});
      }} style={{cursor: 'pointer'}}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.44434 12.6665H13.5554" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2.44434 3.3335H13.5554" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2.44434 8H7.33323" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>On this page</span>
      </div>
      <TOCItems
        {...props}
        linkClassName={LINK_CLASS_NAME}
        linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
      />
    </div>
  );
}
