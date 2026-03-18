import { useState, useEffect } from 'react'
import { Download, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'
import { StatCard } from './SalesTab'

interface MarginRow {
  productId: number
  name: string
  category: string
  sellingPrice: number
  avgPurchasePrice: number
  margin: number
  marginPct: number
}

type SortCol = 'name' | 'category' | 'sellingPrice' | 'avgPurchasePrice' | 'margin' | 'marginPct'
type SortDir = 'asc' | 'desc'

function marginColor(pct: number): string {
  if (pct >= 20) return 'text-green-600'
  if (pct >= 10) return 'text-amber-600'
  return 'text-red-600'
}

function marginBadgeClass(pct: number): string {
  if (pct >= 20) return 'bg-green-100 text-green-700'
  if (pct >= 10) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export function ProfitMarginTab() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<MarginRow[]>([])
  const [sortCol, setSortCol] = useState<SortCol>('marginPct')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const products = await db.products.toArray()
      const result: MarginRow[] = []

      for (const product of products) {
        if (!product.id) continue
        const batches = await db.batches.where('productId').equals(product.id).toArray()
        if (batches.length === 0) continue

        // Weighted average purchase price by qty received
        const totalQty = batches.reduce((s, b) => s + b.qtyRemaining, 0)
        let avgPurchasePrice: number

        if (totalQty === 0) {
          // All stock depleted — use simple average instead
          avgPurchasePrice = batches.reduce((s, b) => s + b.purchasePrice, 0) / batches.length
        } else {
          const weightedSum = batches.reduce((s, b) => s + b.purchasePrice * b.qtyRemaining, 0)
          avgPurchasePrice = weightedSum / totalQty
        }

        const margin = product.sellingPrice - avgPurchasePrice
        const marginPct = product.sellingPrice > 0 ? (margin / product.sellingPrice) * 100 : 0

        result.push({
          productId: product.id,
          name: product.name,
          category: product.category,
          sellingPrice: product.sellingPrice,
          avgPurchasePrice,
          margin,
          marginPct,
        })
      }

      setRows(result)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    let av: string | number = a[sortCol]
    let bv: string | number = b[sortCol]
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const avgMargin = rows.length > 0 ? rows.reduce((s, r) => s + r.marginPct, 0) / rows.length : 0
  const highest = rows.length > 0 ? rows.reduce((a, b) => (a.marginPct > b.marginPct ? a : b)) : null
  const lowest = rows.length > 0 ? rows.reduce((a, b) => (a.marginPct < b.marginPct ? a : b)) : null

  const exportCSV = () => {
    const headers = ['Product', 'Category', 'Selling Price', 'Avg Purchase Price', 'Margin (₹)', 'Margin (%)']
    const dataRows = sorted.map((r) => [
      r.name,
      r.category,
      r.sellingPrice.toFixed(2),
      r.avgPurchasePrice.toFixed(2),
      r.margin.toFixed(2),
      r.marginPct.toFixed(1) + '%',
    ])
    const csv = [headers, ...dataRows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profit-margin-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <span className="opacity-30 ml-1">↕</span>
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="inline ml-1 text-brand-600" />
      : <ArrowDown size={12} className="inline ml-1 text-brand-600" />
  }

  const th = (col: SortCol, label: string, align: 'left' | 'right' = 'right') => (
    <th
      className={`px-4 py-3 text-${align} cursor-pointer select-none hover:text-gray-700`}
      onClick={() => handleSort(col)}
    >
      {label}<SortIcon col={col} />
    </th>
  )

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-end">
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Avg Margin" value={`${avgMargin.toFixed(1)}%`} highlight />
          <StatCard label="Highest Margin" value={highest ? `${highest.name} (${highest.marginPct.toFixed(1)}%)` : '—'} />
          <StatCard label="Lowest Margin" value={lowest ? `${lowest.name} (${lowest.marginPct.toFixed(1)}%)` : '—'} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
          <p>No products with purchase history found.</p>
          <p className="text-xs mt-1">Receive stock via GRN to see margin data.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {th('name', 'Product', 'left')}
                {th('category', 'Category', 'left')}
                {th('sellingPrice', 'Selling Price')}
                {th('avgPurchasePrice', 'Avg Purchase')}
                {th('margin', 'Margin (₹)')}
                {th('marginPct', 'Margin %')}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((row) => (
                <tr key={row.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.category}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.sellingPrice)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.avgPurchasePrice)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${marginColor(row.marginPct)}`}>
                    {formatCurrency(row.margin)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${marginBadgeClass(row.marginPct)}`}>
                      {row.marginPct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
