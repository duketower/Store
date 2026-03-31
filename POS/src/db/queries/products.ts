import type { Product } from '@/types'
import { syncProductToFirestore } from '@/services/firebase/sync'
import { createEntityId } from '@/utils/syncIds'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { toFiniteNumber } from '@/utils/numbers'

function buildProductSyncPayload(product: Product, id: number) {
  return {
    id,
    name: product.name,
    barcode: product.barcode,
    sku: product.sku,
    stock: product.stock,
    reorderLevel: product.reorderLevel,
    unit: product.unit,
    soldByWeight: product.soldByWeight,
    sellingPrice: product.sellingPrice,
    costPrice: product.costPrice,
    mrp: product.mrp,
    taxRate: product.taxRate,
    hsnCode: product.hsnCode,
    category: product.category,
    baseUnit: product.baseUnit,
    baseQty: product.baseQty,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  const products = useFirestoreDataStore.getState().products
  return products.find((p) => p.barcode === barcode)
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const products = useFirestoreDataStore.getState().products
  return products
    .filter(
      (p) =>
        p.isActive !== false &&
        (p.name.toLowerCase().includes(q) ||
          (p.barcode ?? '').includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q))
    )
    .slice(0, 50)
}

export async function getAllProducts(): Promise<Product[]> {
  return useFirestoreDataStore.getState().products
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const products = useFirestoreDataStore.getState().products
  return products.find((p) => p.id === id)
}

export async function updateStock(productId: number, delta: number): Promise<void> {
  // Stock is updated atomically in syncSaleToFirestore / syncRtvToFirestore.
  // This no-op keeps the call sites in old flow compiling.
  const product = useFirestoreDataStore.getState().products.find((p) => p.id === productId)
  if (!product) return
  const now = new Date()
  const updated: Product = { ...product, stock: toFiniteNumber(product.stock) + delta, updatedAt: now }
  await syncProductToFirestore(buildProductSyncPayload(updated, productId))
}

export async function getProductStock(productId: number): Promise<number> {
  const batches = useFirestoreDataStore.getState().batches
  return batches
    .filter((b) => b.productId === productId)
    .reduce((sum, b) => sum + toFiniteNumber(b.qtyRemaining), 0)
}

export async function getLowStockProducts(): Promise<Product[]> {
  const products = useFirestoreDataStore.getState().products
  return products.filter((p) => p.stock <= p.reorderLevel)
}

export async function getNearExpiryBatches(withinDays: number): Promise<
  Array<{ productName?: string } & import('@/types').Batch>
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

export async function upsertProduct(product: Omit<Product, 'id'> & { id?: number }): Promise<number> {
  const now = new Date()
  let id: number
  let saved: Product

  if (product.id) {
    id = product.id
    saved = { ...product, id, updatedAt: now }
  } else {
    id = createEntityId()
    saved = { ...product, id, createdAt: now, updatedAt: now }
  }

  await syncProductToFirestore(buildProductSyncPayload(saved, id))
  return id
}

export async function adjustStock(
  productId: number,
  delta: number,
  _reason: string,
  _userId: number
): Promise<void> {
  const product = useFirestoreDataStore.getState().products.find((p) => p.id === productId)
  if (!product) throw new Error('Product not found')
  const now = new Date()
  const saved: Product = { ...product, stock: toFiniteNumber(product.stock) + delta, updatedAt: now }
  await syncProductToFirestore(buildProductSyncPayload(saved, productId))
}
