import { useState, useEffect } from 'react'
import { Truck } from 'lucide-react'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'
import { StatCard } from './SalesTab'
import type { Grn } from '@/types'

type DateRange = 'last30' | 'last90' | 'last180' | 'thisYear' | 'custom'

function getDateRange(range: DateRange, customFrom: string, customTo: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (range === 'last30') {
    const start = new Date(now)
    start.setDate(now.getDate() - 30)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'last90') {
    const start = new Date(now)
    start.setDate(now.getDate() - 90)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'last180') {
    const start = new Date(now)
    start.setDate(now.getDate() - 180)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'thisYear') {
    const start = new Date(now.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  // custom
  const start = new Date(customFrom)
  start.setHours(0, 0, 0, 0)
  const endCustom = new Date(customTo)
  endCustom.setHours(23, 59, 59, 999)
  return { start, end: endCustom }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface VendorRow {
  vendorName: string
  grnCount: number
  totalValue: number
  lastGrnDate: Date
}

export function VendorSummaryTab() {
  const [range, setRange] = useState<DateRange>('last30')
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo, setCustomTo] = useState(todayStr())
  const [rows, setRows] = useState<VendorRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadVendorSummary()
  }, [range, customFrom, customTo])

  const loadVendorSummary = async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRange(range, customFrom, customTo)
      const grns: Grn[] = await db.grns
        .filter((g) => {
          const d = g.createdAt instanceof Date ? g.createdAt : new Date(g.createdAt)
          return d >= start && d <= end
        })
        .toArray()

      const map: Record<string, VendorRow> = {}
      for (const grn of grns) {
        const key = grn.vendorName?.trim() || '(Unknown Vendor)'
        const d = grn.createdAt instanceof Date ? grn.createdAt : new Date(grn.createdAt)
        if (!map[key]) {
          map[key] = { vendorName: key, grnCount: 0, totalValue: 0, lastGrnDate: d }
        }
        map[key].grnCount += 1
        map[key].totalValue += grn.totalValue
        if (d > map[key].lastGrnDate) {
          map[key].lastGrnDate = d
        }
      }

      const sorted = Object.values(map).sort((a, b) => b.totalValue - a.totalValue)
      setRows(sorted)
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    if (rows.length === 0) return
    const header = 'Vendor,GRNs,Total Value,Last GRN Date'
    const csvRows = rows.map((r) => {
      const dateStr = r.lastGrnDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      const name = r.vendorName.replace(/"/g, '""')
      return `"${name}",${r.grnCount},${r.totalValue.toFixed(2)},${dateStr}`
    })
    const csv = [header, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-summary-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalValue = rows.reduce((s, r) => s + r.totalValue, 0)
  const totalVendors = rows.length

  const rangeLabels: Record<DateRange, string> = {
    last30: 'Last 30 Days',
    last90: 'Last 3 Months',
    last180: 'Last 6 Months',
    thisYear: 'This Year',
    custom: 'Custom',
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {(Object.keys(rangeLabels) as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-2 ${range === r ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="ml-auto btn-secondary text-sm disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <Truck size={32} className="mx-auto mb-3 opacity-30" />
          <p>No GRNs found for this period</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Vendors" value={String(totalVendors)} />
            <StatCard label="Total Purchase Value" value={formatCurrency(totalValue)} highlight />
          </div>

          {/* Vendor Table */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-right">GRNs</th>
                  <th className="px-4 py-3 text-right">Total Value</th>
                  <th className="px-4 py-3 text-right">Last GRN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.vendorName} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.vendorName}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{row.grnCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.totalValue)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {row.lastGrnDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    {rows.reduce((s, r) => s + r.grnCount, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(totalValue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
