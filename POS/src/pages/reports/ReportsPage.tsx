import { useState, useEffect } from 'react'
import { BarChart3, Package, AlertTriangle, Download, Receipt, Truck } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import { getAllProducts } from '@/db/queries/products'
import { getNearExpiryBatches } from '@/db/queries/batches'
import { getSaleWithItems, processReturn, type ReturnItem } from '@/db/queries/sales'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'
import { NEAR_EXPIRY_DAYS } from '@/constants/app'
import { useAuth } from '@/hooks/useAuth'
import type { Product, Sale, Batch } from '@/types'

type ReportTab = 'sales' | 'stock' | 'bills' | 'grn'

interface BillRow {
  sale: Sale
  paymentSummary: string
  cashierName: string
}

interface GrnRow extends Batch {
  productName: string
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('sales')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [salesData, setSalesData] = useState<SalesReportData | null>(null)
  const [stockData, setStockData] = useState<StockReportData | null>(null)
  const [billsData, setBillsData] = useState<BillRow[] | null>(null)
  const [grnData, setGrnData] = useState<GrnRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returnBill, setReturnBill] = useState<BillRow | null>(null)
  const [returnItems, setReturnItems] = useState<Array<{ item: ReturnItem & { productName: string }; selected: boolean; returnQty: number }>>([])
  const [returnReason, setReturnReason] = useState('')
  const [returnSaving, setReturnSaving] = useState(false)
  const { employeeId } = useAuth()

  useEffect(() => {
    if (tab === 'sales') loadSalesReport()
    else if (tab === 'stock') loadStockReport()
    else if (tab === 'bills') loadBillsReport()
    else if (tab === 'grn') loadGrnReport()
  }, [tab, reportDate])

  const loadSalesReport = async () => {
    setLoading(true)
    try {
      const start = new Date(reportDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(reportDate)
      end.setHours(23, 59, 59, 999)

      const sales = await db.sales
        .filter((s) => s.createdAt >= start && s.createdAt <= end)
        .toArray()

      let cashTotal = 0
      let upiTotal = 0
      let creditTotal = 0
      const hourMap: Record<number, number> = {}
      const gstMap: Record<number, number> = {}

      for (const sale of sales) {
        const payments = await db.payments.where('saleId').equals(sale.id!).toArray()
        for (const p of payments) {
          if (p.method === 'cash') cashTotal += p.amount
          else if (p.method === 'upi') upiTotal += p.amount
          else if (p.method === 'credit') creditTotal += p.amount
        }
        const hour = sale.createdAt instanceof Date
          ? sale.createdAt.getHours()
          : new Date(sale.createdAt).getHours()
        hourMap[hour] = (hourMap[hour] ?? 0) + sale.grandTotal

        const items = await db.sale_items.where('saleId').equals(sale.id!).toArray()
        for (const item of items) {
          if (item.taxRate > 0) {
            const tax = item.lineTotal - item.lineTotal / (1 + item.taxRate / 100)
            gstMap[item.taxRate] = (gstMap[item.taxRate] ?? 0) + tax
          }
        }
      }

      setSalesData({
        date: reportDate,
        totalBills: sales.length,
        totalSales: sales.reduce((s, x) => s + x.grandTotal, 0),
        cashTotal,
        upiTotal,
        creditTotal,
        byHour: Object.entries(hourMap).map(([h, v]) => ({ hour: parseInt(h), total: v })).sort((a, b) => a.hour - b.hour),
        gstByRate: Object.entries(gstMap).map(([r, t]) => ({ rate: parseInt(r), taxAmount: t })),
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStockReport = async () => {
    setLoading(true)
    try {
      const [allProducts, nearExpiry] = await Promise.all([
        getAllProducts(),
        getNearExpiryBatches(NEAR_EXPIRY_DAYS),
      ])
      setStockData({ products: allProducts, nearExpiry })
    } finally {
      setLoading(false)
    }
  }

  const loadBillsReport = async () => {
    setLoading(true)
    try {
      const allSales = await db.sales.orderBy('createdAt').reverse().toArray()
      const employeeCache: Record<number, string> = {}

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

          return { sale, paymentSummary, cashierName: employeeCache[sale.cashierId] }
        })
      )
      setBillsData(rows)
    } finally {
      setLoading(false)
    }
  }

  const loadGrnReport = async () => {
    setLoading(true)
    try {
      const batches = await db.batches.orderBy('id').reverse().toArray()
      const productCache: Record<number, string> = {}

      const rows: GrnRow[] = await Promise.all(
        batches.map(async (batch) => {
          if (!productCache[batch.productId]) {
            const product = await db.products.get(batch.productId)
            productCache[batch.productId] = product?.name ?? `Product #${batch.productId}`
          }
          return { ...batch, productName: productCache[batch.productId] }
        })
      )
      setGrnData(rows)
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

  const exportBillsCSV = () => {
    if (!billsData) return
    const headers = ['Bill No', 'Date', 'Cashier', 'Total', 'Payments']
    const rows = billsData.map((r) => [
      r.sale.billNo,
      new Date(r.sale.createdAt).toLocaleString('en-IN'),
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
    const data = await getSaleWithItems(row.sale.id!)
    if (!data) return
    setReturnBill(row)
    setReturnItems(data.items.map((item) => ({
      item: { saleItemId: item.id!, productId: item.productId, qty: item.qty, unitPrice: item.unitPrice, lineTotal: item.lineTotal, productName: item.productName },
      selected: false,
      returnQty: item.qty,
    })))
    setReturnReason('')
    setReturnModalOpen(true)
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
        selected.map((r) => ({ ...r.item, qty: r.returnQty, lineTotal: r.item.unitPrice * r.returnQty })),
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

  const exportGrnCSV = () => {
    if (!grnData) return
    const headers = ['Product', 'Batch No', 'Mfg Date', 'Expiry Date', 'Qty Remaining', 'Purchase Price']
    const rows = grnData.map((b) => [
      b.productName,
      b.batchNo,
      b.mfgDate ? new Date(b.mfgDate).toLocaleDateString('en-IN') : '',
      new Date(b.expiryDate).toLocaleDateString('en-IN'),
      b.qtyRemaining,
      b.purchasePrice.toFixed(2),
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grn-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageContainer title="Reports">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {([
          { id: 'sales', label: 'Daily Sales', icon: <BarChart3 size={15} /> },
          { id: 'stock', label: 'Stock Levels', icon: <Package size={15} /> },
          { id: 'bills', label: 'All Bills', icon: <Receipt size={15} /> },
          { id: 'grn', label: 'GRN History', icon: <Truck size={15} /> },
        ] as { id: ReportTab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <span className="flex items-center gap-2">{t.icon}{t.label}</span>
          </button>
        ))}
      </div>

      {/* Sales Report */}
      {tab === 'sales' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            <span className="text-sm text-gray-500">Showing sales for selected date</span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : salesData ? (
            <>
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
            </>
          ) : null}
        </div>
      )}

      {/* Stock Report */}
      {tab === 'stock' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={exportStockCSV} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {stockData?.nearExpiry && stockData.nearExpiry.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-600" />
                <p className="text-sm font-semibold text-amber-700">Near-Expiry Batches (within {NEAR_EXPIRY_DAYS} days)</p>
              </div>
              <div className="divide-y divide-amber-100">
                {stockData.nearExpiry.map((b) => (
                  <div key={b.id} className="flex justify-between py-2 text-sm">
                    <div>
                      <span className="font-medium text-amber-800">{b.productName}</span>
                      <span className="text-amber-600 ml-2 text-xs">Batch {b.batchNo}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-700 font-medium">
                        Exp: {b.expiryDate instanceof Date ? b.expiryDate.toLocaleDateString('en-IN') : new Date(b.expiryDate).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-xs text-amber-600">{b.qtyRemaining} remaining</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
      )}

      {/* Bills History */}
      {tab === 'bills' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{billsData ? `${billsData.length} bills total` : ''}</p>
            <button onClick={exportBillsCSV} disabled={!billsData?.length} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : billsData && billsData.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
              <Receipt size={32} className="mx-auto mb-3 opacity-30" />
              <p>No bills yet</p>
            </div>
          ) : billsData ? (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Bill No</th>
                    <th className="px-4 py-3 text-left">Date & Time</th>
                    <th className="px-4 py-3 text-left">Cashier</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-left">Payment</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {billsData.map((row) => (
                    <tr key={row.sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-blue-700">{row.sale.billNo}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date(row.sale.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.cashierName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.sale.grandTotal)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{row.paymentSummary}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openReturn(row)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* GRN History */}
      {tab === 'grn' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{grnData ? `${grnData.length} batch entries` : ''}</p>
            <button onClick={exportGrnCSV} disabled={!grnData?.length} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : grnData && grnData.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
              <Truck size={32} className="mx-auto mb-3 opacity-30" />
              <p>No GRN entries yet</p>
            </div>
          ) : grnData ? (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Batch No</th>
                    <th className="px-4 py-3 text-left">Expiry</th>
                    <th className="px-4 py-3 text-right">Qty Remaining</th>
                    <th className="px-4 py-3 text-right">Purchase Price</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grnData.map((batch) => {
                    const expiry = new Date(batch.expiryDate)
                    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
                    const isExpired = daysLeft <= 0
                    const isNearExpiry = daysLeft > 0 && daysLeft <= NEAR_EXPIRY_DAYS
                    return (
                      <tr key={batch.id} className={isExpired ? 'bg-red-50' : isNearExpiry ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 font-medium text-gray-900">{batch.productName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{batch.batchNo}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {isExpired && <span className="ml-1 text-red-600 font-medium">(expired)</span>}
                          {isNearExpiry && <span className="ml-1 text-amber-600">({daysLeft}d left)</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{batch.qtyRemaining}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(batch.purchasePrice)}</td>
                        <td className="px-4 py-3 text-center">
                          {isExpired ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Expired</span>
                          ) : isNearExpiry ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Near Expiry</span>
                          ) : batch.qtyRemaining === 0 ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Depleted</span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
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
                    onChange={(e) => setReturnItems((prev) => prev.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x))}
                    className="rounded"
                  />
                  <span className="flex-1 text-sm text-gray-800">{r.item.productName}</span>
                  <span className="text-xs text-gray-400">max {r.item.qty}</span>
                  <input
                    type="number"
                    value={r.returnQty}
                    min={0.001}
                    max={r.item.qty}
                    step={0.001}
                    disabled={!r.selected}
                    onChange={(e) => setReturnItems((prev) => prev.map((x, i) => i === idx ? { ...x, returnQty: Math.min(parseFloat(e.target.value) || 0, r.item.qty) } : x))}
                    className="w-20 rounded border border-gray-200 px-2 py-1 text-xs text-right focus:outline-none disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Return Reason *</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Damaged product, Wrong item…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            {returnBill.sale.customerId && (
              <p className="text-xs text-blue-600">Refund will be credited to customer's account.</p>
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
    </PageContainer>
  )
}

interface SalesReportData {
  date: string
  totalBills: number
  totalSales: number
  cashTotal: number
  upiTotal: number
  creditTotal: number
  byHour: Array<{ hour: number; total: number }>
  gstByRate: Array<{ rate: number; taxAmount: number }>
}

interface StockReportData {
  products: Product[]
  nearExpiry: Array<{ id?: number; productName?: string; batchNo: string; expiryDate: Date; qtyRemaining: number }>
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-blue-600' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
