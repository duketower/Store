import bcrypt from 'bcryptjs'
import { db } from '@/db'
import type { Employee, AuthSession } from '@/types'
import { SESSION_DURATION } from '@/constants/roles'

export async function verifyPin(employeeId: number, pin: string): Promise<Employee | null> {
  const employee = await db.employees.get(employeeId)
  if (!employee || !employee.isActive) return null
  if (!employee.pinHash) return null

  const valid = await bcrypt.compare(pin, employee.pinHash)
  return valid ? employee : null
}

export async function verifyPassword(username: string, password: string): Promise<Employee | null> {
  // Admin/manager login by name match (case-insensitive)
  const employees = await db.employees
    .filter(
      (e) =>
        e.isActive &&
        (e.role === 'admin' || e.role === 'manager') &&
        e.name.toLowerCase() === username.toLowerCase()
    )
    .toArray()

  for (const employee of employees) {
    if (!employee.passwordHash) continue
    const valid = await bcrypt.compare(password, employee.passwordHash)
    if (valid) return employee
  }

  return null
}

export function createSession(employee: Employee): AuthSession {
  const now = new Date()
  const durationHours = SESSION_DURATION[employee.role]
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000)

  return {
    employeeId: employee.id!,
    role: employee.role,
    name: employee.name,
    loginAt: now,
    expiresAt,
  }
}

export function isSessionExpired(session: AuthSession): boolean {
  return new Date() > session.expiresAt
}

export async function getActiveEmployees(): Promise<Employee[]> {
  return db.employees.filter((e) => e.isActive === true).sortBy('name')
}

