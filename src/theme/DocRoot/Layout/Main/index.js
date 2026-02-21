import React from 'react';
import clsx from 'clsx';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';

export default function DocRootLayoutMain({hiddenSidebarContainer, children}) {
  const sidebar = useDocsSidebar();
  return (
    <main
      className={clsx(
        'mintysaurus-panel',
        (hiddenSidebarContainer || !sidebar) && 'mintysaurus-panel--full',
      )}>
      {children}
    </main>
  );
}
