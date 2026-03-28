import { db } from '@/db'
import type { Customer, CreditLedgerEntry } from '@/types'
import { syncCustomerToFirestore } from '@/services/firebase/sync'
import { syncCreditLedgerEntryToFirestore } from '@/services/firebase/sync'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { toFiniteNumber } from '@/utils/numbers'
import { queueOutboxEntry } from './outbox'

function buildCustomerSyncPayload(customer: Customer, id: number) {
  return {
    id,
    name: customer.name,
    phone: customer.phone,
    currentBalance: customer.currentBalance,
    creditLimit: customer.creditLimit,
    loyaltyPoints: customer.loyaltyPoints,
    creditApproved: customer.creditApproved,
    creditRequested: customer.creditRequested,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  }
}

async function queueCustomerSync(customer: Customer, id: number, createdAt: Date): Promise<void> {
  const payload = buildCustomerSyncPayload(customer, id)
  await queueOutboxEntry({
    action: 'upsert_customer',
    entityType: 'customer',
    entityKey: String(id),
    payload: JSON.stringify({
      ...payload,
      createdAt: payload.createdAt.toISOString(),
      updatedAt: payload.updatedAt.toISOString(),
    }),
    createdAt,
  })
}

async function syncCustomerSnapshot(customerId: number, mutate: (customer: Customer, now: Date) => Customer): Promise<void> {
  const existing = await db.customers.get(customerId)
  if (!existing) throw new Error('Customer not found')
  const now = new Date()
  const nextCustomer = mutate(existing, now)

  await db.transaction('rw', [db.customers, db.outbox], async () => {
    await db.customers.put(nextCustomer)
    await queueCustomerSync(nextCustomer, customerId, now)
  })

  syncCustomerToFirestore(buildCustomerSyncPayload(nextCustomer, customerId)).catch((err: unknown) =>
    console.warn('[Firestore] customer sync failed (will retry):', err)
  )
}

export async function getPendingCreditRequestCount(): Promise<number> {
  return db.customers.filter((c) => c.creditRequested === true).count()
}

export async function getCustomerByPhone(phone: string): Promise<Customer | undefined> {
  return db.customers.where('phone').equals(phone).first()
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return db.customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)
    )
    .limit(10)
    .toArray()
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  return db.customers.get(id)
}

export async function getAllCustomers(): Promise<Customer[]> {
  return db.customers.toArray()
}

export async function updateCreditBalance(customerId: number, delta: number): Promise<void> {
  await db.customers
    .where('id')
    .equals(customerId)
    .modify((c) => {
      c.currentBalance = toFiniteNumber(c.currentBalance) + delta
      c.updatedAt = new Date()
    })
}

export async function getCreditHistory(customerId: number): Promise<CreditLedgerEntry[]> {
  const entries = await db.credit_ledger
    .where('customerId')
    .equals(customerId)
    .toArray()
  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function addCreditLedgerEntry(entry: Omit<CreditLedgerEntry, 'id'>): Promise<number> {
  const now = new Date()
  const ledgerEntry: CreditLedgerEntry = {
    ...entry,
    syncId: entry.syncId ?? createSyncId('credit'),
  }

  const id = await db.transaction('rw', [db.credit_ledger, db.outbox], async () => {
    const ledgerId = await db.credit_ledger.add(ledgerEntry)
    await queueOutboxEntry({
      action: 'upsert_credit_ledger',
      entityType: 'credit_ledger',
      entityKey: ledgerEntry.syncId,
      payload: JSON.stringify({
        ...ledgerEntry,
        createdAt: ledgerEntry.createdAt.toISOString(),
      }),
      createdAt: now,
    })
    return ledgerId
  })

  syncCreditLedgerEntryToFirestore(ledgerEntry).catch((err: unknown) =>
    console.warn('[Firestore] credit ledger sync failed (will retry):', err)
  )

  return id
}

export async function requestCreditLine(customerId: number): Promise<void> {
  await syncCustomerSnapshot(customerId, (customer, now) => ({
    ...customer,
    creditRequested: true,
    updatedAt: now,
  }))
}

export async function approveCreditLine(customerId: number, limit: number): Promise<void> {
  await syncCustomerSnapshot(customerId, (customer, now) => ({
    ...customer,
    creditApproved: true,
    creditRequested: false,
    creditLimit: limit,
    updatedAt: now,
  }))
}

export async function declineCreditRequest(customerId: number): Promise<void> {
  await syncCustomerSnapshot(customerId, (customer, now) => ({
    ...customer,
    creditRequested: false,
    updatedAt: now,
  }))
}

export async function revokeCreditLine(customerId: number): Promise<void> {
  await syncCustomerSnapshot(customerId, (customer, now) => ({
    ...customer,
    creditApproved: false,
    creditRequested: false,
    creditLimit: 0,
    updatedAt: now,
  }))
}

export async function upsertCustomer(
  customer: Omit<Customer, 'id'> & { id?: number }
): Promise<number> {
  const now = new Date()
  let id: number
  let saved: Customer
  if (customer.id) {
    saved = { ...customer, updatedAt: now }
    await db.transaction('rw', [db.customers, db.outbox], async () => {
      await db.customers.update(customer.id!, saved)
      await queueCustomerSync(saved, customer.id!, now)
    })
    id = customer.id
  } else {
    id = createEntityId()
    saved = { ...customer, id, createdAt: now, updatedAt: now }
    id = await db.transaction('rw', [db.customers, db.outbox], async () => {
      await db.customers.put(saved)
      await queueCustomerSync(saved, id, now)
      return id
    })
  }
  syncCustomerToFirestore(buildCustomerSyncPayload(saved, id)).catch((err: unknown) =>
    console.warn('[Firestore] customer sync failed (will retry):', err)
  )
  return id
}
