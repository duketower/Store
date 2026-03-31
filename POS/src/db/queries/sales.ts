import type { Sale, SaleItem, Payment, CartItem, SaleReturn } from '@/types'
import { deductStockFEFO } from './batches'
import { syncReturnToFirestore, syncSaleToFirestore } from '@/services/firebase/sync'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export interface SaleReceiptData {
  saleId: number
  sale: Sale
  items: Array<SaleItem & { productName: string; unit: string }>
  payments: Payment[]
}

export interface PaymentInput {
  method: Payment['method']
  amount: number
  referenceNo?: string
}

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
  payments: PaymentInput[]
  sessionId?: number
}

export async function createSaleTransaction(input: CreateSaleInput): Promise<SaleReceiptData> {
  const createdAt = new Date()
  const saleId = createEntityId()
  const creditLedgerSyncId = input.customerId ? `sale-credit-${input.billNo}` : undefined
  const loyaltyPointsDelta = input.customerId ? Math.floor(input.grandTotal / 100) : 0

  let saleCogsTotal = 0
  let saleProfitEstimated = false
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
  const stockDeltas: Array<{
    productId: number
    qty: number
    batchAllocations: Array<{ batchId: number; qty: number }>
  }> = []

  const { products } = useFirestoreDataStore.getState()

  for (const item of input.cartItems) {
    const product = products.find((p) => p.id === item.productId)
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

    stockDeltas.push({ productId: item.productId, qty: item.qty, batchAllocations })
  }

  const grossProfitTotal = input.grandTotal - saleCogsTotal

  await syncSaleToFirestore({
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
    createdAt,
  })

  const sale: Sale = {
    id: saleId,
    billNo: input.billNo,
    cashierId: input.cashierId,
    customerId: input.customerId,
    subtotal: input.subtotal,
    discount: input.discount,
    taxTotal: input.taxTotal,
    grandTotal: input.grandTotal,
    cogsTotal: saleCogsTotal,
    grossProfitTotal,
    profitEstimated: saleProfitEstimated,
    returnTotal: 0,
    status: 'completed',
    createdAt,
  }

  const receiptItems: Array<SaleItem & { productName: string; unit: string }> = syncedItems.map((si) => ({
    id: undefined,
    saleId,
    productId: si.productId,
    batchId: si.batchId,
    batchAllocations: si.batchAllocations,
    qty: si.qty,
    unitPrice: si.unitPrice,
    discount: si.discount,
    taxRate: si.taxRate,
    lineTotal: si.lineTotal,
    productName: si.productName,
    unit: products.find((p) => p.id === si.productId)?.unit ?? '',
  }))

  const receiptPayments: Payment[] = input.payments.map((p) => ({
    saleId,
    method: p.method,
    amount: p.amount,
    referenceNo: p.referenceNo,
    createdAt,
  }))

  return { saleId, sale, items: receiptItems, payments: receiptPayments }
}

export async function getSaleById(id: number): Promise<Sale | undefined> {
  const sales = useFirestoreDataStore.getState().sales
  return sales.find((s) => s.id === id)
}

export async function getSaleWithItems(saleId: number): Promise<{
  sale: Sale
  items: Array<SaleItem & { productName: string; unit: string }>
  payments: Payment[]
} | null> {
  const { sales, products } = useFirestoreDataStore.getState()
  const sale = sales.find((s) => s.id === saleId)
  if (!sale) return null

  const items: Array<SaleItem & { productName: string; unit: string }> = (sale.items ?? []).map((item) => {
    const product = products.find((p) => p.id === item.productId)
    return {
      ...item,
      productName: product?.name ?? 'Unknown Product',
      unit: product?.unit ?? '',
    }
  })

  const payments: Payment[] = (sale.payments ?? [])

  return { sale, items, payments }
}

export async function getTodaySales(): Promise<Sale[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const sales = useFirestoreDataStore.getState().sales
  return sales.filter((s) => {
    const createdAt = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt)
    return createdAt >= startOfDay
  })
}

export async function getSalesByCashier(cashierId: number, since: Date): Promise<Sale[]> {
  const sales = useFirestoreDataStore.getState().sales
  return sales.filter((s) => {
    const createdAt = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt)
    return s.cashierId === cashierId && createdAt >= since
  })
}

export async function getTodayCashTotal(): Promise<number> {
  const todaySales = await getTodaySales()
  return todaySales.reduce((total, sale) => {
    const cashPayments = (sale.payments ?? []).filter((p) => p.method === 'cash')
    return total + cashPayments.reduce((sum, p) => sum + p.amount, 0)
  }, 0)
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
  const returns = useFirestoreDataStore.getState().saleReturns
  return returns
    .filter((r) => r.saleId === saleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

  await syncReturnToFirestore({
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
  })
}
