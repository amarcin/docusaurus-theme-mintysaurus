import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import {translate} from '@docusaurus/Translate';
import NavbarMobileSidebar from '@theme/Navbar/MobileSidebar';

function NavbarBackdrop(props) {
  return <div role="presentation" {...props} className={clsx('navbar-sidebar__backdrop', props.className)} />;
}

export default function NavbarLayout({children}) {
  const mobileSidebar = useNavbarMobileSidebar();
  return (
    <nav
      aria-label={translate({id: 'theme.NavBar.navAriaLabel', message: 'Main'})}
      className={clsx(
        ThemeClassNames.layout.navbar.container,
        'navbar',
        'mintysaurus-navbar',
        {'navbar-sidebar--show': mobileSidebar.shown},
      )}>
      {children}
      <NavbarBackdrop onClick={mobileSidebar.toggle} />
      <NavbarMobileSidebar />
    </nav>
  );
}
