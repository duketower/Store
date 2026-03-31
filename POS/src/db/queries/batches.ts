import type { Batch } from '@/types'
import { planFEFODeduction } from '@/utils/fefo'
import { toFiniteNumber } from '@/utils/numbers'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { syncBatchToFirestore } from '@/services/firebase/sync'

export async function getBatchesForProduct(productId: number): Promise<Batch[]> {
  const batches = useFirestoreDataStore.getState().batches
  return batches.filter((b) => b.productId === productId)
}

// Returns batches sorted by expiryDate ASC (FEFO order) with qty > 0
export async function getBatchesFEFO(productId: number): Promise<Batch[]> {
  const batches = useFirestoreDataStore.getState().batches
  return batches
    .filter((b) => b.productId === productId && toFiniteNumber(b.qtyRemaining) > 0)
    .sort((a, b) => {
      const aTime = a.expiryDate instanceof Date ? a.expiryDate.getTime() : new Date(a.expiryDate).getTime()
      const bTime = b.expiryDate instanceof Date ? b.expiryDate.getTime() : new Date(b.expiryDate).getTime()
      return aTime - bTime
    })
}

// Plan FEFO deduction — read-only, no DB writes.
// Returns plan: Array<{batchId, deductQty, purchasePrice}>
export async function deductStockFEFO(
  productId: number,
  totalQty: number
): Promise<Array<{ batchId: number; deductQty: number; purchasePrice: number }>> {
  const batches = await getBatchesFEFO(productId)
  const plan = planFEFODeduction(batches, totalQty)
  const batchPriceMap = new Map(batches.map((batch) => [batch.id!, batch.purchasePrice]))

  return plan.map(({ batchId, deductQty }) => ({
    batchId,
    deductQty,
    purchasePrice: batchPriceMap.get(batchId) ?? 0,
  }))
}

export async function addBatch(batch: Omit<Batch, 'id'> & { id?: number }): Promise<number> {
  const id = batch.id ?? Date.now()
  await syncBatchToFirestore({ ...batch, id } as Parameters<typeof syncBatchToFirestore>[0])
  return id
}

// Get near-expiry batches (within days threshold)
export async function getNearExpiryBatches(withinDays: number): Promise<
  Array<Batch & { productName?: string }>
> {
  const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000)
  const { batches, products } = useFirestoreDataStore.getState()
  return batches
    .filter((b) => {
      const expiry = b.expiryDate instanceof Date ? b.expiryDate : new Date(b.expiryDate)
      return toFiniteNumber(b.qtyRemaining) > 0 && expiry <= cutoff
    })
    .map((b) => {
      const product = products.find((p) => p.id === b.productId)
      return { ...b, productName: product?.name }
    })
}
