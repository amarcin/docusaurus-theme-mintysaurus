import React, {useState} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useAnnouncementBar, useScrollPosition} from '@docusaurus/theme-common/internal';
import {translate} from '@docusaurus/Translate';
import DocSidebarItems from '@theme/DocSidebarItems';
import BrowserOnly from '@docusaurus/BrowserOnly';

function useShowAnnouncementBar() {
  const {isActive} = useAnnouncementBar();
  const [showAnnouncementBar, setShowAnnouncementBar] = useState(isActive);
  useScrollPosition(({scrollY}) => {
    if (isActive) setShowAnnouncementBar(scrollY === 0);
  }, [isActive]);
  return isActive && showAnnouncementBar;
}

export default function DocSidebarDesktopContent({path, sidebar, className}) {
  const showAnnouncementBar = useShowAnnouncementBar();
  return (
    <div className="sidebar-with-search">
      <div className="sidebar-search-container">
        <BrowserOnly>
          {() => {
            const SearchBar = require('@theme/SearchBar').default;
            return <SearchBar />;
          }}
        </BrowserOnly>
      </div>
      <nav
        aria-label={translate({
          id: 'theme.docs.sidebar.navAriaLabel',
          message: 'Docs sidebar',
          description: 'The ARIA label for the sidebar navigation',
        })}
        className={clsx('menu thin-scrollbar', className)}>
        <ul className={clsx(ThemeClassNames.docs.docSidebarMenu, 'menu__list')}>
          <DocSidebarItems items={sidebar} activePath={path} level={1} />
        </ul>
      </nav>
    </div>
  );
}
