import { useState, useEffect, useMemo } from 'react'
import { BarChart3, Package, AlertTriangle, Download, Receipt, Truck, CreditCard, CheckCircle, Search, X, RotateCcw, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import { Receipt as ReceiptView } from '@/pages/billing/components/Receipt'
import { getAllProducts, searchProducts, getLowStockProducts } from '@/db/queries/products'
import { getNearExpiryBatches, getBatchesForProduct } from '@/db/queries/batches'
import { getSaleWithItems, processReturn, type ReturnItem } from '@/db/queries/sales'
import { getAllCustomers, updateCreditBalance, addCreditLedgerEntry } from '@/db/queries/customers'
import { getAllGrns, getGrnBatches } from '@/db/queries/grns'
import { getAllRtvs, getRtvItems, createRtvTransaction } from '@/db/queries/rtvs'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'
import { NEAR_EXPIRY_DAYS } from '@/constants/app'
import { useAuth } from '@/hooks/useAuth'
import type { Product, Sale, SaleItem, Payment, Batch, Customer, CreditLedgerEntry, Grn, RtvSession, RtvItem } from '@/types'

type ReportTab = 'sales' | 'stock' | 'bills' | 'grn' | 'rtv' | 'credit'

interface BillRow {
  sale: Sale
  paymentSummary: string
  cashierName: string
  customerName?: string
  customerPhone?: string
}

interface RtvLine {
  productId: number
  productName: string
  batchId: number
  batchNo: string
  availableQty: number
  qty: number
  purchasePrice: number
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('sales')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [salesData, setSalesData] = useState<SalesReportData | null>(null)
  const [stockData, setStockData] = useState<StockReportData | null>(null)
  const [billsData, setBillsData] = useState<BillRow[] | null>(null)
  const [grnListData, setGrnListData] = useState<Grn[] | null>(null)
  const [viewGrnId, setViewGrnId] = useState<number | null>(null)
  const [viewGrnBatches, setViewGrnBatches] = useState<Array<Batch & { productName: string }> | null>(null)
  const [rtvData, setRtvData] = useState<RtvSession[] | null>(null)
  const [viewRtvId, setViewRtvId] = useState<number | null>(null)
  const [viewRtvItems, setViewRtvItems] = useState<Array<RtvItem & { productName: string }> | null>(null)
  const [newRtvOpen, setNewRtvOpen] = useState(false)
  const [rtvVendor, setRtvVendor] = useState('')
  const [rtvInvoiceNo, setRtvInvoiceNo] = useState('')
  const [rtvReason, setRtvReason] = useState('')
  const [rtvLines, setRtvLines] = useState<RtvLine[]>([])
  const [rtvProductSearch, setRtvProductSearch] = useState('')
  const [rtvProductResults, setRtvProductResults] = useState<Product[]>([])
  const [rtvBatchMap, setRtvBatchMap] = useState<Record<number, Batch[]>>({})
  const [rtvSaving, setRtvSaving] = useState(false)
  const [creditDebtors, setCreditDebtors] = useState<Customer[] | null>(null)
  const [creditLedger, setCreditLedger] = useState<Array<CreditLedgerEntry & { customerName: string }> | null>(null)
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [collectCustomer, setCollectCustomer] = useState<Customer | null>(null)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectSaving, setCollectSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returnBill, setReturnBill] = useState<BillRow | null>(null)
  const [returnItems, setReturnItems] = useState<Array<{ item: ReturnItem & { productName: string }; selected: boolean; returnQty: number }>>([])
  const [returnReason, setReturnReason] = useState('')
  const [returnSaving, setReturnSaving] = useState(false)
  const [viewReceiptData, setViewReceiptData] = useState<{
    sale: Sale; items: Array<SaleItem & { productName: string; unit: string }>; payments: Payment[]; cashierName: string
  } | null>(null)
  const [viewGrnInvoice, setViewGrnInvoice] = useState<string | null>(null)
  const { employeeId } = useAuth()

  // Bills filters
  const [billSearch, setBillSearch] = useState('')
  const [billDateFrom, setBillDateFrom] = useState('')
  const [billDateTo, setBillDateTo] = useState('')
  const [billPayMethod, setBillPayMethod] = useState('')
  const [billSort, setBillSort] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc')

  useEffect(() => {
    if (tab === 'sales') loadSalesReport()
    else if (tab === 'stock') loadStockReport()
    else if (tab === 'bills') loadBillsReport()
    else if (tab === 'grn') loadGrnListReport()
    else if (tab === 'rtv') loadRtvReport()
    else if (tab === 'credit') loadCreditReport()
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

  const loadGrnListReport = async () => {
    setLoading(true)
    try {
      const grns = await getAllGrns()
      setGrnListData(grns)
    } finally {
      setLoading(false)
    }
  }

  const loadRtvReport = async () => {
    setLoading(true)
    try {
      const rtvs = await getAllRtvs()
      setRtvData(rtvs)
    } finally {
      setLoading(false)
    }
  }

  const loadCreditReport = async () => {
    setLoading(true)
    try {
      const customers = await getAllCustomers()
      const debtors = customers
        .filter((c) => c.currentBalance > 0)
        .sort((a, b) => b.currentBalance - a.currentBalance)
      setCreditDebtors(debtors)

      const customerMap: Record<number, string> = {}
      customers.forEach((c) => { customerMap[c.id!] = c.name })

      const allEntries = await db.credit_ledger.orderBy('createdAt').reverse().toArray()
      setCreditLedger(allEntries.map((e) => ({ ...e, customerName: customerMap[e.customerId] ?? `#${e.customerId}` })))
    } finally {
      setLoading(false)
    }
  }

  const openCollect = (customer: Customer) => {
    setCollectCustomer(customer)
    setCollectAmount('')
    setCollectModalOpen(true)
  }

  const handleCollect = async () => {
    if (!collectCustomer?.id) return
    const amount = parseFloat(collectAmount)
    if (!amount || amount <= 0) return
    setCollectSaving(true)
    try {
      const applied = Math.min(amount, collectCustomer.currentBalance)
      await updateCreditBalance(collectCustomer.id, -applied)
      await addCreditLedgerEntry({
        customerId: collectCustomer.id,
        entryType: 'credit',
        amount: applied,
        notes: 'Cash collection',
        createdAt: new Date(),
      })
      setCollectModalOpen(false)
      await loadCreditReport()
    } finally {
      setCollectSaving(false)
    }
  }

  const exportCreditCSV = () => {
    if (!creditDebtors) return
    const headers = ['Customer', 'Phone', 'Outstanding (₹)', 'Credit Limit', '% Used']
    const rows = creditDebtors.map((c) => [
      c.name,
      c.phone ?? '',
      c.currentBalance.toFixed(2),
      c.creditLimit.toFixed(2),
      ((c.currentBalance / c.creditLimit) * 100).toFixed(1) + '%',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credit-outstanding-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

  const openGrnDetail = async (grnId: number) => {
    setViewGrnId(grnId)
    const batches = await getGrnBatches(grnId)
    setViewGrnBatches(batches)
  }

  const openRtvDetail = async (rtvId: number) => {
    setViewRtvId(rtvId)
    const items = await getRtvItems(rtvId)
    setViewRtvItems(items)
  }

  const handleRtvProductSearch = async (q: string) => {
    setRtvProductSearch(q)
    if (q.trim().length < 1) { setRtvProductResults([]); return }
    const res = await searchProducts(q)
    setRtvProductResults(res)
  }

  const addRtvLine = async (product: Product) => {
    setRtvProductSearch('')
    setRtvProductResults([])
    const batches = await getBatchesForProduct(product.id!)
    const available = batches.filter((b) => b.qtyRemaining > 0)
    if (available.length === 0) return
    const firstBatch = available[0]
    setRtvBatchMap((prev) => ({ ...prev, [product.id!]: available }))
    setRtvLines((prev) => [
      ...prev,
      {
        productId: product.id!,
        productName: product.name,
        batchId: firstBatch.id!,
        batchNo: firstBatch.batchNo,
        availableQty: firstBatch.qtyRemaining,
        qty: 1,
        purchasePrice: firstBatch.purchasePrice,
      },
    ])
  }

  const updateRtvLine = (idx: number, patch: Partial<RtvLine>) => {
    setRtvLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const handleRtvBatchChange = (idx: number, batchId: number) => {
    const line = rtvLines[idx]
    const batches = rtvBatchMap[line.productId] ?? []
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return
    updateRtvLine(idx, {
      batchId: batch.id!,
      batchNo: batch.batchNo,
      availableQty: batch.qtyRemaining,
      purchasePrice: batch.purchasePrice,
      qty: Math.min(rtvLines[idx].qty, batch.qtyRemaining),
    })
  }

  const handleRtvSave = async () => {
    if (rtvLines.length === 0 || !rtvReason.trim()) return
    for (const line of rtvLines) {
      if (line.qty <= 0 || line.qty > line.availableQty) return
    }
    setRtvSaving(true)
    try {
      await createRtvTransaction(
        {
          vendorName: rtvVendor.trim() || undefined,
          invoiceNo: rtvInvoiceNo.trim() || undefined,
          reason: rtvReason.trim(),
          createdAt: new Date(),
          createdBy: employeeId ?? 0,
          totalValue: rtvLines.reduce((s, l) => s + l.purchasePrice * l.qty, 0),
          lineCount: rtvLines.length,
        },
        rtvLines.map((l) => ({
          productId: l.productId,
          batchId: l.batchId,
          batchNo: l.batchNo,
          qty: l.qty,
          purchasePrice: l.purchasePrice,
        }))
      )
      setNewRtvOpen(false)
      setRtvVendor('')
      setRtvInvoiceNo('')
      setRtvReason('')
      setRtvLines([])
      setRtvBatchMap({})
      await loadRtvReport()
    } finally {
      setRtvSaving(false)
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
      }
    })
    return rows
  }, [billsData, billSearch, billDateFrom, billDateTo, billPayMethod, billSort])

  const billFiltersActive = billSearch || billDateFrom || billDateTo || billPayMethod || billSort !== 'date_desc'

  return (
    <PageContainer title="Reports">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {([
          { id: 'sales', label: 'Daily Sales', icon: <BarChart3 size={15} /> },
          { id: 'stock', label: 'Stock Levels', icon: <Package size={15} /> },
          { id: 'bills', label: 'All Bills', icon: <Receipt size={15} /> },
          { id: 'grn', label: 'GRN History', icon: <Truck size={15} /> },
          { id: 'rtv', label: 'RTV', icon: <RotateCcw size={15} /> },
          { id: 'credit', label: 'Credit', icon: <CreditCard size={15} /> },
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
                  className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <input type="date" value={billDateFrom} onChange={(e) => setBillDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
              <input type="date" value={billDateTo} onChange={(e) => setBillDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(['', 'cash', 'upi', 'card', 'credit'] as const).map((m) => (
                <button key={m} onClick={() => setBillPayMethod(m)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${billPayMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                  {m === '' ? 'All' : m.toUpperCase()}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <select value={billSort} onChange={(e) => setBillSort(e.target.value as typeof billSort)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none">
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
                        <button onClick={() => openReceipt(row)} className="font-mono text-sm font-medium text-blue-700 hover:underline">
                          {row.sale.billNo}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date(row.sale.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
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
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.sale.grandTotal)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{row.paymentSummary}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openReturn(row)} className="text-xs text-blue-600 hover:underline">Return</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GRN History */}
      {tab === 'grn' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={grnSearch}
                onChange={(e) => setGrnSearch(e.target.value)}
                placeholder="Search product, batch no, vendor or invoice no…"
                className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {([
                { val: '', label: 'All' },
                { val: 'active', label: 'Active' },
                { val: 'near_expiry', label: 'Near Expiry' },
                { val: 'expired', label: 'Expired' },
                { val: 'depleted', label: 'Depleted' },
              ]).map(({ val, label }) => (
                <button key={val} onClick={() => setGrnStatus(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${grnStatus === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                  {label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <select value={grnSort} onChange={(e) => setGrnSort(e.target.value as typeof grnSort)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none">
                  <option value="date_desc">Newest received</option>
                  <option value="date_asc">Oldest received</option>
                  <option value="expiry_asc">Expiry soonest</option>
                  <option value="expiry_desc">Expiry latest</option>
                  <option value="product_asc">Product A→Z</option>
                </select>
                {grnFiltersActive && (
                  <button onClick={() => { setGrnSearch(''); setGrnStatus(''); setGrnSort('date_desc') }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                    <X size={12} /> Clear
                  </button>
                )}
                <span className="text-xs text-gray-400">
                  {grnFiltersActive ? `${filteredGrn.length} of ${grnData?.length ?? 0}` : `${grnData?.length ?? 0} entries`}
                </span>
                <button onClick={exportGrnCSV} disabled={!grnData?.length} className="btn-secondary flex items-center gap-1 text-xs">
                  <Download size={12} /> CSV
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : grnData && grnData.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
              <Truck size={32} className="mx-auto mb-3 opacity-30" />
              <p>No GRN entries yet</p>
            </div>
          ) : filteredGrn.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p>No entries match your filters</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Batch No</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Invoice No</th>
                    <th className="px-4 py-3 text-left">Expiry</th>
                    <th className="px-4 py-3 text-right">Qty Remaining</th>
                    <th className="px-4 py-3 text-right">Purchase Price</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGrn.map((batch) => {
                    const expiry = new Date(batch.expiryDate)
                    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
                    const isExpired = daysLeft <= 0
                    const isNearExpiry = daysLeft > 0 && daysLeft <= NEAR_EXPIRY_DAYS
                    return (
                      <tr key={batch.id} className={isExpired ? 'bg-red-50' : isNearExpiry ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 font-medium text-gray-900">{batch.productName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{batch.batchNo}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{batch.vendor ?? <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3">
                          {batch.invoiceNo ? (
                            <button onClick={() => setViewGrnInvoice(batch.invoiceNo!)} className="font-mono text-xs text-blue-700 hover:underline">
                              {batch.invoiceNo}
                            </button>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
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
          )}
        </div>
      )}
      {/* Credit Tab */}
      {tab === 'credit' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {creditDebtors ? `${creditDebtors.length} customer${creditDebtors.length !== 1 ? 's' : ''} with outstanding credit` : ''}
            </p>
            <button onClick={exportCreditCSV} disabled={!creditDebtors?.length} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {/* Summary Card */}
          {creditDebtors && creditDebtors.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Total Outstanding"
                value={formatCurrency(creditDebtors.reduce((s, c) => s + c.currentBalance, 0))}
                highlight
              />
              <StatCard
                label="Debtors"
                value={String(creditDebtors.length)}
              />
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : creditDebtors && creditDebtors.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-400 opacity-60" />
              <p className="font-medium text-green-600">All clear — no pending credit</p>
            </div>
          ) : creditDebtors ? (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-right">Limit</th>
                    <th className="px-4 py-3 text-right">% Used</th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {creditDebtors.map((c) => {
                    const pct = c.creditLimit > 0 ? (c.currentBalance / c.creditLimit) * 100 : 0
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(c.currentBalance)}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(c.creditLimit)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${pct >= 90 ? 'text-red-600' : pct >= 60 ? 'text-amber-600' : 'text-gray-600'}`}>
                            {pct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openCollect(c)}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-1 hover:bg-green-100 transition-colors"
                          >
                            Collect
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Full Ledger */}
          {creditLedger && creditLedger.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Ledger</p>
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Note</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {creditLedger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{entry.customerName}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            entry.entryType === 'credit'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {entry.entryType === 'credit' ? 'Payment' : 'Sale'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{entry.notes ?? '—'}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${entry.entryType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.entryType === 'credit' ? '−' : '+'}{formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collect Payment Modal */}
      {collectModalOpen && collectCustomer && (
        <Modal open onClose={() => setCollectModalOpen(false)} title={`Collect Payment — ${collectCustomer.name}`} size="sm">
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-xs text-red-500 mb-1">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(collectCustomer.currentBalance)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount Collected (₹)</label>
              <input
                type="number"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                placeholder={`Max ${collectCustomer.currentBalance.toFixed(2)}`}
                min={0.01}
                max={collectCustomer.currentBalance}
                step={0.01}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCollectModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleCollect}
                disabled={collectSaving || !collectAmount || parseFloat(collectAmount) <= 0}
                className="btn-primary flex-1"
              >
                {collectSaving ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </div>
        </Modal>
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

      {/* GRN Invoice Detail Modal */}
      {viewGrnInvoice && (
        <Modal open onClose={() => setViewGrnInvoice(null)} title={`GRN — Invoice ${viewGrnInvoice}`} size="lg">
          <div className="space-y-3">
            {(() => {
              const invoiceBatches = (grnData ?? []).filter((b) => b.invoiceNo === viewGrnInvoice)
              const totalValue = invoiceBatches.reduce((s, b) => s + b.purchasePrice * b.qtyRemaining, 0)
              return (
                <>
                  <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          <th className="px-3 py-2 text-left">Product</th>
                          <th className="px-3 py-2 text-left">Batch No</th>
                          <th className="px-3 py-2 text-left">Expiry</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Purchase Price</th>
                          <th className="px-3 py-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoiceBatches.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">{b.productName}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-600">{b.batchNo}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">{new Date(b.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{b.qtyRemaining}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(b.purchasePrice)}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(b.purchasePrice * b.qtyRemaining)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm text-gray-500">{invoiceBatches.length} line(s) · Vendor: <span className="font-medium text-gray-700">{invoiceBatches[0]?.vendor ?? '—'}</span></span>
                    <span className="text-sm font-semibold text-gray-900">Total: {formatCurrency(totalValue)}</span>
                  </div>
                </>
              )
            })()}
          </div>
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
