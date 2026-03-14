export type Role = 'admin' | 'manager' | 'cashier'

export interface Employee {
  id?: number
  name: string
  role: Role
  pinHash?: string       // cashier only
  passwordHash?: string  // admin/manager only
  isActive: boolean
  createdAt: Date
}

export interface AuthSession {
  employeeId: number
  role: Role
  name: string
  loginAt: Date
  expiresAt: Date
}
