import { db } from '@/db'
import type { Grn, Batch } from '@/types'

export async function createGrn(grn: Omit<Grn, 'id'>): Promise<number> {
  return db.grns.add(grn)
}

export async function getAllGrns(): Promise<Grn[]> {
  return db.grns.orderBy('id').reverse().toArray()
}

export async function getGrnBatches(grnId: number): Promise<Array<Batch & { productName: string }>> {
  const batches = await db.batches.where('grnId').equals(grnId).toArray()
  return Promise.all(
    batches.map(async (b) => {
      const product = await db.products.get(b.productId)
      return { ...b, productName: product?.name ?? `Product #${b.productId}` }
    })
  )
}
