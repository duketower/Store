import { db } from '@/db'
import type { Product } from '@/types'
import { syncProductToFirestore } from '@/services/firebase/sync'

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  return db.products.where('barcode').equals(barcode).first()
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return db.products
    .filter(
      (p) =>
        p.isActive !== false &&
        (p.name.toLowerCase().includes(q) ||
          (p.barcode ?? '').includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q))
    )
    .limit(50)
    .toArray()
}

export async function getAllProducts(): Promise<Product[]> {
  return db.products.toArray()
}

export async function getProductById(id: number): Promise<Product | undefined> {
  return db.products.get(id)
}

export async function updateStock(productId: number, delta: number): Promise<void> {
  await db.products
    .where('id')
    .equals(productId)
    .modify((product) => {
      product.stock = Math.max(0, product.stock + delta)
      product.updatedAt = new Date()
    })
}

export async function getLowStockProducts(): Promise<Product[]> {
  return db.products.filter((p) => p.stock <= p.reorderLevel).toArray()
}

export async function upsertProduct(product: Omit<Product, 'id'> & { id?: number }): Promise<number> {
  let id: number
  if (product.id) {
    await db.products.update(product.id, { ...product, updatedAt: new Date() })
    id = product.id
  } else {
    id = await db.products.add({ ...product, createdAt: new Date(), updatedAt: new Date() })
  }
  // Fire-and-forget sync to Firestore
  syncProductToFirestore({
    id,
    name: product.name,
    stock: product.stock,
    reorderLevel: product.reorderLevel,
    unit: product.unit,
    sellingPrice: product.sellingPrice,
    category: product.category,
  })
  return id
}

export async function adjustStock(
  productId: number,
  delta: number,
  reason: string,
  userId: number
): Promise<void> {
  const product = await db.products.get(productId)
  if (!product) throw new Error('Product not found')
  const before = product.stock
  const after = Math.max(0, before + delta)
  await db.products.where('id').equals(productId).modify((p) => {
    p.stock = after
    p.updatedAt = new Date()
  })
  await db.audit_log.add({
    action: 'stock_adjust',
    entityType: 'product',
    entityId: productId,
    detail: JSON.stringify({ productName: product.name, before, after, delta, reason }),
    userId,
    createdAt: new Date(),
  })
}
