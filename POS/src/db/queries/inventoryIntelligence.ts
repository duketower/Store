import { db } from '@/db'
import type { Product } from '@/types'

export interface ProductIntelligence {
  product: Product
  soldLast30Days: number
  avgDailySales: number       // units/day over last 30 days
  daysRemaining: number | null  // null = no sales history (unknown/dead)
  velocity: 'fast' | 'normal' | 'slow' | 'dead'
  stockValue: number          // stock × sellingPrice
  costValue: number           // stock × costPrice (or sellingPrice if no cost)
}

export interface InventoryIntelligence {
  items: ProductIntelligence[]
  totalStockValue: number   // at selling price
  totalCostValue: number    // at cost price
  fastMoving: ProductIntelligence[]
  slowDead: ProductIntelligence[]
  needsReorderSoon: ProductIntelligence[]  // daysRemaining <= 7
}

// Thresholds — tune as needed
const FAST_THRESHOLD  = 2    // > 2 units/day = fast moving
const SLOW_THRESHOLD  = 0.5  // <= 0.5 units/day = slow
const REORDER_DAYS    = 7    // warn if stock runs out within 7 days
const WINDOW_DAYS     = 30   // lookback window for avg daily sales

export async function getInventoryIntelligence(): Promise<InventoryIntelligence> {
  const thirtyDaysAgo = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const [products, recentSales] = await Promise.all([
    db.products.filter((p) => p.isActive !== false).toArray(),
    db.sales.where('createdAt').aboveOrEqual(thirtyDaysAgo).toArray(),
  ])

  // Build sold-quantity map from recent sale items
  const soldMap = new Map<number, number>()
  if (recentSales.length > 0) {
    const recentSaleIds = new Set(recentSales.map((s) => s.id!))
    const recentItems = await db.sale_items
      .filter((si) => recentSaleIds.has(si.saleId))
      .toArray()
    for (const item of recentItems) {
      soldMap.set(item.productId, (soldMap.get(item.productId) ?? 0) + item.qty)
    }
  }

  const items: ProductIntelligence[] = products.map((p) => {
    const soldLast30Days = soldMap.get(p.id!) ?? 0
    const avgDailySales  = soldLast30Days / WINDOW_DAYS

    const daysRemaining = avgDailySales > 0
      ? Math.floor(p.stock / avgDailySales)
      : null

    let velocity: ProductIntelligence['velocity']
    if (avgDailySales === 0)              velocity = 'dead'
    else if (avgDailySales > FAST_THRESHOLD)  velocity = 'fast'
    else if (avgDailySales > SLOW_THRESHOLD)  velocity = 'normal'
    else                                      velocity = 'slow'

    return {
      product: p,
      soldLast30Days,
      avgDailySales,
      daysRemaining,
      velocity,
      stockValue: p.stock * p.sellingPrice,
      costValue:  p.stock * (p.costPrice ?? p.sellingPrice),
    }
  })

  return {
    items,
    totalStockValue:   items.reduce((s, i) => s + i.stockValue, 0),
    totalCostValue:    items.reduce((s, i) => s + i.costValue, 0),
    fastMoving:        items.filter((i) => i.velocity === 'fast')
                            .sort((a, b) => b.avgDailySales - a.avgDailySales),
    slowDead:          items.filter((i) => i.velocity === 'slow' || i.velocity === 'dead')
                            .sort((a, b) => a.avgDailySales - b.avgDailySales),
    needsReorderSoon:  items
                         .filter((i) => i.daysRemaining !== null && i.daysRemaining <= REORDER_DAYS)
                         .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0)),
  }
}
