import { db } from '@/db'
import type { Product } from '@/types'
import { syncProductToFirestore } from '@/services/firebase/sync'
import { queueOutboxEntry } from './outbox'
import { createEntityId } from '@/utils/syncIds'

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

async function queueProductSync(product: Product, id: number, createdAt: Date): Promise<void> {
  const payload = buildProductSyncPayload(product, id)
  await queueOutboxEntry({
    action: 'upsert_product',
    entityType: 'product',
    entityKey: String(id),
    payload: JSON.stringify({
      ...payload,
      createdAt: payload.createdAt.toISOString(),
      updatedAt: payload.updatedAt.toISOString(),
    }),
    createdAt,
  })
}

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
      product.stock = product.stock + delta
      product.updatedAt = new Date()
    })
}

export async function getLowStockProducts(): Promise<Product[]> {
  return db.products.filter((p) => p.stock <= p.reorderLevel).toArray()
}

export async function upsertProduct(product: Omit<Product, 'id'> & { id?: number }): Promise<number> {
  const now = new Date()
  let id: number
  let saved: Product

  if (product.id) {
    saved = { ...product, updatedAt: now }
    await db.transaction('rw', [db.products, db.outbox], async () => {
      await db.products.update(product.id!, saved)
      await queueProductSync(saved, product.id!, now)
    })
    id = product.id
  } else {
    id = createEntityId()
    saved = { ...product, id, createdAt: now, updatedAt: now }
    id = await db.transaction('rw', [db.products, db.outbox], async () => {
      await db.products.put(saved)
      await queueProductSync(saved, id, now)
      return id
    })
  }

  syncProductToFirestore(buildProductSyncPayload(saved, id))
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
  const after = before + delta
  const now = new Date()
  const saved: Product = {
    ...product,
    stock: after,
    updatedAt: now,
  }

  await db.transaction('rw', [db.products, db.audit_log, db.outbox], async () => {
    await db.products.put(saved)
    await db.audit_log.add({
      action: 'stock_adjust',
      entityType: 'product',
      entityId: productId,
      detail: JSON.stringify({ productName: product.name, before, after, delta, reason }),
      userId,
      createdAt: now,
    })
    await queueProductSync(saved, productId, now)
  })

  syncProductToFirestore(buildProductSyncPayload(saved, productId))
}
