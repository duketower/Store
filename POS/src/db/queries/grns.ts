import type { Grn, Batch } from '@/types'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export async function createGrn(_grn: Omit<Grn, 'id'> & { id?: number }): Promise<number> {
  // No-op: the real GRN sync is done directly by the page via syncGrnToFirestore.
  return Promise.resolve(_grn.id ?? Date.now())
}

export async function getAllGrns(): Promise<Grn[]> {
  const grns = useFirestoreDataStore.getState().grns
  return [...grns].sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
    return bTime - aTime
  })
}

export async function getGrnBatches(grnId: number): Promise<Array<Batch & { productName: string }>> {
  const { batches, products } = useFirestoreDataStore.getState()
  const grnBatches = batches.filter((b) => b.grnId === grnId)
  return grnBatches.map((b) => {
    const product = products.find((p) => p.id === b.productId)
    return { ...b, productName: product?.name ?? `Product #${b.productId}` }
  })
}
