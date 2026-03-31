import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { formatCurrency } from '@/utils/currency'

export interface SalesReportData {
  date: string
  totalBills: number
  totalSales: number
  cashTotal: number
  upiTotal: number
  creditTotal: number
  byHour: Array<{ hour: number; total: number }>
  gstByRate: Array<{ rate: number; taxAmount: number }>
}

interface SalesTabProps {
  reportDate: string
  onDateChange: (date: string) => void
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'bg-brand-50 border-brand-100' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-brand-600' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-brand-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

export { StatCard }

export function SalesTab({ reportDate, onDateChange }: SalesTabProps) {
  const allSales = useFirestoreDataStore((s) => s.sales)

  const salesData = useMemo((): SalesReportData => {
    const start = new Date(reportDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(reportDate)
    end.setHours(23, 59, 59, 999)

    const sales = allSales.filter((s) => {
      const t = new Date(s.createdAt)
      return t >= start && t <= end
    })

    let cashTotal = 0
    let upiTotal = 0
    let creditTotal = 0
    const hourMap: Record<number, number> = {}
    const gstMap: Record<number, number> = {}

    for (const sale of sales) {
      for (const p of sale.payments ?? []) {
        if (p.method === 'cash') cashTotal += p.amount
        else if (p.method === 'upi') upiTotal += p.amount
        else if (p.method === 'credit') creditTotal += p.amount
      }
      const hour = new Date(sale.createdAt).getHours()
      hourMap[hour] = (hourMap[hour] ?? 0) + sale.grandTotal

      for (const item of sale.items ?? []) {
        if (item.taxRate > 0) {
          const tax = item.lineTotal - item.lineTotal / (1 + item.taxRate / 100)
          gstMap[item.taxRate] = (gstMap[item.taxRate] ?? 0) + tax
        }
      }
    }

    return {
      date: reportDate,
      totalBills: sales.length,
      totalSales: sales.reduce((s, x) => s + x.grandTotal, 0),
      cashTotal,
      upiTotal,
      creditTotal,
      byHour: Object.entries(hourMap).map(([h, v]) => ({ hour: parseInt(h, 10), total: v })).sort((a, b) => a.hour - b.hour),
      gstByRate: Object.entries(gstMap).map(([r, t]) => ({ rate: parseInt(r, 10), taxAmount: t })),
    }
  }, [allSales, reportDate])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="date" value={reportDate} onChange={(e) => onDateChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
        <span className="text-sm text-gray-500">Showing sales for selected date</span>
      </div>

      {salesData.totalBills === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
          <p>No sales on {salesData.date}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Bills" value={String(salesData.totalBills)} />
            <StatCard label="Total Sales" value={formatCurrency(salesData.totalSales)} highlight />
            <StatCard label="Cash" value={formatCurrency(salesData.cashTotal)} />
            <StatCard label="UPI" value={formatCurrency(salesData.upiTotal)} />
          </div>

          {salesData.gstByRate.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">GST Collected by Slab</p>
              <div className="divide-y divide-gray-100">
                {salesData.gstByRate.map((g) => (
                  <div key={g.rate} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-600">GST {g.rate}% (CGST {g.rate/2}% + SGST {g.rate/2}%)</span>
                    <span className="font-medium">{formatCurrency(g.taxAmount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 text-sm font-semibold">
                  <span>Total GST</span>
                  <span>{formatCurrency(salesData.gstByRate.reduce((s, g) => s + g.taxAmount, 0))}</span>
                </div>
              </div>
            </div>
          )}

          {salesData.byHour.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Sales by Hour</p>
              <div className="divide-y divide-gray-100">
                {salesData.byHour.map((h) => (
                  <div key={h.hour} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-600">{h.hour.toString().padStart(2,'0')}:00 – {h.hour.toString().padStart(2,'0')}:59</span>
                    <span className="font-medium">{formatCurrency(h.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
