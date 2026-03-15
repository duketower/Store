import { db } from '@/db'
import type { RtvSession, RtvItem } from '@/types'

export async function createRtvTransaction(
  rtv: Omit<RtvSession, 'id'>,
  items: Array<Omit<RtvItem, 'id' | 'rtvId'>>
): Promise<number> {
  return db.transaction('rw', [db.rtvs, db.rtv_items, db.batches, db.products], async () => {
    const rtvId = await db.rtvs.add(rtv)
    for (const item of items) {
      await db.rtv_items.add({ ...item, rtvId })
      await db.batches.where('id').equals(item.batchId).modify((b) => {
        b.qtyRemaining = Math.max(0, b.qtyRemaining - item.qty)
      })
      await db.products.where('id').equals(item.productId).modify((p) => {
        p.stock = Math.max(0, p.stock - item.qty)
        p.updatedAt = new Date()
      })
    }
    return rtvId
  })
}

export async function getAllRtvs(): Promise<RtvSession[]> {
  return db.rtvs.orderBy('id').reverse().toArray()
}

export async function getRtvItems(rtvId: number): Promise<Array<RtvItem & { productName: string }>> {
  const items = await db.rtv_items.where('rtvId').equals(rtvId).toArray()
  return Promise.all(
    items.map(async (item) => {
      const product = await db.products.get(item.productId)
      return { ...item, productName: product?.name ?? `Product #${item.productId}` }
    })
  )
}
