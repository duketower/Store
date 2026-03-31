import bcrypt from 'bcryptjs'
import { doc, getDoc } from 'firebase/firestore'
import type { Employee, AuthSession } from '@/types'
import { SESSION_DURATION } from '@/constants/roles'
import { firestore } from '@/services/firebase'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export class EmployeeCredentialUnavailableError extends Error {
  constructor() {
    super('This device needs an internet connection to verify the staff PIN.')
    this.name = 'EmployeeCredentialUnavailableError'
  }
}

export function isEmployeeCredentialUnavailableError(error: unknown): boolean {
  return error instanceof EmployeeCredentialUnavailableError
}

export async function verifyPin(employeeId: number, pin: string): Promise<Employee | null> {
  const employee = useFirestoreDataStore.getState().employees.find(
    (e) => e.id === employeeId && e.isActive
  )
  if (!employee) return null

  let pinHash: string | undefined

  try {
    const snapshot = await getDoc(doc(firestore, 'employee_credentials', String(employeeId)))
    if (snapshot.exists()) {
      const data = snapshot.data()
      pinHash = typeof data?.pinHash === 'string' && data.pinHash.length > 0
        ? data.pinHash
        : undefined
    }
  } catch {
    throw new EmployeeCredentialUnavailableError()
  }

  if (!pinHash) {
    throw new EmployeeCredentialUnavailableError()
  }

  const valid = await bcrypt.compare(pin, pinHash)
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

// Kept for type-compatibility — no longer a prefetch, just a no-op.
// PIN credentials are always fetched from Firestore at login time.
export function prefetchEmployeeCredential(_employeeId: number): Promise<void> {
  return Promise.resolve()
}

