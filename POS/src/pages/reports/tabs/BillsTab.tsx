import { useState, useEffect, useMemo } from 'react'
import { Download, Receipt, Search, X } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { Receipt as ReceiptView } from '@/pages/billing/components/Receipt'
import { getSaleReturns, getSaleWithItems, processReturn, type ReturnItem } from '@/db/queries/sales'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { useAuth } from '@/hooks/useAuth'
import { roundCurrency } from '@/utils/numbers'
import type { Sale, SaleItem, Payment, Customer } from '@/types'

export interface BillRow {
  sale: Sale
  paymentSummary: string
  cashierName: string
  customerName?: string
  customerPhone?: string
}

export function BillsTab() {
  const [loading, setLoading] = useState(false)
  const [billsData, setBillsData] = useState<BillRow[] | null>(null)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returnBill, setReturnBill] = useState<BillRow | null>(null)
  const [returnItems, setReturnItems] = useState<Array<{
    item: ReturnItem & { productName: string }
    selected: boolean
    returnQty: number
    remainingQty: number
    returnedQty: number
  }>>([])
  const [returnReason, setReturnReason] = useState('')
  const [returnSaving, setReturnSaving] = useState(false)
  const [viewReceiptData, setViewReceiptData] = useState<{
    sale: Sale; items: Array<SaleItem & { productName: string; unit: string }>; payments: Payment[]; cashierName: string
  } | null>(null)

  // Filters
  const [billSearch, setBillSearch] = useState('')
  const [billDateFrom, setBillDateFrom] = useState('')
  const [billDateTo, setBillDateTo] = useState('')
  const [billPayMethod, setBillPayMethod] = useState('')
  const [billSort, setBillSort] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc')

  const { employeeId } = useAuth()

  useEffect(() => {
    loadBillsReport()
  }, [])

  const loadBillsReport = async () => {
    setLoading(true)
    try {
      const allSales = await db.sales.orderBy('createdAt').reverse().toArray()
      const employeeCache: Record<number, string> = {}
      const customerCache: Record<number, Customer> = {}

      const rows: BillRow[] = await Promise.all(
        allSales.map(async (sale) => {
          const payments = await db.payments.where('saleId').equals(sale.id!).toArray()
          const paymentSummary = payments
            .map((p) => `${p.method.toUpperCase()} ${formatCurrency(p.amount)}`)
            .join(', ')

          if (!employeeCache[sale.cashierId]) {
            const emp = await db.employees.get(sale.cashierId)
            employeeCache[sale.cashierId] = emp?.name ?? `#${sale.cashierId}`
          }

          let customerName: string | undefined
          let customerPhone: string | undefined
          if (sale.customerId) {
            if (!customerCache[sale.customerId]) {
              const c = await db.customers.get(sale.customerId)
              if (c) customerCache[sale.customerId] = c
            }
            const c = customerCache[sale.customerId]
            if (c) { customerName = c.name; customerPhone = c.phone }
          }

          return { sale, paymentSummary, cashierName: employeeCache[sale.cashierId], customerName, customerPhone }
        })
      )
      setBillsData(rows)
    } finally {
      setLoading(false)
    }
  }

  const exportBillsCSV = () => {
    if (!billsData) return
    const headers = ['Bill No', 'Date', 'Cashier', 'Total', 'Payments']
    const rows = billsData.map((r) => [
      r.sale.billNo,
      formatDateTime(new Date(r.sale.createdAt)),
      r.cashierName,
      r.sale.grandTotal.toFixed(2),
      r.paymentSummary,
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bills-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openReturn = async (row: BillRow) => {
    const [data, priorReturns] = await Promise.all([
      getSaleWithItems(row.sale.id!),
      getSaleReturns(row.sale.id!),
    ])
    if (!data) return

    const returnedQtyBySaleItem = new Map<number, number>()
    for (const returnEntry of priorReturns) {
      for (const item of returnEntry.items) {
        returnedQtyBySaleItem.set(
          item.saleItemId,
          (returnedQtyBySaleItem.get(item.saleItemId) ?? 0) + item.qty
        )
      }
    }

    setReturnBill(row)
    setReturnItems(data.items.map((item) => ({
      item: {
        saleItemId: item.id!,
        productId: item.productId,
        batchId: item.batchId,
        batchAllocations: item.batchAllocations,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        productName: item.productName,
      },
      selected: false,
      returnQty: Math.max(0, item.qty - (returnedQtyBySaleItem.get(item.id!) ?? 0)),
      remainingQty: Math.max(0, item.qty - (returnedQtyBySaleItem.get(item.id!) ?? 0)),
      returnedQty: returnedQtyBySaleItem.get(item.id!) ?? 0,
    })))
    setReturnReason('')
    setReturnModalOpen(true)
  }

  const openReceipt = async (row: BillRow) => {
    const data = await getSaleWithItems(row.sale.id!)
    if (!data) return
    setViewReceiptData({ ...data, cashierName: row.cashierName })
  }

  const handleReturn = async () => {
    if (!returnBill || !employeeId) return
    const selected = returnItems.filter((r) => r.selected && r.returnQty > 0)
    if (selected.length === 0) { return }
    if (!returnReason.trim()) { return }
    setReturnSaving(true)
    try {
      await processReturn(
        returnBill.sale.id!,
        returnBill.sale.billNo,
        selected.map((r) => ({
          ...r.item,
          qty: r.returnQty,
          lineTotal: roundCurrency((r.item.lineTotal / r.item.qty) * r.returnQty),
        })),
        returnReason,
        employeeId,
        returnBill.sale.customerId
      )
      setReturnModalOpen(false)
      await loadBillsReport()
    } catch {
      // silent
    } finally {
      setReturnSaving(false)
    }
  }

  const filteredBills = useMemo(() => {
    if (!billsData) return []
    let rows = [...billsData]
    if (billSearch.trim()) {
      const q = billSearch.toLowerCase()
      rows = rows.filter((r) =>
        r.sale.billNo.toLowerCase().includes(q) ||
        (r.customerName?.toLowerCase().includes(q) ?? false) ||
        (r.customerPhone?.includes(q) ?? false)
      )
    }
    if (billDateFrom) {
      const from = new Date(billDateFrom)
      rows = rows.filter((r) => new Date(r.sale.createdAt) >= from)
    }
    if (billDateTo) {
      const to = new Date(billDateTo); to.setHours(23, 59, 59, 999)
      rows = rows.filter((r) => new Date(r.sale.createdAt) <= to)
    }
    if (billPayMethod) {
      rows = rows.filter((r) => r.paymentSummary.toLowerCase().includes(billPayMethod))
    }
    rows.sort((a, b) => {
      switch (billSort) {
        case 'date_asc':   return new Date(a.sale.createdAt).getTime() - new Date(b.sale.createdAt).getTime()
        case 'date_desc':  return new Date(b.sale.createdAt).getTime() - new Date(a.sale.createdAt).getTime()
        case 'total_asc':  return a.sale.grandTotal - b.sale.grandTotal
        case 'total_desc': return b.sale.grandTotal - a.sale.grandTotal
        default:           return 0
      }
    })
    return rows
  }, [billsData, billSearch, billDateFrom, billDateTo, billPayMethod, billSort])

  const billFiltersActive = billSearch || billDateFrom || billDateTo || billPayMethod || billSort !== 'date_desc'

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
              placeholder="Search bill no, customer name or phone…"
              className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <input type="date" value={billDateFrom} onChange={(e) => setBillDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none" />
          <input type="date" value={billDateTo} onChange={(e) => setBillDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['', 'cash', 'upi', 'card', 'credit'] as const).map((m) => (
            <button key={m} onClick={() => setBillPayMethod(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${billPayMethod === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
              {m === '' ? 'All' : m.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <select value={billSort} onChange={(e) => setBillSort(e.target.value as typeof billSort)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none">
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="total_desc">Total ↓</option>
              <option value="total_asc">Total ↑</option>
            </select>
            {billFiltersActive && (
              <button onClick={() => { setBillSearch(''); setBillDateFrom(''); setBillDateTo(''); setBillPayMethod(''); setBillSort('date_desc') }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <X size={12} /> Clear
              </button>
            )}
            <span className="text-xs text-gray-400">
              {billFiltersActive ? `${filteredBills.length} of ${billsData?.length ?? 0}` : `${billsData?.length ?? 0} bills`}
            </span>
            <button onClick={exportBillsCSV} disabled={!billsData?.length} className="btn-secondary flex items-center gap-1 text-xs">
              <Download size={12} /> CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : billsData && billsData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <Receipt size={32} className="mx-auto mb-3 opacity-30" />
          <p>No bills yet</p>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p>No bills match your filters</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Bill No</th>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Cashier</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBills.map((row) => (
                <tr key={row.sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => openReceipt(row)} className="font-mono text-sm font-medium text-brand-700 hover:underline">
                      {row.sale.billNo}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {formatDateTime(new Date(row.sale.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.cashierName}</td>
                  <td className="px-4 py-3">
                    {row.customerName ? (
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{row.customerName}</p>
                        {row.customerPhone && <p className="text-xs text-gray-400">{row.customerPhone}</p>}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Walk-in</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(row.sale.grandTotal)}</p>
                    {(row.sale.returnTotal ?? 0) > 0 && (
                      <p className="text-[11px] text-amber-600">Returned {formatCurrency(row.sale.returnTotal ?? 0)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.paymentSummary}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openReturn(row)}
                      disabled={(row.sale.returnTotal ?? 0) >= row.sale.grandTotal}
                      className="text-xs text-brand-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                    >
                      {(row.sale.returnTotal ?? 0) >= row.sale.grandTotal ? 'Returned' : 'Return'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bill Receipt Modal */}
      {viewReceiptData && (
        <Modal open onClose={() => setViewReceiptData(null)} title={`Bill — ${viewReceiptData.sale.billNo}`} size="md">
          <ReceiptView
            sale={viewReceiptData.sale}
            items={viewReceiptData.items}
            payments={viewReceiptData.payments}
            cashierName={viewReceiptData.cashierName}
            onPrint={() => window.print()}
          />
        </Modal>
      )}

      {/* Return Modal */}
      {returnModalOpen && returnBill && (
        <Modal open onClose={() => setReturnModalOpen(false)} title={`Return — ${returnBill.sale.billNo}`} size="md">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Select items to return and enter quantity:</p>
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {returnItems.map((r, idx) => (
                <div key={idx} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={r.selected}
                    disabled={r.remainingQty <= 0}
                    onChange={(e) => setReturnItems((prev) => prev.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x))}
                    className="rounded"
                  />
                  <span className="flex-1 text-sm text-gray-800">{r.item.productName}</span>
                  <span className="text-xs text-gray-400">max {r.remainingQty}</span>
                  <input
                    type="number"
                    value={r.returnQty}
                    min={0.001}
                    max={r.remainingQty}
                    step={0.001}
                    disabled={!r.selected || r.remainingQty <= 0}
                    onChange={(e) => setReturnItems((prev) => prev.map((x, i) => i === idx ? { ...x, returnQty: Math.min(parseFloat(e.target.value) || 0, r.remainingQty) } : x))}
                    className="w-20 rounded border border-gray-200 px-2 py-1 text-xs text-right focus:outline-none disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
            {returnItems.some((item) => item.returnedQty > 0) && (
              <p className="text-xs text-amber-600">
                Previously returned quantities are excluded automatically so the same line item is not returned twice.
              </p>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Return Reason *</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Damaged product, Wrong item…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            {returnBill.sale.customerId && (
              <p className="text-xs text-brand-600">Refund will be credited to customer's account.</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setReturnModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleReturn}
                disabled={returnSaving || !returnReason.trim() || !returnItems.some((r) => r.selected && r.returnQty > 0)}
                className="btn-primary flex-1"
              >
                {returnSaving ? 'Processing…' : 'Process Return'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
