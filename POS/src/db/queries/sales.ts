import { db } from '@/db'
import type { Sale, SaleItem, Payment, CartItem } from '@/types'
import { deductStockFEFO } from './batches'
import { updateStock } from './products'
import { updateCreditBalance, addCreditLedgerEntry } from './customers'
import { syncSaleToFirestore, syncProductToFirestore, syncBatchToFirestore, syncCustomerToFirestore } from '@/services/firebase/sync'

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

// Atomic transaction: sale + items + payments + stock deduction + outbox entry
export async function createSaleTransaction(input: CreateSaleInput): Promise<number> {
  const saleId = await db.transaction(
    'rw',
    [db.sales, db.sale_items, db.payments, db.products, db.batches, db.credit_ledger, db.customers, db.outbox],
    async () => {
      const now = new Date()

      const saleId = await db.sales.add({
        billNo: input.billNo,
        customerId: input.customerId ?? undefined,
        cashierId: input.cashierId,
        subtotal: input.subtotal,
        discount: input.discount,
        taxTotal: input.taxTotal,
        grandTotal: input.grandTotal,
        status: 'pending_sync',
        createdAt: now,
      })

      for (const item of input.cartItems) {
        const batchPlan = await deductStockFEFO(item.productId, item.qty)
        const batchId = batchPlan[0]?.batchId

        await db.sale_items.add({
          saleId,
          productId: item.productId,
          batchId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal,
        })

        await updateStock(item.productId, -item.qty)
      }

      for (const payment of input.payments) {
        await db.payments.add({
          saleId,
          method: payment.method,
          amount: payment.amount,
          referenceNo: payment.referenceNo,
          createdAt: now,
        })
      }

      const creditPayment = input.payments.find((p) => p.method === 'credit')
      if (creditPayment && input.customerId) {
        await updateCreditBalance(input.customerId, creditPayment.amount)
        await addCreditLedgerEntry({
          customerId: input.customerId ?? undefined,
          saleId,
          entryType: 'debit',
          amount: creditPayment.amount,
          notes: `Bill ${input.billNo}`,
          createdAt: now,
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

      // Outbox entries for product stock + customer balance (retry on failure)
      const uniqueProductIds = [...new Set(input.cartItems.map((i) => i.productId))]
      for (const productId of uniqueProductIds) {
        const p = await db.products.get(productId)
        if (p) {
          await db.outbox.add({
            action: 'update_product_stock',
            payload: JSON.stringify({ id: p.id, name: p.name, stock: p.stock, reorderLevel: p.reorderLevel, unit: p.unit, sellingPrice: p.sellingPrice, category: p.category }),
            createdAt: now,
          })
        }
      }
      if (input.customerId) {
        const c = await db.customers.get(input.customerId)
        if (c) {
          await db.outbox.add({
            action: 'update_customer_balance',
            payload: JSON.stringify({ id: c.id, name: c.name, phone: c.phone ?? null, currentBalance: c.currentBalance, creditLimit: c.creditLimit }),
            createdAt: now,
          })
        }
      }

      // Store full Firestore payload so the outbox flush can retry without DB joins
      await db.outbox.add({
        action: 'create_sale',
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
          payments: input.payments.map((p) => ({ method: p.method, amount: p.amount })),
          items: input.cartItems.map((i) => ({
            productId: i.productId,
            productName: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
          })),
          createdAt: now.toISOString(),
        }),
        createdAt: now,
      })

      return saleId
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
    payments: input.payments.map((p) => ({ method: p.method, amount: p.amount })),
    items: input.cartItems.map((i) => ({
      productId: i.productId,
      productName: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    createdAt: new Date(),
  }).catch((err: unknown) => console.warn('[Firestore] fire-and-forget sync failed (will retry):', err))

  // Fire-and-forget: sync updated product stock + batches + customer to Firestore.
  // Runs after the Dexie transaction — never blocks billing flow.
  const uniqueProductIds = [...new Set(input.cartItems.map((i) => i.productId))]
  for (const productId of uniqueProductIds) {
    db.products.get(productId).then((p) => {
      if (!p) return
      syncProductToFirestore({
        id: p.id!,
        name: p.name,
        stock: p.stock,
        reorderLevel: p.reorderLevel,
        unit: p.unit,
        sellingPrice: p.sellingPrice,
        category: p.category,
      })
      db.batches.where('productId').equals(productId).toArray().then((batches) => {
        for (const b of batches) {
          syncBatchToFirestore({ ...b, id: b.id! })
        }
      })
    })
  }

  if (input.customerId) {
    db.customers.get(input.customerId).then((c) => {
      if (!c) return
      syncCustomerToFirestore({
        id: c.id!,
        name: c.name,
        phone: c.phone,
        currentBalance: c.currentBalance,
        creditLimit: c.creditLimit,
      })
    })
  }

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
  qty: number
  unitPrice: number
  lineTotal: number
}

export async function processReturn(
  saleId: number,
  billNo: string,
  items: ReturnItem[],
  reason: string,
  userId: number,
  customerId?: number
): Promise<void> {
  const totalRefund = items.reduce((s, i) => s + i.lineTotal, 0)

  await db.transaction('rw', [db.products, db.batches, db.credit_ledger, db.audit_log], async () => {
    for (const item of items) {
      // Restore stock
      await db.products.where('id').equals(item.productId).modify((p) => {
        p.stock = p.stock + item.qty
        p.updatedAt = new Date()
      })
      // Restore batch qty (best-effort: add to the latest batch for the product)
      const batches = await db.batches.where('productId').equals(item.productId).toArray()
      if (batches.length > 0) {
        const latest = batches.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0]
        await db.batches.where('id').equals(latest.id!).modify((b) => {
          b.qtyRemaining += item.qty
        })
      }
    }

    // Credit the refund to customer if attached, or log as cash refund
    if (customerId) {
      await db.credit_ledger.add({
        customerId,
        saleId,
        entryType: 'credit',
        amount: totalRefund,
        notes: `Return from ${billNo}: ${reason}`,
        createdAt: new Date(),
      })
      await db.customers.where('id').equals(customerId).modify((c) => {
        c.currentBalance = Math.max(0, c.currentBalance - totalRefund)
        c.updatedAt = new Date()
      })
    }

    await db.audit_log.add({
      action: 'return',
      entityType: 'sale',
      entityId: saleId,
      detail: JSON.stringify({ billNo, reason, totalRefund, items: items.map((i) => ({ productId: i.productId, qty: i.qty })) }),
      userId,
      createdAt: new Date(),
    })
  })
}
