import { collection, doc, onSnapshot, Timestamp } from 'firebase/firestore'
import { firestore } from '@/services/firebase'
import { db } from '@/db'
import { useSessionStore } from '@/stores/sessionStore'
import type { PaymentMethod } from '@/types'

function tsToDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val as string)
}

/**
 * Starts real-time Firestore listeners for products and customers.
 * When another device writes a stock or balance change, that change is pushed
 * here via onSnapshot and merged into local Dexie — no polling required.
 *
 * Design notes:
 * - includeMetadataChanges: false → only server-confirmed writes fire the callback
 * - docChanges() → processes only changed docs, not the full collection on every event
 * - db.update() not db.put() → merges fields; preserves Dexie-only fields (barcode, sku, hsn…)
 * - 'removed' changes ignored → deletions are handled by their own admin flows
 * - Self-echo safe: when THIS device writes to Firestore, the round-trip echo is a harmless no-op
 *
 * Must be called AFTER ensureAnonymousAuth() — onSnapshot subscriptions require
 * request.auth != null in Firestore rules.
 *
 * Returns a cleanup function that stops both listeners.
 */
export function startFirestoreListeners(): () => void {
  const unsubProducts = startProductListener()
  const unsubBatches = startBatchListener()
  const unsubCustomers = startCustomerListener()
  const unsubVendors = startVendorListener()
  const unsubGrns = startGrnListener()
  const unsubRtvs = startRtvListener()
  const unsubSales = startSalesListener()
  const unsubSaleReturns = startSaleReturnListener()
  const unsubCreditLedger = startCreditLedgerListener()
  const unsubCashEntries = startCashEntryListener()
  const unsubDaySessions = startDaySessionListener()
  const unsubEmployees = startEmployeeListener()
  const unsubExpenses = startExpenseListener()
  const unsubPerformanceTargets = startPerformanceTargetsListener()
  return () => {
    unsubProducts()
    unsubBatches()
    unsubCustomers()
    unsubVendors()
    unsubGrns()
    unsubRtvs()
    unsubSales()
    unsubSaleReturns()
    unsubCreditLedger()
    unsubCashEntries()
    unsubDaySessions()
    unsubEmployees()
    unsubExpenses()
    unsubPerformanceTargets()
  }
}

function startProductListener(): () => void {
  return onSnapshot(
    collection(firestore, 'products'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') continue
        const data = change.doc.data()
        const id = Number(change.doc.id)
        if (!id) continue

        db.products
          .get(id)
          .then((existing) =>
            db.products.put({
              ...(existing ?? {}),
              id,
              name: data.name ?? existing?.name ?? `Product #${id}`,
              ...(data.barcode !== undefined && { barcode: data.barcode }),
              ...(data.sku !== undefined && { sku: data.sku }),
              category: data.category ?? existing?.category ?? 'General',
              unit: data.unit ?? existing?.unit ?? 'pcs',
              soldByWeight: Boolean(data.soldByWeight ?? existing?.soldByWeight ?? false),
              sellingPrice: Number(data.sellingPrice ?? existing?.sellingPrice ?? 0),
              ...(data.costPrice !== undefined && { costPrice: Number(data.costPrice ?? 0) }),
              mrp: Number(data.mrp ?? existing?.mrp ?? 0),
              taxRate: Number(data.taxRate ?? existing?.taxRate ?? 0),
              hsnCode: data.hsnCode ?? existing?.hsnCode ?? '',
              stock: Number(data.stock ?? existing?.stock ?? 0),
              reorderLevel: Number(data.reorderLevel ?? existing?.reorderLevel ?? 0),
              ...(data.baseUnit !== undefined && { baseUnit: data.baseUnit }),
              ...(data.baseQty !== undefined && { baseQty: Number(data.baseQty ?? 0) }),
              ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
              createdAt: tsToDate(data.createdAt ?? existing?.createdAt ?? new Date()),
              updatedAt: tsToDate(data.updatedAt ?? new Date()),
            })
          )
          .catch((err: unknown) => console.warn('[Listener] product update failed:', err))
      }
    },
    (err) => console.warn('[Listener] products snapshot error:', err)
  )
}

