import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-dashboard',
    route: '/dashboard',
  },
  {
    navCap: 'User Panel',
  },
  {
    displayName: 'Albums',
    iconName: 'photo',
    route: '/ui-components/badge',
  },
  {
    displayName: 'Edit Albums',
    iconName: 'settings',
    route: '/ui-components/chips',
  },
  {
    displayName: 'Load Images',
    iconName: 'refresh',
    route: '/ui-components/lists',
  },
  {
    displayName: 'Analyze Text',
    iconName: 'layout-navbar-expand',
    route: '/ui-components/menu',
  },
  {
    displayName: 'Tooltips',
    iconName: 'tooltip',
    route: '/ui-components/tooltips',
  }
];
