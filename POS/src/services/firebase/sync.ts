/**
 * Firestore sync service — fire-and-forget.
 * Pushes data to Firestore after local IndexedDB writes.
 * Never throws — a sync failure must never break the local POS flow.
 */
import { deleteDoc, doc, increment, runTransaction, setDoc, Timestamp } from 'firebase/firestore'
import { firestore } from '.'
import type {
  BatchAllocation,
  CashEntry,
  CreditLedgerEntry,
  SaleReturn,
  Vendor,
  Grn,
  Batch,
  RtvSession,
  RtvItem,
  StoreConfig,
  ExternalStaff,
  AttendanceLog,
  LeaveRequest,
  Employee,
} from '@/types'
import { toFiniteNumber } from '@/utils/numbers'

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
  cogsTotal?: number
  grossProfitTotal?: number
  profitEstimated?: boolean
  returnTotal?: number
  creditLedgerSyncId?: string
  payments: Array<{ method: string; amount: number; referenceNo?: string }>
  items: Array<{
    lineId: string
    productId: number
    productName: string
    batchId?: number
    batchAllocations?: BatchAllocation[]
    qty: number
    unitPrice: number
    discount: number
    taxRate: number
    lineTotal: number
  }>
  stockDeltas: Array<{
    productId: number
    qty: number
    batchAllocations: Array<{ batchId: number; qty: number }>
  }>
  loyaltyPointsDelta?: number
  createdAt: Date
}

