import { db } from '@/db'
import type { Employee } from '@/types'
import { syncEmployeeToFirestore } from '@/services/firebase/sync'
import { queueOutboxEntry } from './outbox'
import { createEntityId } from '@/utils/syncIds'

function buildEmployeeSyncPayload(employee: Employee, id: number) {
  return {
    id,
    name: employee.name,
    role: employee.role,
    pinHash: employee.pinHash,
    isActive: employee.isActive,
    monthlyLeaveAllotment: employee.monthlyLeaveAllotment ?? 3,
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

export async function getAllEmployees(): Promise<Employee[]> {
  return db.employees.toArray()
}

export async function upsertEmployee(employee: Employee): Promise<number> {
  const now = new Date()
  let id = employee.id ?? createEntityId()
  const saved: Employee = employee.id
    ? { ...employee, updatedAt: now }
    : { ...employee, id, createdAt: employee.createdAt ?? now, updatedAt: now }

  await db.transaction('rw', [db.employees, db.outbox], async () => {
    await db.employees.put(saved)
    await queueEmployeeSync(saved, id, now)
  })

  syncEmployeeToFirestore(buildEmployeeSyncPayload(saved, id)).catch((err: unknown) =>
    console.warn('[Firestore] employee sync failed (will retry):', err)
  )

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
