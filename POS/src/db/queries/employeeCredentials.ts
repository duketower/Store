import type { EmployeeCredential } from '@/types'
import { syncEmployeeCredentialToFirestore } from '@/services/firebase/sync'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export async function getEmployeeCredential(employeeId: number): Promise<EmployeeCredential | undefined> {
  // Employee credentials are stored within the employees collection in Firestore.
  // The store does not have a separate employeeCredentials slice, so we read from employees.
  const employees = useFirestoreDataStore.getState().employees
  const employee = employees.find((e) => e.id === employeeId)
  if (!employee) return undefined
  // Credentials are not stored in the Firestore data store by design.
  // Fall back: return undefined — auth service reads from Firestore directly.
  return undefined
}

export async function upsertEmployeeCredential(credential: EmployeeCredential): Promise<void> {
  await syncEmployeeCredentialToFirestore({
    employeeId: credential.employeeId,
    pinHash: credential.pinHash,
    updatedAt: credential.updatedAt,
  })
}
