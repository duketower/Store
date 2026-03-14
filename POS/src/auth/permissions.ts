import type { Role } from '@/types'

export type Feature =
  | 'billing'
  | 'receive_stock'
  | 'customer_lookup'
  | 'product_search'
  | 'product_edit'
  | 'purchase_orders'
  | 'reports'
  | 'stock_adjustments'
  | 'shift_close'
  | 'user_management'
  | 'settings'

const PERMISSIONS: Record<Feature, Role[]> = {
  billing:          ['admin', 'manager', 'cashier'],
  receive_stock:    ['admin', 'manager', 'cashier'],
  customer_lookup:  ['admin', 'manager', 'cashier'],
  product_search:   ['admin', 'manager', 'cashier'],
  product_edit:     ['admin', 'manager'],
  purchase_orders:  ['admin', 'manager'],
  reports:          ['admin', 'manager'],
  stock_adjustments:['admin', 'manager'],
  shift_close:      ['admin', 'manager', 'cashier'],
  user_management:  ['admin'],
  settings:         ['admin'],
}

export function canAccess(role: Role, feature: Feature): boolean {
  return PERMISSIONS[feature]?.includes(role) ?? false
}

export function requiresAdmin(feature: Feature): boolean {
  return PERMISSIONS[feature]?.length === 1 && PERMISSIONS[feature][0] === 'admin'
}
