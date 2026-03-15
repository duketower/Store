import type { Role } from '@/types'
import type { PlanFeature } from '@/types/clientConfig'

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  BILLING: '/billing',
  RECEIVE_STOCK: '/inventory/receive-stock',
  PRODUCTS: '/inventory/products',
  VENDORS: '/inventory/vendors',
  SHIFT_CLOSE: '/inventory/shift-close',
  CUSTOMERS: '/customers',
  REPORTS: '/reports',
  USERS: '/users',
  SETTINGS: '/settings',
  MIGRATION: '/settings/migrate',
  ERROR_LOG: '/settings/errors',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

// Must stay in sync with the ICONS map in Sidebar.tsx.
// Adding a new icon here without adding it to Sidebar's ICONS map causes a missing icon at runtime.
export type NavIconName =
  | 'ShoppingCart' | 'PackagePlus' | 'Users' | 'Package'
  | 'Boxes' | 'BarChart3' | 'UserCog' | 'Settings' | 'LayoutDashboard' | 'Truck'

export interface NavItem {
  label: string
  path: RoutePath
  icon: NavIconName
  roles: Role[]
  // Optional plan-tier gate. If set, this nav item is hidden (and route blocked)
  // for plans that don't include this feature. Checked via hasFeature().
  feature?: PlanFeature
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    path: ROUTES.DASHBOARD,    icon: 'LayoutDashboard', roles: ['admin', 'manager'],            feature: 'dashboard' },
  { label: 'Billing',      path: ROUTES.BILLING,       icon: 'ShoppingCart',    roles: ['admin', 'manager', 'cashier'] },
  { label: 'Receive Stock',path: ROUTES.RECEIVE_STOCK, icon: 'PackagePlus',     roles: ['admin', 'manager', 'cashier'] },
  { label: 'Customers',    path: ROUTES.CUSTOMERS,     icon: 'Users',           roles: ['admin', 'manager', 'cashier'], feature: 'credit_ledger' },
  { label: 'Products',     path: ROUTES.PRODUCTS,      icon: 'Package',         roles: ['admin', 'manager', 'cashier'] },
  { label: 'Vendors',      path: ROUTES.VENDORS,       icon: 'Truck',           roles: ['admin', 'manager'],            feature: 'rtv' },
  { label: 'Shift',        path: ROUTES.SHIFT_CLOSE,   icon: 'Boxes',           roles: ['admin', 'manager', 'cashier'] },
  { label: 'Reports',      path: ROUTES.REPORTS,       icon: 'BarChart3',       roles: ['admin', 'manager'],            feature: 'reports' },
  { label: 'Users',        path: ROUTES.USERS,         icon: 'UserCog',         roles: ['admin'] },
  { label: 'Settings',     path: ROUTES.SETTINGS,      icon: 'Settings',        roles: ['admin'] },
]