function startCustomerListener(): () => void {
  return onSnapshot(
    collection(firestore, 'customers'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') continue
        const data = change.doc.data()
        const id = Number(change.doc.id)
        if (!id) continue

        db.customers
          .get(id)
          .then((existing) =>
            db.customers.put({
              ...(existing ?? {}),
              id,
              name: data.name ?? existing?.name ?? `Customer #${id}`,
              ...(data.phone !== undefined && { phone: data.phone }),
              currentBalance: Number(data.currentBalance ?? existing?.currentBalance ?? 0),
              creditLimit: Number(data.creditLimit ?? existing?.creditLimit ?? 0),
              loyaltyPoints: Number(data.loyaltyPoints ?? existing?.loyaltyPoints ?? 0),
              creditApproved: Boolean(data.creditApproved ?? existing?.creditApproved ?? false),
              creditRequested: Boolean(data.creditRequested ?? existing?.creditRequested ?? false),
              createdAt: tsToDate(data.createdAt ?? existing?.createdAt ?? new Date()),
              updatedAt: tsToDate(data.updatedAt ?? new Date()),
            })
          )
          .catch((err: unknown) => console.warn('[Listener] customer update failed:', err))
      }
    },
    (err) => console.warn('[Listener] customers snapshot error:', err)
  )
}

