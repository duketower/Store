import { useState, useEffect } from 'react'
import { RotateCcw, Plus, Search, Trash2, Printer } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { getAllRtvs, getRtvItems, createRtvTransaction } from '@/db/queries/rtvs'
import { searchProducts, getProductByBarcode } from '@/db/queries/products'
import { getBatchesForProduct } from '@/db/queries/batches'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'
import { useAuth } from '@/hooks/useAuth'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { formatDate, formatDateTime } from '@/utils/date'
import { loadStoreConfig } from '@/utils/storeConfig'
import type { Product, Batch, RtvSession, RtvItem } from '@/types'

interface RtvLine {
  productId: number
  productName: string
  batchId: number
  batchNo: string
  availableQty: number
  qty: number
  purchasePrice: number
}

export function RtvTab() {
  const [loading, setLoading] = useState(false)
  const [rtvData, setRtvData] = useState<RtvSession[] | null>(null)
  const [viewRtvId, setViewRtvId] = useState<number | null>(null)
  const [viewRtvItems, setViewRtvItems] = useState<Array<RtvItem & { productName: string }> | null>(null)
  const [viewRtvSession, setViewRtvSession] = useState<RtvSession | null>(null)
  const [viewRtvCreatorName, setViewRtvCreatorName] = useState('')
  const [newRtvOpen, setNewRtvOpen] = useState(false)
  const [rtvVendor, setRtvVendor] = useState('')
  const [rtvInvoiceNo, setRtvInvoiceNo] = useState('')
  const [rtvReason, setRtvReason] = useState('')
  const [rtvLines, setRtvLines] = useState<RtvLine[]>([])
  const [rtvProductSearch, setRtvProductSearch] = useState('')
  const [rtvProductResults, setRtvProductResults] = useState<Product[]>([])
  const [rtvBatchMap, setRtvBatchMap] = useState<Record<number, Batch[]>>({})
  const [rtvSaving, setRtvSaving] = useState(false)

  const { employeeId } = useAuth()
  const STORE_CONFIG = loadStoreConfig()

  useBarcodeScanner({
    onScan: async (barcode: string) => {
      if (!newRtvOpen) return
      const product = await getProductByBarcode(barcode)
      if (!product) return
      await addRtvLine(product)
    },
    enabled: newRtvOpen,
  })

  useEffect(() => {
    loadRtvReport()
  }, [])

  const loadRtvReport = async () => {
    setLoading(true)
    try {
      const rtvs = await getAllRtvs()
      setRtvData(rtvs)
    } finally {
      setLoading(false)
    }
  }

  const openRtvDetail = async (rtvId: number) => {
    const session = rtvData?.find((r) => r.id === rtvId) ?? null
    setViewRtvSession(session)
    setViewRtvId(rtvId)
    setViewRtvItems(null)
    const items = await getRtvItems(rtvId)
    setViewRtvItems(items)
    if (session?.createdBy) {
      const emp = await db.employees.get(session.createdBy)
      setViewRtvCreatorName(emp?.name ?? `Employee #${session.createdBy}`)
    }
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

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setNewRtvOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> New RTV
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : rtvData && rtvData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <RotateCcw size={32} className="mx-auto mb-3 opacity-30" />
          <p>No return-to-vendor records yet</p>
        </div>
      ) : rtvData ? (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">RTV ID</th>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rtvData.map((rtv) => (
                <tr key={rtv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openRtvDetail(rtv.id!)}
                      className="font-mono text-sm font-bold text-orange-700 hover:underline"
                    >
                      RTV-{String(rtv.id).padStart(4, '0')}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDateTime(new Date(rtv.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{rtv.vendorName ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{rtv.reason}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{rtv.lineCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(rtv.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* RTV Slip Modal */}
      {viewRtvId !== null && (
        <Modal open onClose={() => { setViewRtvId(null); setViewRtvItems(null); setViewRtvSession(null) }} title="" size="lg">
          {viewRtvItems === null ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
          ) : viewRtvSession && (
            <div>
              {/* Print button */}
              <div className="mb-4 flex justify-end print:hidden">
                <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
                  <Printer size={16} /> Print Slip
                </button>
              </div>

              {/* Slip */}
              <div className="border border-gray-300 rounded-lg p-6 space-y-4 font-mono text-sm">
                {/* Header */}
                <div className="text-center space-y-1 border-b border-dashed border-gray-400 pb-4">
                  <p className="text-base font-bold text-gray-900 not-italic">{STORE_CONFIG.name}</p>
                  <p className="text-lg font-bold tracking-widest text-gray-800">RETURN TO VENDOR</p>
                  <p className="text-xs text-gray-500 font-bold tracking-wide">RTV-{String(viewRtvSession.id).padStart(4, '0')}</p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div><span className="text-gray-500">To Vendor: </span><span className="font-bold">{viewRtvSession.vendorName ?? '—'}</span></div>
                  <div><span className="text-gray-500">Date: </span><span className="font-bold">{formatDate(new Date(viewRtvSession.createdAt))}</span></div>
                  {viewRtvSession.invoiceNo && (
                    <div><span className="text-gray-500">Ref Invoice: </span><span className="font-bold">{viewRtvSession.invoiceNo}</span></div>
                  )}
                  <div><span className="text-gray-500">Prepared by: </span><span className="font-bold">{viewRtvCreatorName}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Reason: </span><span className="font-bold">{viewRtvSession.reason}</span></div>
                </div>

                {/* Items table */}
                <table className="w-full text-xs border-collapse mt-2">
                  <thead>
                    <tr className="border-b-2 border-gray-400">
                      <th className="py-1.5 text-left text-gray-600 font-semibold">#</th>
                      <th className="py-1.5 text-left text-gray-600 font-semibold">Product</th>
                      <th className="py-1.5 text-left text-gray-600 font-semibold">Batch No</th>
                      <th className="py-1.5 text-right text-gray-600 font-semibold">Qty</th>
                      <th className="py-1.5 text-right text-gray-600 font-semibold">Rate (₹)</th>
                      <th className="py-1.5 text-right text-gray-600 font-semibold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewRtvItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-1.5">{idx + 1}</td>
                        <td className="py-1.5">{item.productName}</td>
                        <td className="py-1.5">{item.batchNo}</td>
                        <td className="py-1.5 text-right">{item.qty}</td>
                        <td className="py-1.5 text-right">{item.purchasePrice.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-semibold">{(item.purchasePrice * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-400">
                      <td colSpan={5} className="py-2 text-right font-bold text-gray-700">Total Return Value:</td>
                      <td className="py-2 text-right font-bold text-base">₹{viewRtvItems.reduce((s, i) => s + i.purchasePrice * i.qty, 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signature lines */}
                <div className="grid grid-cols-2 gap-12 pt-10 text-xs text-gray-500">
                  <div className="border-t border-gray-500 pt-1 text-center">Authorised Signatory (Store)</div>
                  <div className="border-t border-gray-500 pt-1 text-center">Vendor Acknowledgement & Stamp</div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* New RTV Modal */}
      {newRtvOpen && (
        <Modal open onClose={() => { setNewRtvOpen(false); setRtvLines([]); setRtvVendor(''); setRtvInvoiceNo(''); setRtvReason(''); setRtvProductSearch(''); setRtvProductResults([]) }} title="New Return to Vendor" size="lg">
          <div className="space-y-4">
            {/* Scanner indicator */}
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Scanner ready — scan barcode to add product instantly
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vendor / Supplier</label>
                <input type="text" value={rtvVendor} onChange={(e) => setRtvVendor(e.target.value)}
                  placeholder="Vendor name…" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Ref <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={rtvInvoiceNo} onChange={(e) => setRtvInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-2024-001" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason for Return *</label>
              <input type="text" value={rtvReason} onChange={(e) => setRtvReason(e.target.value)}
                placeholder="e.g. Damaged goods, Wrong item, Near expiry…" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
            </div>

            {/* Product search */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Add Products to Return</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" value={rtvProductSearch} onChange={(e) => handleRtvProductSearch(e.target.value)}
                  placeholder="Search product by name, SKU or barcode…"
                  className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
              </div>
              {rtvProductResults.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto">
                  {rtvProductResults.map((p) => (
                    <button key={p.id} onClick={() => addRtvLine(p)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left">
                      <span className="text-sm text-gray-800">{p.name}</span>
                      <span className="text-xs text-gray-400">Stock: {p.stock} {p.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RTV Lines */}
            {rtvLines.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-left w-36">Batch</th>
                      <th className="px-3 py-2 text-right w-24">Qty</th>
                      <th className="px-3 py-2 text-right w-28">Price</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rtvLines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{line.productName}</td>
                        <td className="px-3 py-2">
                          <select value={line.batchId}
                            onChange={(e) => handleRtvBatchChange(idx, parseInt(e.target.value, 10))}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none">
                            {(rtvBatchMap[line.productId] ?? []).map((b) => (
                              <option key={b.id} value={b.id}>{b.batchNo} (avail: {b.qtyRemaining})</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={line.qty} min={0.001} max={line.availableQty} step={0.001}
                            onChange={(e) => updateRtvLine(idx, { qty: Math.min(parseFloat(e.target.value) || 0, line.availableQty) })}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-right focus:border-brand-500 focus:outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={line.purchasePrice || ''} min={0} step={0.01}
                            onChange={(e) => updateRtvLine(idx, { purchasePrice: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-right focus:border-brand-500 focus:outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => setRtvLines((prev) => prev.filter((_, i) => i !== idx))}
                            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-gray-100 px-3 py-2 flex justify-end">
                  <span className="text-sm font-semibold text-gray-900">
                    Total: {formatCurrency(rtvLines.reduce((s, l) => s + l.purchasePrice * l.qty, 0))}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setNewRtvOpen(false); setRtvLines([]); setRtvVendor(''); setRtvInvoiceNo(''); setRtvReason(''); setRtvProductSearch(''); setRtvProductResults([]) }}
                className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRtvSave}
                disabled={rtvSaving || rtvLines.length === 0 || !rtvReason.trim()}
                className="btn-primary flex-1">
                {rtvSaving ? 'Saving…' : 'Save RTV'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
