import type { Customer, CreditLedgerEntry } from '@/types'
import { syncCustomerToFirestore, syncCreditLedgerEntryToFirestore } from '@/services/firebase/sync'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export async function getPendingCreditRequestCount(): Promise<number> {
  const customers = useFirestoreDataStore.getState().customers
  return customers.filter((c) => c.creditRequested === true).length
}

export async function getCustomerByPhone(phone: string): Promise<Customer | undefined> {
  const customers = useFirestoreDataStore.getState().customers
  return customers.find((c) => c.phone === phone)
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const customers = useFirestoreDataStore.getState().customers
  return customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)
    )
    .slice(0, 10)
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  const customers = useFirestoreDataStore.getState().customers
  return customers.find((c) => c.id === id)
}

export async function getAllCustomers(): Promise<Customer[]> {
  return useFirestoreDataStore.getState().customers
}

export async function updateCreditBalance(_customerId: number, _delta: number): Promise<void> {
  // No-op — credit balance is updated atomically in syncSaleToFirestore
  return Promise.resolve()
}

export async function getCreditHistory(customerId: number): Promise<CreditLedgerEntry[]> {
  const entries = useFirestoreDataStore.getState().creditLedger
  return entries
    .filter((e) => e.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function addCreditLedgerEntry(entry: Omit<CreditLedgerEntry, 'id'>): Promise<void> {
  const ledgerEntry: CreditLedgerEntry = {
    ...entry,
    syncId: entry.syncId ?? createSyncId('credit'),
  }
  await syncCreditLedgerEntryToFirestore(ledgerEntry)
}

export async function requestCreditLine(customerId: number): Promise<void> {
  const customer = await getCustomerById(customerId)
  if (!customer) throw new Error('Customer not found')
  const now = new Date()
  const updated: Customer = { ...customer, creditRequested: true, updatedAt: now }
  await syncCustomerToFirestore({ id: customerId, ...updated, createdAt: updated.createdAt, updatedAt: now })
}

export async function approveCreditLine(customerId: number, limit: number): Promise<void> {
  const customer = await getCustomerById(customerId)
  if (!customer) throw new Error('Customer not found')
  const now = new Date()
  const updated: Customer = {
    ...customer,
    creditApproved: true,
    creditRequested: false,
    creditLimit: limit,
    updatedAt: now,
  }
  await syncCustomerToFirestore({ id: customerId, ...updated, createdAt: updated.createdAt, updatedAt: now })
}

export async function declineCreditRequest(customerId: number): Promise<void> {
  const customer = await getCustomerById(customerId)
  if (!customer) throw new Error('Customer not found')
  const now = new Date()
  const updated: Customer = { ...customer, creditRequested: false, updatedAt: now }
  await syncCustomerToFirestore({ id: customerId, ...updated, createdAt: updated.createdAt, updatedAt: now })
}

export async function revokeCreditLine(customerId: number): Promise<void> {
  const customer = await getCustomerById(customerId)
  if (!customer) throw new Error('Customer not found')
  const now = new Date()
  const updated: Customer = {
    ...customer,
    creditApproved: false,
    creditRequested: false,
    creditLimit: 0,
    updatedAt: now,
  }
  await syncCustomerToFirestore({ id: customerId, ...updated, createdAt: updated.createdAt, updatedAt: now })
}

export async function upsertCustomer(
  customer: Omit<Customer, 'id'> & { id?: number }
): Promise<number> {
  const now = new Date()
  let id: number
  let saved: Customer

  if (customer.id) {
    id = customer.id
    saved = { ...customer, id, updatedAt: now }
  } else {
    id = createEntityId()
    saved = { ...customer, id, createdAt: now, updatedAt: now }
  }

  await syncCustomerToFirestore({
    id,
    name: saved.name,
    phone: saved.phone,
    currentBalance: saved.currentBalance,
    creditLimit: saved.creditLimit,
    loyaltyPoints: saved.loyaltyPoints,
    creditApproved: saved.creditApproved,
    creditRequested: saved.creditRequested,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  })

  return id
}
