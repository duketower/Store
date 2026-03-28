import type { Batch } from '@/types'
import { toFiniteNumber } from './numbers'

// FEFO: sort batches by expiryDate ASC (earliest first)
export function sortBatchesFEFO(batches: Batch[]): Batch[] {
  return [...batches].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
}

// Determine which batches to deduct from for a given qty (FEFO order)
// Returns array of { batchId, deductQty }
export function planFEFODeduction(
  batches: Batch[],
  totalQty: number
): Array<{ batchId: number; deductQty: number }> {
  const sorted = sortBatchesFEFO(batches.filter((b) => toFiniteNumber(b.qtyRemaining) > 0))
  const plan: Array<{ batchId: number; deductQty: number }> = []
  let remaining = totalQty

  for (const batch of sorted) {
    if (remaining <= 0) break
    if (!batch.id) continue
    const deduct = Math.min(toFiniteNumber(batch.qtyRemaining), remaining)
    plan.push({ batchId: batch.id, deductQty: deduct })
    remaining -= deduct
  }

  return plan
}
