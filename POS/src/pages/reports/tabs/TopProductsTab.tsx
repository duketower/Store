import { useState, useMemo } from 'react'
import { Download, Package } from 'lucide-react'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { formatCurrency } from '@/utils/currency'

type RangeOption = 'last7' | 'last30' | 'thisMonth' | 'custom'

interface ProductStat {
  productId: number
  name: string
  qtySold: number
  revenue: number
}

function getRangeDates(range: RangeOption, customFrom: string, customTo: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (range === 'last7') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'last30') {
    const start = new Date(now)
    start.setDate(start.getDate() - 29)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  // custom
  const start = new Date(customFrom)
  start.setHours(0, 0, 0, 0)
  const customEnd = new Date(customTo)
  customEnd.setHours(23, 59, 59, 999)
  return { start, end: customEnd }
}

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

export function TopProductsTab() {
  const [range, setRange] = useState<RangeOption>('last7')
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
  })
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10))

  const allSales = useFirestoreDataStore((s) => s.sales)
  const allProducts = useFirestoreDataStore((s) => s.products)

  const { byQty, byRevenue } = useMemo(() => {
    if (range === 'custom' && (!customFrom || !customTo)) {
      return { byQty: [], byRevenue: [] }
    }

    const { start, end } = getRangeDates(range, customFrom, customTo)

    const sales = allSales.filter((s) => {
      const t = new Date(s.createdAt)
      return t >= start && t <= end
    })

    if (sales.length === 0) return { byQty: [], byRevenue: [] }

    const nameMap = new Map(allProducts.map((p) => [p.id!, p.name]))

    const statsMap = new Map<number, { qtySold: number; revenue: number }>()
    for (const sale of sales) {
      for (const item of sale.items ?? []) {
        const existing = statsMap.get(item.productId) ?? { qtySold: 0, revenue: 0 }
        existing.qtySold += item.qty
        existing.revenue += item.lineTotal
        statsMap.set(item.productId, existing)
      }
    }

    const stats: ProductStat[] = Array.from(statsMap.entries()).map(([productId, s]) => ({
      productId,
      name: nameMap.get(productId) ?? `Product #${productId}`,
      qtySold: s.qtySold,
      revenue: s.revenue,
    }))

    return {
      byQty: [...stats].sort((a, b) => b.qtySold - a.qtySold).slice(0, 10),
      byRevenue: [...stats].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    }
  }, [allSales, allProducts, range, customFrom, customTo])

  const exportCSV = () => {
    const lines: string[] = []
    lines.push('Top by Quantity')
    lines.push('Rank,Product,Units Sold')
    byQty.forEach((p, i) => lines.push(`${i + 1},"${p.name}",${p.qtySold}`))
    lines.push('')
    lines.push('Top by Revenue')
    lines.push('Rank,Product,Revenue')
    byRevenue.forEach((p, i) => lines.push(`${i + 1},"${p.name}",${p.revenue.toFixed(2)}`))
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `top-products-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasData = byQty.length > 0 || byRevenue.length > 0

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['last7', 'last30', 'thisMonth', 'custom'] as RangeOption[]).map((opt) => {
            const labels: Record<RangeOption, string> = {
              last7: 'Last 7 days',
              last30: 'Last 30 days',
              thisMonth: 'This month',
              custom: 'Custom',
            }
            return (
              <button
                key={opt}
                onClick={() => setRange(opt)}
                className={`px-3 py-2 text-sm border-r border-gray-200 last:border-r-0 transition-colors ${
                  range === opt
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {labels[opt]}
              </button>
            )
          })}
        </div>

        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <span className="text-sm text-gray-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={exportCSV}
          disabled={!hasData}
          className="ml-auto btn-secondary flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-400">
          <Package size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sales data for the selected period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Top by Quantity */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top by Quantity</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byQty.map((p, i) => (
                  <tr key={p.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {i < 3 ? <span>{MEDAL[i]}</span> : <span className="text-gray-400">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-semibold">{p.qtySold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top by Revenue */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top by Revenue</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byRevenue.map((p, i) => (
                  <tr key={p.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {i < 3 ? <span>{MEDAL[i]}</span> : <span className="text-gray-400">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-semibold">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
