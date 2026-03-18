import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { InventoryAlertsPanel } from '@/components/common/InventoryAlertsPanel'
import { getAllProducts, getLowStockProducts } from '@/db/queries/products'
import { getNearExpiryBatches } from '@/db/queries/batches'
import { formatCurrency } from '@/utils/currency'
import { NEAR_EXPIRY_DAYS } from '@/constants/app'
import type { Product } from '@/types'

export interface StockReportData {
  products: Product[]
  nearExpiry: Array<{ id?: number; productName?: string; batchNo: string; expiryDate: Date; qtyRemaining: number }>
  lowStock: Product[]
}

export function StockTab() {
  const [loading, setLoading] = useState(false)
  const [stockData, setStockData] = useState<StockReportData | null>(null)

  useEffect(() => {
    loadStockReport()
  }, [])

  const loadStockReport = async () => {
    setLoading(true)
    try {
      const [allProducts, nearExpiry, lowStock] = await Promise.all([
        getAllProducts(),
        getNearExpiryBatches(NEAR_EXPIRY_DAYS),
        getLowStockProducts(),
      ])
      setStockData({ products: allProducts, nearExpiry, lowStock })
    } finally {
      setLoading(false)
    }
  }

  const exportStockCSV = () => {
    if (!stockData) return
    const headers = ['Name', 'SKU', 'Category', 'Stock', 'Unit', 'Reorder Level', 'Status', 'Selling Price']
    const rows = stockData.products.map((p) => [
      p.name, p.sku ?? '', p.category, p.stock, p.unit, p.reorderLevel,
      p.stock <= p.reorderLevel ? 'LOW STOCK' : 'OK',
      p.sellingPrice,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={exportStockCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <InventoryAlertsPanel
        lowStock={stockData?.lowStock ?? []}
        nearExpiry={stockData?.nearExpiry ?? []}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : stockData ? (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Reorder At</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockData.products.map((p) => {
                const isLow = p.stock <= p.reorderLevel
                return (
                  <tr key={p.id} className={isLow ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                      {p.stock} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{p.reorderLevel}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      {isLow ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Low Stock</span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">OK</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
