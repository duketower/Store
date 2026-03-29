export type Role = 'admin' | 'manager' | 'cashier'

export interface Employee {
  id?: number
  name: string
  role: Role
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
  monthlyLeaveAllotment?: number  // default 3 when absent; admin-editable per employee
  credentialUpdatedAt?: Date
}

export interface EmployeeCredential {
  employeeId: number
  pinHash: string
  updatedAt: Date
}

export interface AuthSession {
  employeeId: number
  role: Role
  name: string
  loginAt: Date
  expiresAt: Date
}
