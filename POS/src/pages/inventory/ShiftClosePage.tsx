import { useEffect, useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DollarSign, TrendingUp, TrendingDown, Printer, CheckCircle, Hash } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuth } from '@/hooks/useAuth'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import { openSession, closeSession } from '@/db/queries/daySessions'
import { getTodaySales, getTodayCashTotal } from '@/db/queries/sales'
import { getTodayCashEntries, getTodayCashOutTotal } from '@/db/queries/cashEntries'
import { formatCurrency } from '@/utils/currency'
import { db } from '@/db'
import { exportShiftToSheets } from '@/services/sync/sheetsExport'
import { loadStoreConfig } from '@/utils/storeConfig'
import { CLIENT_CONFIG } from '@/constants/clientConfig'
import { hasFeature } from '@/constants/features'
import { subscribeShiftReport, type ShiftReport as SharedShiftReport } from '@/services/firebase/queries'

type ZReport = SharedShiftReport

export function ShiftClosePage() {
  const { session } = useAuth()
  const { currentSession, setCurrentSession } = useSessionStore()
  const { addToast } = useUiStore()

  const [closingCash, setClosingCash] = useState('')
  const [varianceNote, setVarianceNote] = useState('')
  const [closing, setClosing] = useState(false)
  const [opening, setOpening] = useState(false)
  const [openingFloat, setOpeningFloat] = useState('')
  const [closed, setClosed] = useState(false)
  const [showDenomCounter, setShowDenomCounter] = useState(false)
  const [denoms, setDenoms] = useState<Record<number, string>>({})
  const reportRef = useRef<HTMLDivElement>(null)
  const [sharedReport, setSharedReport] = useState<ZReport | null>(null)

  const localReport = useLiveQuery(async (): Promise<ZReport> => {
    const sales = await getTodaySales()
    const [cashTotal, cashOutTotal, cashEntries] = await Promise.all([
      getTodayCashTotal(),
      getTodayCashOutTotal(),
      getTodayCashEntries(),
    ])

    let upiTotal = 0
    let creditTotal = 0
    const productQtyMap: Record<number, { name: string; qty: number; total: number }> = {}
    const gstMap: Record<number, number> = {}

    for (const sale of sales) {
      const payments = await db.payments.where('saleId').equals(sale.id!).toArray()
      for (const payment of payments) {
        if (payment.method === 'upi') upiTotal += payment.amount
        if (payment.method === 'credit') creditTotal += payment.amount
      }
      const items = await db.sale_items.where('saleId').equals(sale.id!).toArray()
      for (const item of items) {
        if (!productQtyMap[item.productId]) {
          const product = await db.products.get(item.productId)
          productQtyMap[item.productId] = { name: product?.name ?? 'Unknown', qty: 0, total: 0 }
        }
        productQtyMap[item.productId].qty += item.qty
        productQtyMap[item.productId].total += item.lineTotal
        if (item.taxRate > 0) {
          const taxAmount = item.lineTotal - item.lineTotal / (1 + item.taxRate / 100)
          gstMap[item.taxRate] = (gstMap[item.taxRate] ?? 0) + taxAmount
        }
      }
    }

    const topProducts = Object.values(productQtyMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const gstByRate = Object.entries(gstMap).map(([rate, taxAmount]) => ({
      rate: parseInt(rate, 10),
      taxAmount,
    }))

    const openFloat = currentSession?.openingFloat ?? 0

    return {
      totalBills: sales.length,
      totalSales: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
      cashTotal,
      upiTotal,
      creditTotal,
      openingFloat: openFloat,
      cashOutTotal,
      cashEntries,
      expectedCash: openFloat + cashTotal - cashOutTotal,
      gstByRate,
      topProducts,
    }
  }, [currentSession?.id]) ?? null
  const report = sharedReport ?? localReport

  useEffect(() => {
    if (!currentSession || !hasFeature(CLIENT_CONFIG.plan, 'firebase_sync')) {
      setSharedReport(null)
      return
    }

    return subscribeShiftReport(currentSession, setSharedReport)
  }, [currentSession, setSharedReport])

  const DENOM_VALUES = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1]

  const denomTotal = DENOM_VALUES.reduce((sum, d) => {
    const count = parseInt(denoms[d] ?? '0', 10) || 0
    return sum + d * count
  }, 0)

  const applyDenomTotal = () => {
    setClosingCash(String(denomTotal))
  }

  const handleOpenShift = async () => {
    const float = parseFloat(openingFloat)
    if (isNaN(float) || float < 0) { addToast('error', 'Enter a valid opening float'); return }
    setOpening(true)
    try {
      const id = await openSession(session!.employeeId, float)
      const sess = await db.day_sessions.get(id)
      if (sess) setCurrentSession(sess)
      addToast('success', `Shift opened with ${formatCurrency(float)} float`)
    } catch {
      addToast('error', 'Failed to open shift')
    } finally {
      setOpening(false)
    }
  }

  const handleCloseShift = async () => {
    const entered = parseFloat(closingCash)
    if (isNaN(entered) || entered < 0) { addToast('error', 'Enter actual cash count'); return }
    if (!report) return

    const variance = entered - report.expectedCash
    if (variance < 0 && !varianceNote.trim()) {
      addToast('error', 'Please add a note explaining the cash shortage')
      return
    }

    setClosing(true)
    try {
      await closeSession(
        currentSession!.id!,
        session!.employeeId,
        entered,
        report.expectedCash,
        varianceNote || undefined
      )
      setCurrentSession(null)
      setClosed(true)
      addToast('success', 'Shift closed successfully')

      // Fire-and-forget export to Google Sheets (Pro+ feature only)
      const { sheetsWebAppUrl } = loadStoreConfig()
      const today = new Date().toISOString().slice(0, 10)
      const gstTotal = report.gstByRate.reduce((s, g) => s + g.taxAmount, 0)
      if (hasFeature(CLIENT_CONFIG.plan, 'sheets_export') && sheetsWebAppUrl) exportShiftToSheets(
        {
          date: today,
          cashierName: session!.name,
          totalBills: report.totalBills,
          totalSales: report.totalSales,
          cashTotal: report.cashTotal,
          upiTotal: report.upiTotal,
          creditTotal: report.creditTotal,
          openingFloat: report.openingFloat,
          closingCash: entered,
          expectedCash: report.expectedCash,
          variance,
          varianceNote: varianceNote || '',
          gstTotal,
        },
        sheetsWebAppUrl
      )
    } catch {
      addToast('error', 'Failed to close shift')
    } finally {
      setClosing(false)
    }
  }

  const variance = report ? parseFloat(closingCash || '0') - report.expectedCash : 0

  // No shift open
  if (!currentSession) {
    return (
      <PageContainer title="Shift Management" subtitle="Open or close daily shift">
        <div className="max-w-md">
          {closed ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle className="mx-auto mb-3 text-green-500" size={40} />
              <h3 className="text-lg font-semibold text-green-800">Shift Closed</h3>
              <p className="text-sm text-green-600 mt-1">Open a new shift to start the next day.</p>
            </div>
          ) : null}
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Open New Shift</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Float (₹)</label>
                <input type="number" value={openingFloat} min={0} step={1}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  placeholder="Cash in drawer at start of shift"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
              </div>
              <button onClick={handleOpenShift} disabled={opening} className="btn-primary w-full">
                {opening ? 'Opening…' : 'Open Shift'}
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Close Shift" subtitle="Cash reconciliation and Z-report">
      <div className="max-w-2xl space-y-4">
        {/* Cash reconciliation */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Cash Reconciliation</h3>

          {sharedReport ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              This shift-close report is using the shared synced shift data across devices. If another device is billing offline, its unsynced activity will appear after that device reconnects.
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              This shift-close report is currently using the local fallback data on this device. Reconnect once to pull the shared multi-device shift totals before final cash reconciliation.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoCard label="Opening Float" value={formatCurrency(currentSession.openingFloat)} />
            <InfoCard label="Cash Sales Today" value={formatCurrency(report?.cashTotal ?? 0)} />
            <InfoCard label="Cash Outs" value={`−${formatCurrency(report?.cashOutTotal ?? 0)}`} />
            <InfoCard label="Expected Cash" value={formatCurrency(report?.expectedCash ?? 0)} highlight />
          </div>

          {/* Denomination counter */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDenomCounter((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <span className="flex items-center gap-2">
                <Hash size={14} className="text-gray-400" />
                Count by Denomination
              </span>
              <span className="text-xs text-brand-600">
                {showDenomCounter ? 'Hide' : 'Use calculator'}
              </span>
            </button>

            {showDenomCounter && (
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {DENOM_VALUES.map((d) => (
                    <div key={d} className="flex items-center gap-2">
                      <span className="w-16 text-sm text-right font-mono text-gray-600 flex-shrink-0">₹{d}</span>
                      <span className="text-gray-300 text-xs">×</span>
                      <input
                        type="number"
                        min={0}
                        value={denoms[d] ?? ''}
                        onChange={(e) => setDenoms((prev) => ({ ...prev, [d]: e.target.value }))}
                        placeholder="0"
                        className="flex-1 min-w-0 rounded border border-gray-200 px-2 py-1 text-sm text-right focus:border-brand-500 focus:outline-none"
                      />
                      <span className="w-20 text-sm text-right text-gray-500 flex-shrink-0">
                        {d * (parseInt(denoms[d] ?? '0', 10) || 0) > 0
                          ? `= ₹${(d * (parseInt(denoms[d] ?? '0', 10) || 0)).toLocaleString()}`
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">
                    Total: ₹{denomTotal.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={applyDenomTotal}
                    className="btn-primary text-sm py-1"
                  >
                    Use this total
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cash in Drawer (₹)</label>
            <input type="number" value={closingCash} min={0} step={0.01}
              onChange={(e) => setClosingCash(e.target.value)}
              placeholder="Count and enter physical cash"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          </div>

          {closingCash !== '' && (
            <div className={`flex items-center gap-3 rounded-lg p-3 ${variance >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {variance >= 0
                ? <TrendingUp size={18} className="text-green-600" />
                : <TrendingDown size={18} className="text-red-600" />}
              <div>
                <p className={`font-semibold ${variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {variance >= 0 ? 'Over' : 'Short'}: {formatCurrency(Math.abs(variance))}
                </p>
                {variance < 0 && (
                  <p className="text-xs text-gray-500">Note required for any shortage</p>
                )}
              </div>
            </div>
          )}

          {closingCash !== '' && variance < 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shortage Note *</label>
              <textarea value={varianceNote} onChange={(e) => setVarianceNote(e.target.value)}
                rows={2} placeholder="Explain the shortage…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none" />
            </div>
          )}

          <button onClick={handleCloseShift} disabled={closing || !closingCash}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <DollarSign size={16} />
            {closing ? 'Closing…' : 'Close Shift & Generate Z-Report'}
          </button>
        </div>

        {/* Live Z-Report preview */}
        {report && (
          <div ref={reportRef} className="rounded-lg border border-gray-200 bg-white p-5 space-y-4 print:border-none print:p-0">
            <div className="flex items-center justify-between print:hidden">
              <h3 className="text-base font-semibold text-gray-900">Today's Summary (Z-Report Preview)</h3>
              <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm">
                <Printer size={14} />
                Print
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Total Bills" value={String(report.totalBills)} />
              <InfoCard label="Total Sales" value={formatCurrency(report.totalSales)} highlight />
              <InfoCard label="UPI Received" value={formatCurrency(report.upiTotal)} />
              <InfoCard label="Credit (Udhaar)" value={formatCurrency(report.creditTotal)} />
            </div>

            {report.gstByRate.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">GST Collected</p>
                <div className="rounded-lg bg-gray-50 divide-y divide-gray-100">
                  {report.gstByRate.map((g) => (
                    <div key={g.rate} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-gray-600">GST {g.rate}% (CGST {g.rate / 2}% + SGST {g.rate / 2}%)</span>
                      <span className="font-medium">{formatCurrency(g.taxAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.cashEntries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Cash Outs ({formatCurrency(report.cashOutTotal)})
                </p>
                <div className="rounded-lg bg-gray-50 divide-y divide-gray-100">
                  {report.cashEntries.map((e) => (
                    <div key={e.id} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-gray-600">{e.note || e.category}</span>
                      <span className="font-medium text-red-600">−{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.topProducts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Products</p>
                <div className="rounded-lg bg-gray-50 divide-y divide-gray-100">
                  {report.topProducts.map((p, i) => (
                    <div key={i} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-gray-600">{p.name}</span>
                      <span className="font-medium">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-brand-50 border border-brand-100' : 'bg-gray-50'}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-brand-600' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-brand-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
