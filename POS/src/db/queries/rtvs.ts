import type { RtvSession, RtvItem } from '@/types'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { syncRtvToFirestore } from '@/services/firebase/sync'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export async function createRtvTransaction(
  rtv: Omit<RtvSession, 'id'> & { id?: number },
  items: Array<Omit<RtvItem, 'id' | 'rtvId'>>
): Promise<number> {
  const createdAt = rtv.createdAt ?? new Date()
  const syncId = rtv.syncId ?? createSyncId('rtv')
  const rtvId = rtv.id ?? createEntityId()
  const rtvItems: RtvItem[] = items.map((item) => ({ ...item, rtvId }))

  await syncRtvToFirestore({
    rtv: { ...rtv, id: rtvId, syncId, createdAt },
    items: rtvItems,
  })

  return rtvId
}

export async function getAllRtvs(): Promise<RtvSession[]> {
  const rtvs = useFirestoreDataStore.getState().rtvs
  return [...rtvs].sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
    return bTime - aTime
  })
}

export async function getRtvItems(rtvId: number): Promise<Array<RtvItem & { productName: string }>> {
  const { rtvs, products } = useFirestoreDataStore.getState()
  const rtv = rtvs.find((r) => r.id === rtvId)
  const items: RtvItem[] = (rtv as (RtvSession & { items?: RtvItem[] }) | undefined)?.items ?? []
  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    return { ...item, productName: product?.name ?? `Product #${item.productId}` }
  })
}

// Legacy alias
export const getAllRtvSessions = getAllRtvs
