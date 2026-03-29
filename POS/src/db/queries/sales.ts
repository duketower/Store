import { db } from '@/db'
import type { Sale, SaleItem, Payment, CartItem, SaleReturn } from '@/types'
import { deductStockFEFO } from './batches'
import { updateStock } from './products'
import { updateCreditBalance, addCreditLedgerEntry } from './customers'
import { syncReturnToFirestore, syncSaleToFirestore } from '@/services/firebase/sync'
import { queueOutboxEntry } from './outbox'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { toFiniteNumber } from '@/utils/numbers'

export interface CreateSaleInput {
  billNo: string
  cashierId: number
  cashierName?: string
  customerId?: number
  cartItems: CartItem[]
  subtotal: number
  discount: number
  taxTotal: number
  grandTotal: number
  payments: Array<{ method: Payment['method']; amount: number; referenceNo?: string }>
}

function buildReturnBatchAllocations(
  qty: number,
  batchAllocations?: Array<{ batchId: number; qty: number }>,
  fallbackBatchId?: number
): Array<{ batchId: number; qty: number }> {
  if (Array.isArray(batchAllocations) && batchAllocations.length > 0) {
    let remainingQty = qty
    const allocationsToRestore: Array<{ batchId: number; qty: number }> = []

    for (const allocation of batchAllocations) {
      if (remainingQty <= 0) break
      const soldQty = Math.max(0, toFiniteNumber(allocation.qty))
      if (soldQty <= 0) continue
      const restoreQty = Math.min(soldQty, remainingQty)
      allocationsToRestore.push({ batchId: allocation.batchId, qty: restoreQty })
      remainingQty -= restoreQty
    }

    if (allocationsToRestore.length > 0) return allocationsToRestore
  }

  return fallbackBatchId ? [{ batchId: fallbackBatchId, qty }] : []
}

