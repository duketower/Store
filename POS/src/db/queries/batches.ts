import { db } from '@/db'
import type { Batch } from '@/types'
import { planFEFODeduction } from '@/utils/fefo'

export async function getBatchesForProduct(productId: number): Promise<Batch[]> {
  return db.batches.where('productId').equals(productId).toArray()
}

// Returns batches sorted by expiryDate ASC (FEFO order) with qty > 0
export async function getBatchesFEFO(productId: number): Promise<Batch[]> {
  const batches = await db.batches
    .where('productId')
    .equals(productId)
    .filter((b) => b.qtyRemaining > 0)
    .toArray()
  return batches.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
}

// Deduct qty from a specific batch
export async function deductBatch(batchId: number, qty: number): Promise<void> {
  await db.batches
    .where('id')
    .equals(batchId)
    .modify((batch) => {
      batch.qtyRemaining = Math.max(0, batch.qtyRemaining - qty)
    })
}

// Plan and execute FEFO deduction across batches for a product.
// If batch stock is insufficient (out-of-stock or no batches), deducts what's available
// and proceeds — product.stock will go negative, to be corrected via GRN later.
export async function deductStockFEFO(
  productId: number,
  totalQty: number
): Promise<Array<{ batchId: number; deductQty: number }>> {
  const batches = await getBatchesFEFO(productId)
  const plan = planFEFODeduction(batches, totalQty)

  // Execute whatever the plan covers — no throw on shortfall
  for (const { batchId, deductQty } of plan) {
    await deductBatch(batchId, deductQty)
  }

  return plan
}

// Get near-expiry batches (within days threshold)
export async function getNearExpiryBatches(withinDays: number): Promise<
  Array<Batch & { productName?: string }>
> {
  const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000)
  const batches = await db.batches
    .filter((b) => b.qtyRemaining > 0 && b.expiryDate <= cutoff)
    .toArray()

  return Promise.all(
    batches.map(async (b) => {
      const product = await db.products.get(b.productId)
      return { ...b, productName: product?.name }
    })
  )
}

export async function addBatch(batch: Omit<Batch, 'id'>): Promise<number> {
  return db.batches.add(batch)
}