// Throws on failure — callers must handle the error.
// Use .catch(console.warn) for fire-and-forget, or try/catch for retryable flush.
export async function syncSaleToFirestore(payload: SaleSyncPayload): Promise<void> {
  const saleRef = doc(firestore, 'sales', payload.billNo)

  await runTransaction(firestore, async (txn) => {
    const saleSnapshot = await txn.get(saleRef)
    if (saleSnapshot.exists()) return

    txn.set(saleRef, {
      ...payload,
      returnTotal: payload.returnTotal ?? 0,
      createdAt: toTimestamp(payload.createdAt),
      syncedAt: Timestamp.now(),
    })

    for (const stockDelta of payload.stockDeltas) {
      txn.set(
        doc(firestore, 'products', String(stockDelta.productId)),
        {
          stock: increment(-stockDelta.qty),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )

      for (const allocation of stockDelta.batchAllocations) {
        const batchRef = doc(firestore, 'batches', String(allocation.batchId))
        const batchSnapshot = await txn.get(batchRef)
        const currentQty = toFiniteNumber(batchSnapshot.data()?.qtyRemaining)

        txn.set(
          batchRef,
          {
            qtyRemaining: Math.max(0, currentQty - allocation.qty),
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        )
      }
    }

    if (payload.customerId && payload.creditLedgerSyncId && payload.payments.some((payment) => payment.method === 'credit')) {
      const creditAmount = payload.payments
        .filter((payment) => payment.method === 'credit')
        .reduce((sum, payment) => sum + payment.amount, 0)

      txn.set(
        doc(firestore, 'credit_ledger', payload.creditLedgerSyncId),
        {
          syncId: payload.creditLedgerSyncId,
          customerId: payload.customerId,
          saleId: payload.saleId,
          entryType: 'debit',
          amount: creditAmount,
          notes: `Bill ${payload.billNo}`,
          createdAt: toTimestamp(payload.createdAt),
        },
        { merge: true }
      )

      txn.set(
        doc(firestore, 'customers', String(payload.customerId)),
        {
          currentBalance: increment(creditAmount),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )
    }

    if (payload.customerId && payload.loyaltyPointsDelta && payload.loyaltyPointsDelta > 0) {
      txn.set(
        doc(firestore, 'customers', String(payload.customerId)),
        { loyaltyPoints: increment(payload.loyaltyPointsDelta), updatedAt: Timestamp.now() },
        { merge: true }
      )
    }
  })
}

// ─── Returns ────────────────────────────────────────────────────────────────

export interface ReturnSyncPayload {
  syncId: string
  saleId: number
  billNo: string
  customerId?: number
  totalRefund: number
  reason: string
  userId: number
  creditLedgerSyncId?: string
  items: SaleReturn['items']
  createdAt: Date
}

export async function syncReturnToFirestore(payload: ReturnSyncPayload): Promise<void> {
  const returnRef = doc(firestore, 'sale_returns', payload.syncId)
  const saleRef = doc(firestore, 'sales', payload.billNo)

  await runTransaction(firestore, async (txn) => {
    const [returnSnapshot, saleSnapshot] = await Promise.all([txn.get(returnRef), txn.get(saleRef)])

    if (returnSnapshot.exists()) return
    if (!saleSnapshot.exists()) {
      throw new Error(`Sale ${payload.billNo} is not synced yet; return will retry`)
    }

    txn.set(returnRef, {
      ...payload,
      createdAt: toTimestamp(payload.createdAt),
      syncedAt: Timestamp.now(),
    })

    const currentReturnTotal = toFiniteNumber(saleSnapshot.data()?.returnTotal)
    txn.set(
      saleRef,
      {
        returnTotal: currentReturnTotal + payload.totalRefund,
        lastReturnAt: toTimestamp(payload.createdAt),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )

    for (const item of payload.items) {
      txn.set(
        doc(firestore, 'products', String(item.productId)),
        {
          stock: increment(item.qty),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )

      if (Array.isArray(item.batchAllocations) && item.batchAllocations.length > 0) {
        for (const allocation of item.batchAllocations) {
          txn.set(
            doc(firestore, 'batches', String(allocation.batchId)),
            {
              qtyRemaining: increment(allocation.qty),
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          )
        }
      } else if (item.batchId) {
        txn.set(
          doc(firestore, 'batches', String(item.batchId)),
          {
            qtyRemaining: increment(item.qty),
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        )
      }
    }

    if (payload.customerId && payload.creditLedgerSyncId) {
      const customerRef = doc(firestore, 'customers', String(payload.customerId))
      const customerSnapshot = await txn.get(customerRef)
      const currentBalance = toFiniteNumber(customerSnapshot.data()?.currentBalance)

      txn.set(
        doc(firestore, 'credit_ledger', payload.creditLedgerSyncId),
        {
          syncId: payload.creditLedgerSyncId,
          customerId: payload.customerId,
          saleId: payload.saleId,
          entryType: 'credit',
          amount: payload.totalRefund,
          notes: `Return from ${payload.billNo}: ${payload.reason}`,
          createdAt: toTimestamp(payload.createdAt),
        },
        { merge: true }
      )

      txn.set(
        customerRef,
        {
          currentBalance: Math.max(0, currentBalance - payload.totalRefund),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )
    }
  })
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface ExpenseSyncPayload {
  syncId: string
  category: string
  amount: number
  note?: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export async function syncExpenseToFirestore(payload: ExpenseSyncPayload): Promise<void> {
  await setDoc(
    doc(firestore, 'expenses', payload.syncId),
    {
      ...payload,
      date: toTimestamp(payload.date),
      createdAt: toTimestamp(payload.createdAt),
      updatedAt: toTimestamp(payload.updatedAt),
    },
    { merge: true }
  )
}

export async function deleteExpenseFromFirestore(syncId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'expenses', syncId))
}

// ─── Credit Ledger ───────────────────────────────────────────────────────────

export async function syncCreditLedgerEntryToFirestore(entry: CreditLedgerEntry): Promise<void> {
  const syncId = entry.syncId ?? `credit-${entry.customerId}-${entry.createdAt.getTime()}`
  const creditLedgerRef = doc(firestore, 'credit_ledger', syncId)
  const balanceDelta = entry.entryType === 'debit' ? entry.amount : -entry.amount

  await runTransaction(firestore, async (txn) => {
    const ledgerSnapshot = await txn.get(creditLedgerRef)
    if (ledgerSnapshot.exists()) return

    txn.set(creditLedgerRef, {
      ...entry,
      syncId,
      createdAt: toTimestamp(entry.createdAt),
    })

    txn.set(
      doc(firestore, 'customers', String(entry.customerId)),
      {
        currentBalance: increment(balanceDelta),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )
  })
}

// ─── Performance Targets ─────────────────────────────────────────────────────

export interface PerformanceTargetsSyncPayload {
  monthlySalesTarget: number
  monthlyBreakEvenTarget: number
  updatedAt: Date
  updatedBy?: number
}

export async function syncPerformanceTargetsToFirestore(
  payload: PerformanceTargetsSyncPayload
): Promise<void> {
  await setDoc(
    doc(firestore, 'app_settings', 'performance_targets'),
    {
      ...payload,
      updatedAt: toTimestamp(payload.updatedAt),
    },
    { merge: true }
  )
}

// ─── Store Settings ─────────────────────────────────────────────────────────

export interface StoreSettingsSyncPayload {
  config: StoreConfig
  updatedAt: Date
  updatedBy?: number
}

export async function syncStoreSettingsToFirestore(
  payload: StoreSettingsSyncPayload
): Promise<void> {
  await setDoc(
    doc(firestore, 'app_settings', 'store_details'),
    {
      config: payload.config,
      updatedAt: toTimestamp(payload.updatedAt),
      ...(payload.updatedBy !== undefined ? { updatedBy: payload.updatedBy } : {}),
    },
    { merge: true }
  )
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function syncProductToFirestore(product: {
  id: number
  name: string
  barcode?: string
  sku?: string
  stock: number
  reorderLevel: number
  unit: string
  soldByWeight?: boolean
  sellingPrice: number
  costPrice?: number
  mrp?: number
  taxRate?: number
  hsnCode?: string
  category?: string
  baseUnit?: string
  baseQty?: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'products', String(product.id)),
      {
        ...product,
        ...(product.createdAt ? { createdAt: toTimestamp(product.createdAt) } : {}),
        updatedAt: product.updatedAt ? toTimestamp(product.updatedAt) : Timestamp.now(),
      },
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
  loyaltyPoints?: number
  creditApproved?: boolean
  creditRequested?: boolean
  createdAt?: Date
  updatedAt?: Date
}): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'customers', String(customer.id)),
      {
        ...customer,
        ...(customer.createdAt ? { createdAt: toTimestamp(customer.createdAt) } : {}),
        updatedAt: customer.updatedAt ? toTimestamp(customer.updatedAt) : Timestamp.now(),
      },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Firestore] syncCustomer failed (offline?):', err)
  }
}

// ─── Vendors ────────────────────────────────────────────────────────────────

export async function syncVendorToFirestore(vendor: Vendor & { id: number; syncId: string }): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'vendors', vendor.syncId),
      {
        ...vendor,
        createdAt: toTimestamp(vendor.createdAt),
        updatedAt: toTimestamp(vendor.updatedAt),
      },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Firestore] syncVendor failed (offline?):', err)
  }
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function syncEmployeeToFirestore(employee: Employee & { id: number }): Promise<void> {
  try {
    await setDoc(
      doc(firestore, 'employees', String(employee.id)),
      {
        ...employee,
        createdAt: toTimestamp(employee.createdAt),
        ...(employee.updatedAt ? { updatedAt: toTimestamp(employee.updatedAt) } : { updatedAt: Timestamp.now() }),
      },
      { merge: true }
    )
  } catch (err) {
    console.warn('[Firestore] syncEmployee failed (offline?):', err)
  }
}

// ─── External Staff / Attendance / Leave ───────────────────────────────────

export async function syncExternalStaffToFirestore(
  staff: ExternalStaff & { id: number; syncId: string }
): Promise<void> {
  await setDoc(
    doc(firestore, 'staff_external', staff.syncId),
    {
      ...staff,
      createdAt: toTimestamp(staff.createdAt),
      ...(staff.updatedAt ? { updatedAt: toTimestamp(staff.updatedAt) } : { updatedAt: Timestamp.now() }),
    },
    { merge: true }
  )
}

export async function syncAttendanceLogToFirestore(
  log: AttendanceLog & { syncId: string }
): Promise<void> {
  await setDoc(
    doc(firestore, 'attendance_logs', log.syncId),
    {
      ...log,
      ...(log.checkIn ? { checkIn: toTimestamp(log.checkIn) } : { checkIn: null }),
      ...(log.checkOut ? { checkOut: toTimestamp(log.checkOut) } : { checkOut: null }),
      createdAt: toTimestamp(log.createdAt),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )
}

export async function syncLeaveRequestToFirestore(
  request: LeaveRequest & { syncId: string }
): Promise<void> {
  await setDoc(
    doc(firestore, 'leave_requests', request.syncId),
    {
      ...request,
      createdAt: toTimestamp(request.createdAt),
      ...(request.approvedAt ? { approvedAt: toTimestamp(request.approvedAt) } : { approvedAt: null }),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )
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

// ─── GRNs / Stock Receipt ───────────────────────────────────────────────────

export interface GrnSyncPayload {
  grn: Grn & { id: number; syncId: string }
  batches: Array<Batch & { id: number }>
  productStockDeltas: Array<{ productId: number; qty: number }>
}

export async function syncGrnToFirestore(payload: GrnSyncPayload): Promise<void> {
  const grnRef = doc(firestore, 'grns', payload.grn.syncId)

  await runTransaction(firestore, async (txn) => {
    const grnSnapshot = await txn.get(grnRef)
    if (grnSnapshot.exists()) return

    txn.set(grnRef, {
      ...payload.grn,
      createdAt: toTimestamp(payload.grn.createdAt),
      syncedAt: Timestamp.now(),
    })

    for (const batch of payload.batches) {
      txn.set(
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
    }

    for (const stockDelta of payload.productStockDeltas) {
      txn.set(
        doc(firestore, 'products', String(stockDelta.productId)),
        {
          stock: increment(stockDelta.qty),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )
    }
  })
}

// ─── RTVs ───────────────────────────────────────────────────────────────────

export interface RtvSyncPayload {
  rtv: RtvSession & { id: number; syncId: string }
  items: Array<RtvItem>
}

export async function syncRtvToFirestore(payload: RtvSyncPayload): Promise<void> {
  const rtvRef = doc(firestore, 'rtvs', payload.rtv.syncId)

  await runTransaction(firestore, async (txn) => {
    const rtvSnapshot = await txn.get(rtvRef)
    if (rtvSnapshot.exists()) return

    txn.set(rtvRef, {
      ...payload.rtv,
      items: payload.items,
      createdAt: toTimestamp(payload.rtv.createdAt),
      syncedAt: Timestamp.now(),
    })

    for (const item of payload.items) {
      txn.set(
        doc(firestore, 'products', String(item.productId)),
        {
          stock: increment(-item.qty),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )

      const batchRef = doc(firestore, 'batches', String(item.batchId))
      const batchSnapshot = await txn.get(batchRef)
      const currentQty = toFiniteNumber(batchSnapshot.data()?.qtyRemaining)

      txn.set(
        batchRef,
        {
          qtyRemaining: Math.max(0, currentQty - item.qty),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )
    }
  })
}

// ─── Day Sessions ─────────────────────────────────────────────────────────────

export async function syncSessionToFirestore(session: {
  id?: number
  syncId?: string
  openedBy: number
  openingFloat: number
  closingCash?: number
  expectedCash?: number
  variance?: number
  varianceNote?: string
  status: string
  openedAt: Date
  closedAt?: Date
}): Promise<void> {
  const syncId = session.syncId ?? `session-${session.id ?? Date.now()}`
  try {
    await setDoc(
      doc(firestore, 'day_sessions', syncId),
      {
        ...session,
        syncId,
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

// ─── Cash Entries ────────────────────────────────────────────────────────────

export async function syncCashEntryToFirestore(entry: CashEntry): Promise<void> {
  const syncId = entry.syncId ?? `cash-${entry.createdAt.getTime()}`

  await setDoc(
    doc(firestore, 'cash_entries', syncId),
    {
      ...entry,
      syncId,
      createdAt: toTimestamp(entry.createdAt),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )
}
