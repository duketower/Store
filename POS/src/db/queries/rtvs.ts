import { db } from '@/db'
import type { RtvSession, RtvItem } from '@/types'
import { createSyncId } from '@/utils/syncIds'
import { queueOutboxEntry } from './outbox'
import { syncRtvToFirestore } from '@/services/firebase/sync'

export async function createRtvTransaction(
  rtv: Omit<RtvSession, 'id'>,
  items: Array<Omit<RtvItem, 'id' | 'rtvId'>>
): Promise<number> {
  const createdAt = rtv.createdAt ?? new Date()
  const syncId = rtv.syncId ?? createSyncId('rtv')
  const rtvItems: RtvItem[] = []

  const rtvId = await db.transaction('rw', [db.rtvs, db.rtv_items, db.batches, db.products, db.outbox], async () => {
    const rtvPayload: RtvSession = { ...rtv, syncId, createdAt }
    const createdRtvId = await db.rtvs.add(rtvPayload)

    for (const item of items) {
      const rtvItem: RtvItem = { ...item, rtvId: createdRtvId }
      await db.rtv_items.add(rtvItem)
      rtvItems.push(rtvItem)

      await db.batches.where('id').equals(item.batchId).modify((b) => {
        b.qtyRemaining = Math.max(0, b.qtyRemaining - item.qty)
      })
      await db.products.where('id').equals(item.productId).modify((p) => {
        p.stock = Math.max(0, p.stock - item.qty)
        p.updatedAt = createdAt
      })
    }

    await queueOutboxEntry({
      action: 'create_rtv',
      entityType: 'rtv',
      entityKey: syncId,
      payload: JSON.stringify({
        rtv: {
          ...rtvPayload,
          id: createdRtvId,
          syncId,
          createdAt: createdAt.toISOString(),
        },
        items: rtvItems,
      }),
      createdAt,
    })

    return createdRtvId
  })

  syncRtvToFirestore({
    rtv: {
      ...rtv,
      id: rtvId,
      syncId,
      createdAt,
    },
    items: rtvItems,
  }).catch((err: unknown) => console.warn('[Firestore] RTV sync failed (will retry):', err))

  return rtvId
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
