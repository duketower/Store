import { db } from '@/db'
import type { Employee } from '@/types'
import { syncEmployeeCredentialToFirestore, syncEmployeeToFirestore } from '@/services/firebase/sync'
import { queueOutboxEntry } from './outbox'
import { createEntityId } from '@/utils/syncIds'

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

async function queueEmployeeSync(employee: Employee, id: number, createdAt: Date): Promise<void> {
  const payload = buildEmployeeSyncPayload(employee, id)
  await queueOutboxEntry({
    action: 'upsert_employee',
    entityType: 'employee',
    entityKey: String(id),
    payload: JSON.stringify({
      ...payload,
      createdAt: payload.createdAt.toISOString(),
      updatedAt: payload.updatedAt.toISOString(),
    }),
    createdAt,
  })
}

async function queueEmployeeCredentialSync(
  employeeId: number,
  pinHash: string,
  createdAt: Date
): Promise<void> {
  await queueOutboxEntry({
    action: 'upsert_employee_credential',
    entityType: 'employee_credential',
    entityKey: String(employeeId),
    payload: JSON.stringify({
      employeeId,
      pinHash,
      updatedAt: createdAt.toISOString(),
    }),
    createdAt,
  })
}

export async function getAllEmployees(): Promise<Employee[]> {
  return db.employees.toArray()
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

  await db.transaction('rw', [db.employees, db.employee_credentials, db.outbox], async () => {
    await db.employees.put(saved)
    await queueEmployeeSync(saved, id, now)
    if (credential) {
      await db.employee_credentials.put({
        employeeId: id,
        pinHash: credential.pinHash,
        updatedAt: now,
      })
      await queueEmployeeCredentialSync(id, credential.pinHash, now)
    }
  })

  syncEmployeeToFirestore(buildEmployeeSyncPayload(saved, id)).catch((err: unknown) =>
    console.warn('[Firestore] employee sync failed (will retry):', err)
  )
  if (credential) {
    syncEmployeeCredentialToFirestore({
      employeeId: id,
      pinHash: credential.pinHash,
      updatedAt: now,
    }).catch((err: unknown) =>
      console.warn('[Firestore] employee credential sync failed (will retry):', err)
    )
  }

  return id
}

export async function setEmployeeActive(id: number, isActive: boolean): Promise<void> {
  const existing = await db.employees.get(id)
  if (!existing) throw new Error('Employee not found')
  const now = new Date()
  const saved: Employee = {
    ...existing,
    isActive,
    updatedAt: now,
  }

  await db.transaction('rw', [db.employees, db.outbox], async () => {
    await db.employees.put(saved)
    await queueEmployeeSync(saved, id, now)
  })

  syncEmployeeToFirestore(buildEmployeeSyncPayload(saved, id)).catch((err: unknown) =>
    console.warn('[Firestore] employee sync failed (will retry):', err)
  )
}