function startVendorListener(): () => void {
  return onSnapshot(
    collection(firestore, 'vendors'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const syncId = change.doc.id
        if (!syncId) continue

        if (change.type === 'removed') {
          db.vendors
            .where('syncId')
            .equals(syncId)
            .delete()
            .catch((err: unknown) => console.warn('[Listener] vendor delete failed:', err))
          continue
        }

        const data = change.doc.data()
        db.vendors
          .where('syncId')
          .equals(syncId)
          .first()
          .then((existing) =>
            db.vendors.put({
              ...(existing ?? {}),
              ...(data.id !== undefined ? { id: Number(data.id) } : {}),
              syncId,
              name: String(data.name ?? existing?.name ?? 'Vendor'),
              ...(data.phone !== undefined && { phone: String(data.phone) }),
              ...(data.gstin !== undefined && { gstin: String(data.gstin) }),
              ...(data.address !== undefined && { address: String(data.address) }),
              isActive: Boolean(data.isActive ?? existing?.isActive ?? true),
              createdAt: tsToDate(data.createdAt ?? existing?.createdAt ?? new Date()),
              updatedAt: tsToDate(data.updatedAt ?? new Date()),
            })
          )
          .catch((err: unknown) => console.warn('[Listener] vendor upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] vendors snapshot error:', err)
  )
}

function startBatchListener(): () => void {
  return onSnapshot(
    collection(firestore, 'batches'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const id = Number(change.doc.id)
        if (!id) continue

        if (change.type === 'removed') {
          db.batches.delete(id).catch((err: unknown) => console.warn('[Listener] batch delete failed:', err))
          continue
        }

        const data = change.doc.data()
        db.batches
          .put({
            id,
            productId: data.productId,
            batchNo: data.batchNo,
            ...(data.mfgDate ? { mfgDate: tsToDate(data.mfgDate) } : {}),
            expiryDate: tsToDate(data.expiryDate),
            purchasePrice: data.purchasePrice,
            qtyRemaining: data.qtyRemaining,
            createdAt: tsToDate(data.createdAt ?? new Date()),
            ...(data.vendor !== undefined && { vendor: data.vendor }),
            ...(data.invoiceNo !== undefined && { invoiceNo: data.invoiceNo }),
            ...(data.grnId !== undefined && { grnId: data.grnId }),
          })
          .catch((err: unknown) => console.warn('[Listener] batch upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] batches snapshot error:', err)
  )
}

function startGrnListener(): () => void {
  return onSnapshot(
    collection(firestore, 'grns'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const syncId = change.doc.id
        if (!syncId) continue

        if (change.type === 'removed') {
          db.grns
            .where('syncId')
            .equals(syncId)
            .delete()
            .catch((err: unknown) => console.warn('[Listener] grn delete failed:', err))
          continue
        }

        const data = change.doc.data()
        db.grns
          .where('syncId')
          .equals(syncId)
          .first()
          .then((existing) =>
            db.grns.put({
              ...(existing ?? {}),
              ...(data.id !== undefined ? { id: Number(data.id) } : {}),
              syncId,
              ...(data.vendorName !== undefined && { vendorName: String(data.vendorName) }),
              ...(data.invoiceNo !== undefined && { invoiceNo: String(data.invoiceNo) }),
              createdBy: Number(data.createdBy ?? existing?.createdBy ?? 0),
              totalValue: Number(data.totalValue ?? existing?.totalValue ?? 0),
              lineCount: Number(data.lineCount ?? existing?.lineCount ?? 0),
              createdAt: tsToDate(data.createdAt ?? existing?.createdAt ?? new Date()),
            })
          )
          .catch((err: unknown) => console.warn('[Listener] grn upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] grns snapshot error:', err)
  )
}

function startRtvListener(): () => void {
  return onSnapshot(
    collection(firestore, 'rtvs'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const syncId = change.doc.id
        if (!syncId) continue

        if (change.type === 'removed') {
          db.rtvs
            .where('syncId')
            .equals(syncId)
            .first()
            .then(async (existing) => {
              if (!existing?.id) return
              await db.transaction('rw', [db.rtvs, db.rtv_items], async () => {
                await db.rtv_items.where('rtvId').equals(existing.id!).delete()
                await db.rtvs.delete(existing.id!)
              })
            })
            .catch((err: unknown) => console.warn('[Listener] rtv delete failed:', err))
          continue
        }

        const data = change.doc.data()
        void db
          .transaction('rw', [db.rtvs, db.rtv_items], async () => {
            const existing = await db.rtvs.where('syncId').equals(syncId).first()
            const rtvPayload = {
              ...(data.id !== undefined ? { id: Number(data.id) } : {}),
              syncId,
              ...(data.vendorName !== undefined && { vendorName: String(data.vendorName) }),
              ...(data.invoiceNo !== undefined && { invoiceNo: String(data.invoiceNo) }),
              reason: String(data.reason ?? existing?.reason ?? ''),
              createdBy: Number(data.createdBy ?? existing?.createdBy ?? 0),
              totalValue: Number(data.totalValue ?? existing?.totalValue ?? 0),
              lineCount: Number(data.lineCount ?? existing?.lineCount ?? 0),
              createdAt: tsToDate(data.createdAt ?? existing?.createdAt ?? new Date()),
            }

            const rtvId = existing?.id
              ? (await db.rtvs.update(existing.id, rtvPayload), existing.id)
              : await db.rtvs.add(rtvPayload)

            await db.rtv_items.where('rtvId').equals(rtvId).delete()

            if (Array.isArray(data.items) && data.items.length > 0) {
              await db.rtv_items.bulkAdd(
                data.items.map((item: Record<string, unknown>) => ({
                  rtvId,
                  productId: Number(item.productId ?? 0),
                  batchId: Number(item.batchId ?? 0),
                  batchNo: String(item.batchNo ?? ''),
                  qty: Number(item.qty ?? 0),
                  purchasePrice: Number(item.purchasePrice ?? 0),
                }))
              )
            }
          })
          .catch((err: unknown) => console.warn('[Listener] rtv upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] rtvs snapshot error:', err)
  )
}

function startSalesListener(): () => void {
  return onSnapshot(
    collection(firestore, 'sales'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const data = change.doc.data()
        const billNo = (data.billNo as string | undefined) ?? change.doc.id
        if (!billNo) continue

        if (change.type === 'removed') {
          db.sales
            .where('billNo')
            .equals(billNo)
            .first()
            .then(async (existing) => {
              if (!existing?.id) return
              await db.transaction('rw', [db.sales, db.sale_items, db.payments], async () => {
                await db.sale_items.where('saleId').equals(existing.id!).delete()
                await db.payments.where('saleId').equals(existing.id!).delete()
                await db.sales.delete(existing.id!)
              })
            })
            .catch((err: unknown) => console.warn('[Listener] sale delete failed:', err))
          continue
        }

        void db
          .transaction('rw', [db.sales, db.sale_items, db.payments], async () => {
            const existing = await db.sales.where('billNo').equals(billNo).first()
            const salePayload = {
              billNo,
              ...(data.customerId !== undefined && { customerId: data.customerId ?? undefined }),
              cashierId: Number(data.cashierId ?? 0),
              subtotal: Number(data.subtotal ?? 0),
              discount: Number(data.discount ?? 0),
              taxTotal: Number(data.taxTotal ?? 0),
              grandTotal: Number(data.grandTotal ?? 0),
              cogsTotal: Number(data.cogsTotal ?? 0),
              grossProfitTotal: Number(data.grossProfitTotal ?? 0),
              profitEstimated: Boolean(data.profitEstimated ?? false),
              returnTotal: Number(data.returnTotal ?? 0),
              ...(data.lastReturnAt ? { lastReturnAt: tsToDate(data.lastReturnAt) } : {}),
              status: 'completed' as const,
              createdAt: tsToDate(data.createdAt ?? new Date()),
            }

            const saleId = existing?.id
              ? (await db.sales.update(existing.id, salePayload), existing.id)
              : await db.sales.add(salePayload)

            await db.sale_items.where('saleId').equals(saleId).delete()
            await db.payments.where('saleId').equals(saleId).delete()

            if (Array.isArray(data.items) && data.items.length > 0) {
              await db.sale_items.bulkAdd(
                data.items.map((item: Record<string, unknown>) => ({
                  saleId,
                  productId: Number(item.productId ?? 0),
                  ...(item.batchId !== undefined && { batchId: Number(item.batchId ?? 0) }),
                  qty: Number(item.qty ?? 0),
                  unitPrice: Number(item.unitPrice ?? 0),
                  discount: Number(item.discount ?? 0),
                  taxRate: Number(item.taxRate ?? 0),
                  lineTotal: Number(item.lineTotal ?? 0),
                }))
              )
            }

            if (Array.isArray(data.payments) && data.payments.length > 0) {
              await db.payments.bulkAdd(
                data.payments.map((payment: Record<string, unknown>) => ({
                  saleId,
                  method: String(payment.method ?? 'cash') as PaymentMethod,
                  amount: Number(payment.amount ?? 0),
                  ...(payment.referenceNo !== undefined && { referenceNo: String(payment.referenceNo) }),
                  createdAt: tsToDate(data.createdAt ?? new Date()),
                }))
              )
            }
          })
          .catch((err: unknown) => console.warn('[Listener] sale upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] sales snapshot error:', err)
  )
}

function startSaleReturnListener(): () => void {
  return onSnapshot(
    collection(firestore, 'sale_returns'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const syncId = change.doc.id
        if (!syncId) continue

        if (change.type === 'removed') {
          db.sale_returns
            .where('syncId')
            .equals(syncId)
            .delete()
            .catch((err: unknown) => console.warn('[Listener] sale return delete failed:', err))
          continue
        }

        const data = change.doc.data()
        const returnPatch = {
          syncId,
          saleId: Number(data.saleId ?? 0),
          billNo: String(data.billNo ?? ''),
          ...(data.customerId !== undefined && data.customerId !== null
            ? { customerId: Number(data.customerId) }
            : {}),
          totalRefund: Number(data.totalRefund ?? 0),
          reason: String(data.reason ?? ''),
          userId: Number(data.userId ?? 0),
          ...(data.creditLedgerSyncId ? { creditLedgerSyncId: String(data.creditLedgerSyncId) } : {}),
          items: Array.isArray(data.items)
            ? data.items.map((item: Record<string, unknown>) => ({
                saleItemId: Number(item.saleItemId ?? 0),
                productId: Number(item.productId ?? 0),
                ...(item.batchId !== undefined && item.batchId !== null ? { batchId: Number(item.batchId) } : {}),
                qty: Number(item.qty ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                lineTotal: Number(item.lineTotal ?? 0),
              }))
            : [],
          createdAt: tsToDate(data.createdAt ?? new Date()),
        }

        db.sale_returns
          .where('syncId')
          .equals(syncId)
          .first()
          .then((existing) => {
            if (existing?.id) return db.sale_returns.update(existing.id, returnPatch)
            return db.sale_returns.add(returnPatch)
          })
          .catch((err: unknown) => console.warn('[Listener] sale return upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] sale returns snapshot error:', err)
  )
}

function startCreditLedgerListener(): () => void {
  return onSnapshot(
    collection(firestore, 'credit_ledger'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const syncId = change.doc.id
        if (!syncId) continue

        if (change.type === 'removed') {
          db.credit_ledger
            .where('syncId')
            .equals(syncId)
            .delete()
            .catch((err: unknown) => console.warn('[Listener] credit ledger delete failed:', err))
          continue
        }

        const data = change.doc.data()
        const ledgerPatch = {
          syncId,
          customerId: Number(data.customerId ?? 0),
          ...(data.saleId !== undefined && { saleId: Number(data.saleId ?? 0) }),
          entryType: data.entryType,
          amount: Number(data.amount ?? 0),
          ...(data.notes !== undefined && { notes: data.notes }),
          createdAt: tsToDate(data.createdAt ?? new Date()),
        }

        db.credit_ledger
          .where('syncId')
          .equals(syncId)
          .first()
          .then((existing) => {
            if (existing?.id) return db.credit_ledger.update(existing.id, ledgerPatch)
            return db.credit_ledger.add(ledgerPatch)
          })
          .catch((err: unknown) => console.warn('[Listener] credit ledger upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] credit ledger snapshot error:', err)
  )
}

function startCashEntryListener(): () => void {
  return onSnapshot(
    collection(firestore, 'cash_entries'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const syncId = change.doc.id
        if (!syncId) continue

        if (change.type === 'removed') {
          db.cash_entries
            .where('syncId')
            .equals(syncId)
            .delete()
            .catch((err: unknown) => console.warn('[Listener] cash entry delete failed:', err))
          continue
        }

        const data = change.doc.data()
        const cashEntryPatch = {
          syncId,
          ...(data.sessionId !== undefined && { sessionId: data.sessionId }),
          amount: Number(data.amount ?? 0),
          category: data.category,
          ...(data.note !== undefined && { note: data.note }),
          authorizedBy: Number(data.authorizedBy ?? 0),
          createdAt: tsToDate(data.createdAt ?? new Date()),
        }

        db.cash_entries
          .where('syncId')
          .equals(syncId)
          .first()
          .then((existing) => {
            if (existing?.id) return db.cash_entries.update(existing.id, cashEntryPatch)
            return db.cash_entries.add(cashEntryPatch)
          })
          .catch((err: unknown) => console.warn('[Listener] cash entry upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] cash entries snapshot error:', err)
  )
}

function startDaySessionListener(): () => void {
  return onSnapshot(
    collection(firestore, 'day_sessions'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const syncId = change.doc.id
        if (!syncId) continue

        if (change.type === 'removed') {
          db.day_sessions
            .where('syncId')
            .equals(syncId)
            .delete()
            .then(updateCurrentSessionStore)
            .catch((err: unknown) => console.warn('[Listener] day session delete failed:', err))
          continue
        }

        const data = change.doc.data()
        const sessionPatch = {
          syncId,
          ...(data.id !== undefined && { id: Number(data.id) }),
          openedBy: Number(data.openedBy ?? 0),
          openingFloat: Number(data.openingFloat ?? 0),
          ...(data.closedBy !== undefined && { closedBy: Number(data.closedBy ?? 0) }),
          ...(data.closingCash !== undefined && { closingCash: Number(data.closingCash ?? 0) }),
          ...(data.expectedCash !== undefined && { expectedCash: Number(data.expectedCash ?? 0) }),
          ...(data.variance !== undefined && { variance: Number(data.variance ?? 0) }),
          ...(data.varianceNote !== undefined && { varianceNote: data.varianceNote }),
          status: data.status,
          openedAt: tsToDate(data.openedAt ?? new Date()),
          ...(data.closedAt ? { closedAt: tsToDate(data.closedAt) } : {}),
        }

        db.day_sessions
          .where('syncId')
          .equals(syncId)
          .first()
          .then(async (existing) => {
            if (existing?.id) await db.day_sessions.update(existing.id, sessionPatch)
            else await db.day_sessions.add(sessionPatch)
            await updateCurrentSessionStore()
          })
          .catch((err: unknown) => console.warn('[Listener] day session upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] day sessions snapshot error:', err)
  )
}

function startEmployeeListener(): () => void {
  return onSnapshot(
    collection(firestore, 'employees'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const id = Number(change.doc.id)
        if (!id) continue

        if (change.type === 'removed') {
          db.employees.delete(id).catch((err: unknown) => console.warn('[Listener] employee delete failed:', err))
          continue
        }

        const data = change.doc.data()
        db.employees
          .put({
            id,
            name: data.name,
            role: data.role,
            ...(data.pinHash !== undefined && { pinHash: data.pinHash }),
            ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
            isActive: Boolean(data.isActive),
            createdAt: tsToDate(data.createdAt ?? new Date()),
            ...(data.monthlyLeaveAllotment !== undefined && {
              monthlyLeaveAllotment: Number(data.monthlyLeaveAllotment ?? 3),
            }),
          })
          .catch((err: unknown) => console.warn('[Listener] employee upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] employees snapshot error:', err)
  )
}

function startExpenseListener(): () => void {
  return onSnapshot(
    collection(firestore, 'expenses'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const syncId = change.doc.id
        if (!syncId) continue

        if (change.type === 'removed') {
          db.expenses
            .where('syncId')
            .equals(syncId)
            .delete()
            .catch((err: unknown) => console.warn('[Listener] expense delete failed:', err))
          continue
        }

        const data = change.doc.data()
        const expensePatch = {
          syncId,
          category: data.category,
          amount: data.amount,
          ...(data.note !== undefined && { note: data.note }),
          date: tsToDate(data.date ?? data.createdAt ?? new Date()),
          createdAt: tsToDate(data.createdAt ?? data.date ?? new Date()),
          updatedAt: tsToDate(data.updatedAt ?? data.createdAt ?? data.date ?? new Date()),
        }

        db.expenses
          .where('syncId')
          .equals(syncId)
          .first()
          .then((existing) => {
            if (existing?.id) {
              return db.expenses.update(existing.id, expensePatch)
            }
            return db.expenses.add(expensePatch)
          })
          .catch((err: unknown) => console.warn('[Listener] expense upsert failed:', err))
      }
    },
    (err) => console.warn('[Listener] expenses snapshot error:', err)
  )
}

function startPerformanceTargetsListener(): () => void {
  return onSnapshot(
    doc(firestore, 'app_settings', 'performance_targets'),
    { includeMetadataChanges: false },
    (snapshot) => {
      if (!snapshot.exists()) return
      const data = snapshot.data()

      db.performance_targets
        .put({
          key: 'performance_targets',
          monthlySalesTarget: data.monthlySalesTarget ?? 0,
          monthlyBreakEvenTarget: data.monthlyBreakEvenTarget ?? 0,
          updatedAt: tsToDate(data.updatedAt ?? new Date()),
          ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
        })
        .catch((err: unknown) => console.warn('[Listener] performance targets update failed:', err))
    },
    (err) => console.warn('[Listener] performance targets snapshot error:', err)
  )
}

async function updateCurrentSessionStore() {
  const openSession = await db.day_sessions.where('status').equals('open').first()
  useSessionStore.getState().setCurrentSession(openSession ?? null)
}
