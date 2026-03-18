import { useState, useEffect } from 'react'
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { getInventoryIntelligence, type InventoryIntelligence } from '@/db/queries/inventoryIntelligence'
import { formatCurrency } from '@/utils/currency'

export function InventoryTab() {
  const [loading, setLoading] = useState(false)
  const [inventoryData, setInventoryData] = useState<InventoryIntelligence | null>(null)

  useEffect(() => {
    loadInventoryReport()
  }, [])

  const loadInventoryReport = async () => {
    setLoading(true)
    try {
      const data = await getInventoryIntelligence()
      setInventoryData(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : inventoryData ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Stock Value (MRP)</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(inventoryData.totalStockValue)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Stock Value (Cost)</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(inventoryData.totalCostValue)}</p>
            </div>
            <div className="rounded-lg border border-brand-100 bg-brand-50 p-3">
              <p className="text-xs font-medium text-brand-600 mb-1">Fast Moving</p>
              <p className="text-lg font-bold text-brand-700">{inventoryData.fastMoving.length} products</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Slow / Dead Stock</p>
              <p className="text-lg font-bold text-gray-900">{inventoryData.slowDead.length} products</p>
            </div>
          </div>

          {/* Needs reorder soon */}
          {inventoryData.needsReorderSoon.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-600" />
                <p className="text-sm font-semibold text-red-700">
                  Reorder Urgently — Stock running out within 7 days
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-red-600 uppercase">
                      <th className="text-left pb-2 font-semibold">Product</th>
                      <th className="text-right pb-2 font-semibold">Days Left</th>
                      <th className="text-right pb-2 font-semibold">Current Stock</th>
                      <th className="text-right pb-2 font-semibold">Avg / Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {inventoryData.needsReorderSoon.map((i) => (
                      <tr key={i.product.id}>
                        <td className="py-2 font-medium text-gray-800">{i.product.name}</td>
                        <td className="py-2 text-right font-bold text-red-600">
                          {i.daysRemaining === 0 ? 'Today!' : `${i.daysRemaining}d`}
                        </td>
                        <td className="py-2 text-right text-gray-700">{i.product.stock} {i.product.unit}</td>
                        <td className="py-2 text-right text-gray-500">{i.avgDailySales.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fast moving */}
          {inventoryData.fastMoving.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <TrendingUp size={16} className="text-green-600" />
                <p className="text-sm font-semibold text-gray-700">Fast Moving Items</p>
                <span className="text-xs text-gray-400">(last 30 days)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="text-left px-4 py-2 font-semibold">Product</th>
                      <th className="text-right px-4 py-2 font-semibold">Sold (30d)</th>
                      <th className="text-right px-4 py-2 font-semibold">Avg / Day</th>
                      <th className="text-right px-4 py-2 font-semibold">Stock Left</th>
                      <th className="text-right px-4 py-2 font-semibold">Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inventoryData.fastMoving.map((i) => (
                      <tr key={i.product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{i.product.name}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{i.soldLast30Days} {i.product.unit}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-600">{i.avgDailySales.toFixed(1)}/day</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{i.product.stock} {i.product.unit}</td>
                        <td className="px-4 py-2.5 text-right">
                          {i.daysRemaining !== null ? (
                            <span className={`font-semibold ${i.daysRemaining <= 7 ? 'text-red-600' : i.daysRemaining <= 14 ? 'text-amber-600' : 'text-gray-700'}`}>
                              {i.daysRemaining}d
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Slow / Dead stock */}
          {inventoryData.slowDead.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <TrendingDown size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Slow / Dead Stock</p>
                <span className="text-xs text-gray-400">(≤ 0.5 units/day or no sales in 30d)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="text-left px-4 py-2 font-semibold">Product</th>
                      <th className="text-right px-4 py-2 font-semibold">Sold (30d)</th>
                      <th className="text-right px-4 py-2 font-semibold">Avg / Day</th>
                      <th className="text-right px-4 py-2 font-semibold">Stock</th>
                      <th className="text-right px-4 py-2 font-semibold">Stock Value</th>
                      <th className="text-right px-4 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inventoryData.slowDead.map((i) => (
                      <tr key={i.product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{i.product.name}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{i.soldLast30Days}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{i.avgDailySales.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{i.product.stock} {i.product.unit}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(i.stockValue)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            i.velocity === 'dead'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {i.velocity === 'dead' ? 'Dead' : 'Slow'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All products — days remaining table */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Package size={16} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-700">All Products — Stock Runway</p>
              <span className="text-xs text-gray-400">(based on last 30 days avg sales)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="text-left px-4 py-2 font-semibold">Product</th>
                    <th className="text-right px-4 py-2 font-semibold">Stock</th>
                    <th className="text-right px-4 py-2 font-semibold">Avg / Day</th>
                    <th className="text-right px-4 py-2 font-semibold">Days Left</th>
                    <th className="text-right px-4 py-2 font-semibold">Velocity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inventoryData.items
                    .sort((a, b) => (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999))
                    .map((i) => (
                      <tr key={i.product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{i.product.name}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{i.product.stock} {i.product.unit}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{i.avgDailySales.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">
                          {i.daysRemaining === null ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <span className={
                              i.daysRemaining <= 3 ? 'text-red-600' :
                              i.daysRemaining <= 7 ? 'text-orange-500' :
                              i.daysRemaining <= 14 ? 'text-amber-500' :
                              'text-green-600'
                            }>
                              {i.daysRemaining}d
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            i.velocity === 'fast'   ? 'bg-green-100 text-green-700' :
                            i.velocity === 'normal' ? 'bg-brand-100 text-brand-700' :
                            i.velocity === 'slow'   ? 'bg-amber-50 text-amber-700' :
                                                      'bg-gray-100 text-gray-500'
                          }`}>
                            {i.velocity.charAt(0).toUpperCase() + i.velocity.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
