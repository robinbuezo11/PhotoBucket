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
    displayName: 'Load Images',
    iconName: 'refresh',
    route: '/ui-components/lists',
  },
  {
    displayName: 'Analyze Text',
    iconName: 'layout-navbar-expand',
    route: '/ui-components/menu',
  }
];


