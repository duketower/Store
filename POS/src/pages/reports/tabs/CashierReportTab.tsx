import { useState, useEffect } from 'react'
import { Download, Users } from 'lucide-react'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'

type RangeOption = 'today' | 'last7' | 'last30' | 'custom'

interface CashierStat {
  cashierId: number
  name: string
  totalBills: number
  totalRevenue: number
  avgBillValue: number
  cashCollected: number
  upiCollected: number
}

function getRangeDates(range: RangeOption, customFrom: string, customTo: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (range === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
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
  // custom
  const start = new Date(customFrom)
  start.setHours(0, 0, 0, 0)
  const customEnd = new Date(customTo)
  customEnd.setHours(23, 59, 59, 999)
  return { start, end: customEnd }
}

export function CashierReportTab() {
  const [range, setRange] = useState<RangeOption>('today')
  const [customFrom, setCustomFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<CashierStat[]>([])

  useEffect(() => {
    loadData()
  }, [range, customFrom, customTo])

  const loadData = async () => {
    if (range === 'custom' && (!customFrom || !customTo)) return
    setLoading(true)
    try {
      const { start, end } = getRangeDates(range, customFrom, customTo)

      const sales = await db.sales
        .filter((s) => s.createdAt >= start && s.createdAt <= end)
        .toArray()

      if (sales.length === 0) {
        setStats([])
        return
      }

      // Group by cashierId
      const cashierMap = new Map<number, { bills: number; revenue: number; cash: number; upi: number }>()
      for (const sale of sales) {
        const existing = cashierMap.get(sale.cashierId) ?? { bills: 0, revenue: 0, cash: 0, upi: 0 }
        existing.bills += 1
        existing.revenue += sale.grandTotal

        const payments = await db.payments.where('saleId').equals(sale.id!).toArray()
        for (const p of payments) {
          if (p.method === 'cash') existing.cash += p.amount
          else if (p.method === 'upi') existing.upi += p.amount
        }
        cashierMap.set(sale.cashierId, existing)
      }

      // Fetch employee names
      const cashierIds = Array.from(cashierMap.keys())
      const employees = await db.employees
        .filter((e) => cashierIds.includes(e.id!))
        .toArray()
      const nameMap = new Map(employees.map((e) => [e.id!, e.name]))

      const result: CashierStat[] = Array.from(cashierMap.entries())
        .map(([cashierId, s]) => ({
          cashierId,
          name: nameMap.get(cashierId) ?? `Staff #${cashierId}`,
          totalBills: s.bills,
          totalRevenue: s.revenue,
          avgBillValue: s.bills > 0 ? s.revenue / s.bills : 0,
          cashCollected: s.cash,
          upiCollected: s.upi,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)

      setStats(result)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (stats.length === 0) return
    const headers = ['Name', 'Total Bills', 'Total Revenue', 'Avg Bill Value', 'Cash Collected', 'UPI Collected']
    const rows = stats.map((s) => [
      `"${s.name}"`,
      s.totalBills,
      s.totalRevenue.toFixed(2),
      s.avgBillValue.toFixed(2),
      s.cashCollected.toFixed(2),
      s.upiCollected.toFixed(2),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cashier-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const topCashierId = stats.length > 0 ? stats[0].cashierId : null

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['today', 'last7', 'last30', 'custom'] as RangeOption[]).map((opt) => {
            const labels: Record<RangeOption, string> = {
              today: 'Today',
              last7: 'Last 7 days',
              last30: 'Last 30 days',
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
          disabled={stats.length === 0}
          className="ml-auto btn-secondary flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : stats.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-gray-400">
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No billing activity for the selected period</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Cashier</th>
                <th className="px-4 py-3 text-right">Bills</th>
                <th className="px-4 py-3 text-right">Total Revenue</th>
                <th className="px-4 py-3 text-right">Avg Bill</th>
                <th className="px-4 py-3 text-right">Cash</th>
                <th className="px-4 py-3 text-right">UPI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.map((s) => {
                const isTop = s.cashierId === topCashierId
                return (
                  <tr key={s.cashierId} className={isTop ? 'bg-green-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isTop ? 'text-green-800' : 'text-gray-900'}`}>
                          {s.name}
                        </span>
                        {isTop && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Top
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{s.totalBills}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isTop ? 'text-green-700' : 'text-gray-900'}`}>
                      {formatCurrency(s.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(s.avgBillValue)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(s.cashCollected)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(s.upiCollected)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
