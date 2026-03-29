import { db } from '@/db'
import type { EmployeeCredential } from '@/types'

export async function getEmployeeCredential(employeeId: number): Promise<EmployeeCredential | undefined> {
  return db.employee_credentials.get(employeeId)
}

export async function upsertEmployeeCredential(credential: EmployeeCredential): Promise<void> {
  await db.employee_credentials.put(credential)
}
