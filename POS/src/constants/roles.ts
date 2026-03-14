import type { Role } from '@/types'

export const ROLES: Record<Role, Role> = {
  admin: 'admin',
  manager: 'manager',
  cashier: 'cashier',
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Cashier',
}

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  cashier: 'bg-green-100 text-green-800',
}

// Session duration in hours
export const SESSION_DURATION: Record<Role, number> = {
  admin: 12,
  manager: 12,
  cashier: 8,
}
