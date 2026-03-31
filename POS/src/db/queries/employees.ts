import type { Employee } from '@/types'
import { syncEmployeeCredentialToFirestore, syncEmployeeToFirestore } from '@/services/firebase/sync'
import { createEntityId } from '@/utils/syncIds'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

function buildEmployeeSyncPayload(employee: Employee, id: number) {
  return {
    id,
    name: employee.name,
    role: employee.role,
    isActive: employee.isActive,
    monthlyLeaveAllotment: employee.monthlyLeaveAllotment ?? 3,
    ...(employee.credentialUpdatedAt ? { credentialUpdatedAt: employee.credentialUpdatedAt } : {}),
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt ?? employee.createdAt,
  }
}

export async function getAllEmployees(): Promise<Employee[]> {
  return useFirestoreDataStore.getState().employees
}

export async function upsertEmployee(
  employee: Employee,
  credential?: { pinHash: string }
): Promise<number> {
  const now = new Date()
  const id = employee.id ?? createEntityId()
  const saved: Employee = employee.id
    ? {
        ...employee,
        updatedAt: now,
        ...(credential ? { credentialUpdatedAt: now } : {}),
      }
    : {
        ...employee,
        id,
        createdAt: employee.createdAt ?? now,
        updatedAt: now,
        ...(credential ? { credentialUpdatedAt: now } : {}),
      }

  await syncEmployeeToFirestore(buildEmployeeSyncPayload(saved, id))

  if (credential) {
    await syncEmployeeCredentialToFirestore({
      employeeId: id,
      pinHash: credential.pinHash,
      updatedAt: now,
    })
  }

  return id
}

export async function setEmployeeActive(id: number, isActive: boolean): Promise<void> {
  const existing = useFirestoreDataStore.getState().employees.find((e) => e.id === id)
  if (!existing) throw new Error('Employee not found')
  const now = new Date()
  const saved: Employee = { ...existing, isActive, updatedAt: now }
  await syncEmployeeToFirestore(buildEmployeeSyncPayload(saved, id))
}