// Atomic transaction: sale + items + payments + stock deduction + outbox entry
export async function createSaleTransaction(input: CreateSaleInput): Promise<number> {
  const createdAt = new Date()
  const stockDeltas: Array<{
    productId: number
    qty: number
    batchAllocations: Array<{ batchId: number; qty: number }>
  }> = []
  const creditLedgerSyncId = input.customerId
    ? `sale-credit-${input.billNo}`
    : undefined
  const syncedItems: Array<{
    lineId: string
    productId: number
    productName: string
    batchId?: number
    batchAllocations?: Array<{ batchId: number; qty: number }>
    qty: number
    unitPrice: number
    discount: number
    taxRate: number
    lineTotal: number
  }> = []

  const loyaltyPointsDelta = input.customerId ? Math.floor(input.grandTotal / 100) : 0

  const { saleId, cogsTotal, grossProfitTotal, profitEstimated } = await db.transaction(
    'rw',
    [db.sales, db.sale_items, db.payments, db.products, db.batches, db.credit_ledger, db.customers, db.outbox],
    async () => {
      let saleCogsTotal = 0
      let saleProfitEstimated = false
      const saleId = createEntityId()

      await db.sales.put({
        id: saleId,
        billNo: input.billNo,
        customerId: input.customerId ?? undefined,
        cashierId: input.cashierId,
        subtotal: input.subtotal,
        discount: input.discount,
        taxTotal: input.taxTotal,
        grandTotal: input.grandTotal,
        cogsTotal: 0,
        grossProfitTotal: input.grandTotal,
        profitEstimated: false,
        returnTotal: 0,
        status: 'pending_sync',
        createdAt,
      })

      for (const item of input.cartItems) {
        const product = await db.products.get(item.productId)
        const batchPlan = await deductStockFEFO(item.productId, item.qty)
        const batchAllocations = batchPlan.map((batch) => ({
          batchId: batch.batchId,
          qty: batch.deductQty,
        }))
        const batchId = batchAllocations[0]?.batchId
        const coveredQty = batchPlan.reduce((sum, batch) => sum + batch.deductQty, 0)
        const uncoveredQty = Math.max(0, item.qty - coveredQty)
        const coveredCogs = batchPlan.reduce((sum, batch) => sum + batch.deductQty * batch.purchasePrice, 0)
        const fallbackUnitCost = product?.costPrice ?? 0
        const fallbackCogs = uncoveredQty * fallbackUnitCost

        saleCogsTotal += coveredCogs + fallbackCogs
        if (uncoveredQty > 0 || (batchPlan.length === 0 && fallbackUnitCost <= 0)) {
          saleProfitEstimated = true
        }

        await db.sale_items.add({
          saleId,
          productId: item.productId,
          ...(batchId !== undefined ? { batchId } : {}),
          ...(batchAllocations.length > 0 ? { batchAllocations } : {}),
          qty: item.qty,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal,
        })

        syncedItems.push({
          lineId: `${input.billNo}-${syncedItems.length + 1}`,
          productId: item.productId,
          productName: item.name,
          ...(batchId !== undefined ? { batchId } : {}),
          ...(batchAllocations.length > 0 ? { batchAllocations } : {}),
          qty: item.qty,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal,
        })

        await updateStock(item.productId, -item.qty)

        stockDeltas.push({
          productId: item.productId,
          qty: item.qty,
          batchAllocations,
        })
      }

      for (const payment of input.payments) {
        await db.payments.add({
          saleId,
          method: payment.method,
          amount: payment.amount,
          referenceNo: payment.referenceNo,
          createdAt,
        })
      }

      const creditPayment = input.payments.find((p) => p.method === 'credit')
      if (creditPayment && input.customerId) {
        await updateCreditBalance(input.customerId, creditPayment.amount)
        await addCreditLedgerEntry({
          syncId: creditLedgerSyncId,
          customerId: input.customerId ?? undefined,
          saleId,
          entryType: 'debit',
          amount: creditPayment.amount,
          notes: `Bill ${input.billNo}`,
          createdAt,
        })
      }

      // Increment loyalty points (1 point per ₹100 spent)
      if (input.customerId) {
        const pts = Math.floor(input.grandTotal / 100)
        if (pts > 0) {
          await db.customers.where('id').equals(input.customerId).modify((c) => {
            c.loyaltyPoints = (c.loyaltyPoints ?? 0) + pts
          })
        }
      }

      const grossProfitTotal = input.grandTotal - saleCogsTotal
      await db.sales.update(saleId, {
        cogsTotal: saleCogsTotal,
        grossProfitTotal,
        profitEstimated: saleProfitEstimated,
      })

      // Store full Firestore payload so the outbox flush can retry without DB joins
      await queueOutboxEntry({
        action: 'create_sale',
        entityType: 'sale',
        entityKey: input.billNo,
        payload: JSON.stringify({
          saleId,
          billNo: input.billNo,
          cashierId: input.cashierId,
          cashierName: input.cashierName ?? null,
          customerId: input.customerId ?? null,
          subtotal: input.subtotal,
          discount: input.discount,
          taxTotal: input.taxTotal,
          grandTotal: input.grandTotal,
          cogsTotal: saleCogsTotal,
          grossProfitTotal,
          profitEstimated: saleProfitEstimated,
          returnTotal: 0,
          creditLedgerSyncId,
          ...(loyaltyPointsDelta > 0 ? { loyaltyPointsDelta } : {}),
          payments: input.payments.map((p) => ({
            method: p.method,
            amount: p.amount,
            referenceNo: p.referenceNo,
          })),
          items: syncedItems,
          stockDeltas,
          createdAt: createdAt.toISOString(),
        }),
        createdAt,
      })

      return {
        saleId,
        cogsTotal: saleCogsTotal,
        grossProfitTotal,
        profitEstimated: saleProfitEstimated,
      }
    }
  )

  // Fire-and-forget Firestore sync (never blocks local flow).
  // On failure, the outbox entry remains and flushOutbox() will retry on next online event.
  syncSaleToFirestore({
    saleId,
    billNo: input.billNo,
    cashierId: input.cashierId,
    cashierName: input.cashierName ?? null,
    customerId: input.customerId ?? null,
    subtotal: input.subtotal,
    discount: input.discount,
    taxTotal: input.taxTotal,
    grandTotal: input.grandTotal,
    cogsTotal,
    grossProfitTotal,
    profitEstimated,
    returnTotal: 0,
    creditLedgerSyncId,
    ...(loyaltyPointsDelta > 0 ? { loyaltyPointsDelta } : {}),
    payments: input.payments.map((p) => ({
      method: p.method,
      amount: p.amount,
      referenceNo: p.referenceNo,
    })),
    items: syncedItems,
    stockDeltas,
    createdAt,
  })
    .then(() => db.sales.update(saleId, { status: 'completed' }))
    .catch((err: unknown) => console.warn('[Firestore] fire-and-forget sync failed (will retry):', err))

  return saleId
}

export async function getSaleById(id: number): Promise<Sale | undefined> {
  return db.sales.get(id)
}

export async function getSaleWithItems(saleId: number): Promise<{
  sale: Sale
  items: Array<SaleItem & { productName: string; unit: string }>
  payments: Payment[]
} | null> {
  const sale = await db.sales.get(saleId)
  if (!sale) return null
  const items = await db.sale_items.where('saleId').equals(saleId).toArray()
  const payments = await db.payments.where('saleId').equals(saleId).toArray()
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const product = await db.products.get(item.productId)
      return { ...item, productName: product?.name ?? 'Unknown Product', unit: product?.unit ?? '' }
    })
  )
  return { sale, items: enrichedItems, payments }
}

export async function getTodaySales(): Promise<Sale[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  return db.sales.where('createdAt').aboveOrEqual(startOfDay).toArray()
}

export async function getSalesByCashier(cashierId: number, since: Date): Promise<Sale[]> {
  return db.sales
    .where('cashierId')
    .equals(cashierId)
    .filter((s) => s.createdAt >= since)
    .toArray()
}

