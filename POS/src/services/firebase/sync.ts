/**
 * Firestore sync service — fire-and-forget.
 * Pushes data to Firestore after local IndexedDB writes.
 * Never throws — a sync failure must never break the local POS flow.
 */
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { firestore } from '.'

function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date instanceof Date ? date : new Date(date))
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export interface SaleSyncPayload {
  saleId: number
  billNo: string
  cashierId: number
  cashierName?: string | null
  customerId?: number | null
  subtotal: number
  discount: number
  taxTotal: number
  grandTotal: number
  payments: Array<{ method: string; amount: number }>
  items: Array<{ productId: number; productName: string; qty: number; unitPrice: number; lineTotal: number }>
  createdAt: Date
}

// Throws on failure — callers must handle the error.
// Use .catch(console.warn) for fire-and-forget, or try/catch for retryable flush.
export async function syncSaleToFirestore(payload: SaleSyncPayload): Promise<void> {
  await setDoc(doc(firestore, 'sales', payload.billNo), {
    ...payload,
    createdAt: toTimestamp(payload.createdAt),
  })
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function syncProductToFirestore(product: {
  id: number
  name: string
  stock: number
  reorderLevel: number
  unit: string
  sellingPrice: number
  category?: string
}): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'products', String(product.id)),
      { ...product, updatedAt: Timestamp.now() },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Firestore] syncProduct failed (offline?):', err)
  }
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function syncCustomerToFirestore(customer: {
  id: number
  name: string
  phone?: string
  currentBalance: number
  creditLimit: number
}): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'customers', String(customer.id)),
      { ...customer, updatedAt: Timestamp.now() },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Firestore] syncCustomer failed (offline?):', err)
  }
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function syncEmployeeToFirestore(employee: {
  id: number
  name: string
  role: string
  pinHash?: string
  passwordHash?: string
  isActive: boolean
  createdAt: Date
}): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'employees', String(employee.id)),
      {
        ...employee,
        createdAt: toTimestamp(employee.createdAt),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Firestore] syncEmployee failed (offline?):', err)
  }
}

// ─── Batches ──────────────────────────────────────────────────────────────────

export async function syncBatchToFirestore(batch: {
  id: number
  productId: number
  batchNo: string
  mfgDate?: Date
  expiryDate: Date
  purchasePrice: number
  qtyRemaining: number
  createdAt: Date
}): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'batches', String(batch.id)),
      {
        ...batch,
        mfgDate: batch.mfgDate ? toTimestamp(batch.mfgDate) : null,
        expiryDate: toTimestamp(batch.expiryDate),
        createdAt: toTimestamp(batch.createdAt),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Firestore] syncBatch failed (offline?):', err)
  }
}

// ─── Day Sessions ─────────────────────────────────────────────────────────────

export async function syncSessionToFirestore(session: {
  id: number
  openedBy: number
  openingFloat: number
  closingCash?: number
  expectedCash?: number
  variance?: number
  status: string
  openedAt: Date
  closedAt?: Date
}): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'day_sessions', String(session.id)),
      {
        ...session,
        openedAt: toTimestamp(session.openedAt),
        closedAt: session.closedAt ? toTimestamp(session.closedAt) : null,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Firestore] syncSession failed (offline?):', err)
  }
}
