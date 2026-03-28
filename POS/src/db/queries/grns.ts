import { db } from '@/db'
import type { Grn, Batch } from '@/types'
import { createEntityId } from '@/utils/syncIds'

export async function createGrn(grn: Omit<Grn, 'id'> & { id?: number }): Promise<number> {
  const id = grn.id ?? createEntityId()
  await db.grns.put({ ...grn, id })
  return id
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