export async function getTodayCashTotal(): Promise<number> {
  const todaySales = await getTodaySales()
  const saleIds = todaySales.map((s) => s.id!).filter(Boolean)
  if (saleIds.length === 0) return 0

  let total = 0
  for (const saleId of saleIds) {
    const payments = await db.payments
      .where('saleId')
      .equals(saleId)
      .filter((p) => p.method === 'cash')
      .toArray()
    total += payments.reduce((sum, p) => sum + p.amount, 0)
  }
  return total
}

export interface ReturnItem {
  saleItemId: number
  productId: number
  batchId?: number
  batchAllocations?: Array<{ batchId: number; qty: number }>
  qty: number
  unitPrice: number
  lineTotal: number
}

export async function getSaleReturns(saleId: number): Promise<SaleReturn[]> {
  const returns = await db.sale_returns.where('saleId').equals(saleId).toArray()
  return returns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function processReturn(
  saleId: number,
  billNo: string,
  items: ReturnItem[],
  reason: string,
  userId: number,
  customerId?: number
): Promise<void> {
  const createdAt = new Date()
  const syncId = createSyncId('return')
  const totalRefund = items.reduce((s, i) => s + i.lineTotal, 0)
  const creditLedgerSyncId = customerId ? `${syncId}-credit` : undefined
  const returnRecord: SaleReturn = {
    syncId,
    saleId,
    billNo,
    ...(customerId !== undefined ? { customerId } : {}),
    totalRefund,
    reason,
    userId,
    ...(creditLedgerSyncId ? { creditLedgerSyncId } : {}),
    items,
    createdAt,
  }

  await db.transaction('rw', [db.products, db.batches, db.credit_ledger, db.customers, db.audit_log, db.sale_returns, db.sales, db.outbox], async () => {
    for (const item of items) {
      // Restore stock
      await db.products.where('id').equals(item.productId).modify((p) => {
        p.stock = toFiniteNumber(p.stock) + item.qty
        p.updatedAt = createdAt
      })
      // Restore the original sold batch when available; otherwise fall back to the latest batch.
      const allocationsToRestore = buildReturnBatchAllocations(
        item.qty,
        item.batchAllocations,
        item.batchId
      )
      if (allocationsToRestore.length > 0) {
        for (const allocation of allocationsToRestore) {
          await db.batches.where('id').equals(allocation.batchId).modify((b) => {
            b.qtyRemaining = toFiniteNumber(b.qtyRemaining) + allocation.qty
          })
        }
      } else {
        const batches = await db.batches.where('productId').equals(item.productId).toArray()
        if (batches.length > 0) {
          const latest = batches.sort(
            (a, b) =>
              (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0) || (b.id ?? 0) - (a.id ?? 0)
          )[0]
          await db.batches.where('id').equals(latest.id!).modify((b) => {
            b.qtyRemaining = toFiniteNumber(b.qtyRemaining) + item.qty
          })
        }
      }
    }

    // Credit the refund to customer if attached, or log as cash refund
    if (customerId) {
      await db.credit_ledger.add({
        syncId: creditLedgerSyncId,
        customerId,
        saleId,
        entryType: 'credit',
        amount: totalRefund,
        notes: `Return from ${billNo}: ${reason}`,
        createdAt,
      })
      await db.customers.where('id').equals(customerId).modify((c) => {
        c.currentBalance = toFiniteNumber(c.currentBalance) - totalRefund
        c.updatedAt = createdAt
      })
    }

    await db.sale_returns.add(returnRecord)
    await db.sales.update(saleId, {
      returnTotal: await db.sale_returns
        .where('saleId')
        .equals(saleId)
        .toArray()
        .then((returns) => returns.reduce((sum, entry) => sum + entry.totalRefund, 0)),
      lastReturnAt: createdAt,
    })

    await db.audit_log.add({
      action: 'return',
      entityType: 'sale',
      entityId: saleId,
      detail: JSON.stringify({ billNo, reason, totalRefund, items: items.map((i) => ({ productId: i.productId, qty: i.qty })) }),
      userId,
      createdAt,
    })

    await queueOutboxEntry({
      action: 'create_sale_return',
      entityType: 'sale_return',
      entityKey: syncId,
      payload: JSON.stringify({
        syncId,
        saleId,
        billNo,
        customerId: customerId ?? null,
        totalRefund,
        reason,
        userId,
        creditLedgerSyncId: creditLedgerSyncId ?? null,
        items,
        createdAt: createdAt.toISOString(),
      }),
      createdAt,
    })
  })

  syncReturnToFirestore({
    syncId,
    saleId,
    billNo,
    ...(customerId !== undefined ? { customerId } : {}),
    totalRefund,
    reason,
    userId,
    ...(creditLedgerSyncId ? { creditLedgerSyncId } : {}),
    items,
    createdAt,
  }).catch((err: unknown) => console.warn('[Firestore] return sync failed (will retry):', err))
}
