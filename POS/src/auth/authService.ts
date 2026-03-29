import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { doc, getDoc, Timestamp } from 'firebase/firestore'
import type { Employee, EmployeeCredential, AuthSession } from '@/types'
import { SESSION_DURATION } from '@/constants/roles'
import { firestore } from '@/services/firebase'
import {
  getEmployeeCredential as getCachedEmployeeCredential,
  upsertEmployeeCredential,
} from '@/db/queries/employeeCredentials'

export class EmployeeCredentialUnavailableError extends Error {
  constructor() {
    super('This device needs an online credential refresh before that staff PIN can be verified.')
    this.name = 'EmployeeCredentialUnavailableError'
  }
}

function tsToDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value as string)
}

function isCredentialStale(
  employee: Employee,
  credential: EmployeeCredential | undefined
): boolean {
  if (!credential) return true
  if (!employee.credentialUpdatedAt) return false
  return credential.updatedAt.getTime() < employee.credentialUpdatedAt.getTime()
}

async function refreshEmployeeCredential(employee: Employee): Promise<EmployeeCredential | undefined> {
  if (!employee.id) return undefined

  const snapshot = await getDoc(doc(firestore, 'employee_credentials', String(employee.id)))
  if (!snapshot.exists()) return undefined

  const data = snapshot.data()
  if (typeof data?.pinHash !== 'string' || data.pinHash.length === 0) return undefined

  const credential: EmployeeCredential = {
    employeeId: employee.id,
    pinHash: data.pinHash,
    updatedAt: tsToDate(data.updatedAt ?? employee.credentialUpdatedAt ?? employee.updatedAt ?? employee.createdAt),
  }

  await upsertEmployeeCredential(credential)
  return credential
}

export async function prefetchEmployeeCredential(employeeId: number): Promise<void> {
  const employee = await db.employees.get(employeeId)
  if (!employee?.isActive) return

  const cachedCredential = await getCachedEmployeeCredential(employeeId)
  if (!isCredentialStale(employee, cachedCredential)) return

  await refreshEmployeeCredential(employee)
}

export function isEmployeeCredentialUnavailableError(error: unknown): boolean {
  return error instanceof EmployeeCredentialUnavailableError
}

export async function verifyPin(employeeId: number, pin: string): Promise<Employee | null> {
  const employee = await db.employees.get(employeeId)
  if (!employee || !employee.isActive) return null

  let credential = await getCachedEmployeeCredential(employeeId)

  if (isCredentialStale(employee, credential)) {
    try {
      credential = await refreshEmployeeCredential(employee)
    } catch {
      credential = credential && !isCredentialStale(employee, credential) ? credential : undefined
    }
  }

  if (!credential?.pinHash) {
    throw new EmployeeCredentialUnavailableError()
  }

  const valid = await bcrypt.compare(pin, credential.pinHash)
  return valid ? employee : null
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
