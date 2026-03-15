import { db } from '@/db'
import type { Customer, CreditLedgerEntry } from '@/types'
import { syncCustomerToFirestore } from '@/services/firebase/sync'

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
      c.currentBalance = c.currentBalance + delta
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
  return db.credit_ledger.add(entry)
}

export async function requestCreditLine(customerId: number): Promise<void> {
  await db.customers.where('id').equals(customerId).modify({ creditRequested: true, updatedAt: new Date() })
}

export async function approveCreditLine(customerId: number, limit: number): Promise<void> {
  await db.customers.where('id').equals(customerId).modify({ creditApproved: true, creditRequested: false, creditLimit: limit, updatedAt: new Date() })
}

export async function declineCreditRequest(customerId: number): Promise<void> {
  await db.customers.where('id').equals(customerId).modify({ creditRequested: false, updatedAt: new Date() })
}

export async function revokeCreditLine(customerId: number): Promise<void> {
  await db.customers.where('id').equals(customerId).modify({ creditApproved: false, creditRequested: false, creditLimit: 0, updatedAt: new Date() })
}

export async function upsertCustomer(
  customer: Omit<Customer, 'id'> & { id?: number }
): Promise<number> {
  let id: number
  if (customer.id) {
    await db.customers.update(customer.id, { ...customer, updatedAt: new Date() })
    id = customer.id
  } else {
    id = await db.customers.add({ ...customer, createdAt: new Date(), updatedAt: new Date() })
  }
  syncCustomerToFirestore({ id, name: customer.name, phone: customer.phone, currentBalance: customer.currentBalance, creditLimit: customer.creditLimit })
  return id
}
