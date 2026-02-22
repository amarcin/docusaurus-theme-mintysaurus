import React, {useState, Suspense, lazy} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useAnnouncementBar, useScrollPosition} from '@docusaurus/theme-common/internal';
import {translate} from '@docusaurus/Translate';
import {useColorMode} from '@docusaurus/theme-common';
import DocSidebarItems from '@theme/DocSidebarItems';

const SearchBar = lazy(() => import('@theme/SearchBar'));

function useShowAnnouncementBar() {
  const {isActive} = useAnnouncementBar();
  const [showAnnouncementBar, setShowAnnouncementBar] = useState(isActive);
  useScrollPosition(({scrollY}) => {
    if (isActive) setShowAnnouncementBar(scrollY === 0);
  }, [isActive]);
  return isActive && showAnnouncementBar;
}

function ThemeToggle() {
  const {colorMode, setColorMode} = useColorMode();
  const isDark = colorMode === 'dark';
  return (
    <button
      className="sidebar-theme-toggle"
      onClick={() => setColorMode(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <div className="sidebar-theme-toggle__icons">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="3.5" />
          <path d="M8 1.11v.89M8 14v.89M12.87 3.13l-.63.63M3.76 12.24l-.63.63M14.89 8H14M2 8h-.89M12.87 12.87l-.63-.63M3.76 3.76l-.63-.63" />
        </svg>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 8.5A6.5 6.5 0 017.5 2 5.5 5.5 0 1014 8.5z" />
        </svg>
      </div>
      <div className={`sidebar-theme-toggle__thumb ${isDark ? 'sidebar-theme-toggle__thumb--dark' : ''}`} />
    </button>
  );
}

export default function DocSidebarDesktopContent({path, sidebar, className}) {
  const showAnnouncementBar = useShowAnnouncementBar();
  return (
    <div className="sidebar-with-search">
      <div className="sidebar-search-container">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
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
      <div className="sidebar-theme-container">
        <ThemeToggle />
      </div>
    </div>
  );
}
