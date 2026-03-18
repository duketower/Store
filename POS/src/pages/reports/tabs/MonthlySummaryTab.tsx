import { useState, useEffect } from 'react'
import { Download, CalendarDays } from 'lucide-react'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'

interface DayRow {
  date: string          // YYYY-MM-DD
  dayLabel: string      // e.g. "Mon 03"
  bills: number
  revenue: number
  cash: number
  upi: number
  credit: number
}

function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = []
  const totalDays = new Date(year, month, 0).getDate()
  for (let d = 1; d <= totalDays; d++) {
    const mm = String(month).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    days.push(`${year}-${mm}-${dd}`)
  }
  return days
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' })
  const day = String(d.getDate()).padStart(2, '0')
  return `${weekday} ${day}`
}

function currentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function MonthlySummaryTab() {
  const { year: initYear, month: initMonth } = currentYearMonth()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DayRow[]>([])

  useEffect(() => {
    loadData()
  }, [year, month])

  const loadData = async () => {
    setLoading(true)
    try {
      const days = getDaysInMonth(year, month)
      const result: DayRow[] = []

      for (const dateStr of days) {
        const start = new Date(dateStr + 'T00:00:00')
        const end = new Date(dateStr + 'T23:59:59.999')

        const sales = await db.sales
          .filter((s) => s.createdAt >= start && s.createdAt <= end)
          .toArray()

        let cash = 0
        let upi = 0
        let credit = 0

        for (const sale of sales) {
          const payments = await db.payments.where('saleId').equals(sale.id!).toArray()
          for (const p of payments) {
            if (p.method === 'cash') cash += p.amount
            else if (p.method === 'upi') upi += p.amount
            else if (p.method === 'credit') credit += p.amount
          }
        }

        result.push({
          date: dateStr,
          dayLabel: formatDayLabel(dateStr),
          bills: sales.length,
          revenue: sales.reduce((s, x) => s + x.grandTotal, 0),
          cash,
          upi,
          credit,
        })
      }

      setRows(result)
    } finally {
      setLoading(false)
    }
  }

  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1)

  const totals = rows.reduce(
    (acc, r) => ({
      bills: acc.bills + r.bills,
      revenue: acc.revenue + r.revenue,
      cash: acc.cash + r.cash,
      upi: acc.upi + r.upi,
      credit: acc.credit + r.credit,
    }),
    { bills: 0, revenue: 0, cash: 0, upi: 0, credit: 0 }
  )

  const exportCSV = () => {
    const headers = ['Date', 'Day', 'Bills', 'Revenue', 'Cash', 'UPI', 'Credit']
    const dataRows = rows.map((r) => [
      r.date,
      r.dayLabel,
      r.bills,
      r.revenue.toFixed(2),
      r.cash.toFixed(2),
      r.upi.toFixed(2),
      r.credit.toFixed(2),
    ])
    const summaryRow = [
      `${year}-${String(month).padStart(2, '0')} TOTAL`,
      '',
      totals.bills,
      totals.revenue.toFixed(2),
      totals.cash.toFixed(2),
      totals.upi.toFixed(2),
      totals.credit.toFixed(2),
    ]
    const csv = [headers, ...dataRows, summaryRow]
      .map((row) => row.map((v) => `"${v}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monthly-summary-${year}-${String(month).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Build month/year selector options
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  // Show current year and two years back
  const yearOptions = [initYear - 2, initYear - 1, initYear]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-gray-400" />
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Day</th>
                <th className="px-4 py-3 text-right">Bills</th>
                <th className="px-4 py-3 text-left min-w-[140px]">Revenue</th>
                <th className="px-4 py-3 text-right">Cash</th>
                <th className="px-4 py-3 text-right">UPI</th>
                <th className="px-4 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const hasData = row.bills > 0
                const barWidth = row.revenue > 0 ? Math.round((row.revenue / maxRevenue) * 100) : 0
                return (
                  <tr key={row.date} className={hasData ? 'hover:bg-gray-50' : 'opacity-40'}>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-700">{row.dayLabel}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {hasData ? row.bills : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium min-w-[80px] text-right ${hasData ? 'text-gray-900' : 'text-gray-400'}`}>
                          {hasData ? formatCurrency(row.revenue) : '—'}
                        </span>
                        {hasData && barWidth > 0 && (
                          <div className="flex-1 max-w-[120px]">
                            <div
                              className="h-2 rounded-full bg-brand-400 opacity-70"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {hasData && row.cash > 0 ? formatCurrency(row.cash) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {hasData && row.upi > 0 ? formatCurrency(row.upi) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {hasData && row.credit > 0 ? formatCurrency(row.credit) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totals row */}
            <tfoot className="border-t-2 border-gray-300 bg-gray-50">
              <tr className="text-sm font-semibold text-gray-900">
                <td className="px-4 py-3">Month Total</td>
                <td className="px-4 py-3 text-right">{totals.bills}</td>
                <td className="px-4 py-3 font-bold text-brand-700">{formatCurrency(totals.revenue)}</td>
                <td className="px-4 py-3 text-right">{totals.cash > 0 ? formatCurrency(totals.cash) : '—'}</td>
                <td className="px-4 py-3 text-right">{totals.upi > 0 ? formatCurrency(totals.upi) : '—'}</td>
                <td className="px-4 py-3 text-right">{totals.credit > 0 ? formatCurrency(totals.credit) : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
