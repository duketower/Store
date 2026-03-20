import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Save, Search } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import { searchProducts, getProductByBarcode } from '@/db/queries/products'
import { addBatch } from '@/db/queries/batches'
import { getActiveVendors } from '@/db/queries/vendors'
import { createGrn } from '@/db/queries/grns'
import { db } from '@/db'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { syncProductToFirestore, syncBatchToFirestore } from '@/services/firebase/sync'
import { formatCurrency } from '@/utils/currency'
import type { Product, Vendor } from '@/types'

interface GrnLine {
  product: Product
  batchNo: string
  mfgDate: string
  expiryDate: string
  purchasePrice: number
  qty: number
}

export function ReceiveStockPage() {
  const [vendorId, setVendorId] = useState<number | '' | 'other'>('')
  const [vendorFreeText, setVendorFreeText] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [lines, setLines] = useState<GrnLine[]>([])
  const [saving, setSaving] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { addToast } = useUiStore()
  const { employeeId } = useAuth()

  useEffect(() => {
    getActiveVendors().then(setVendors)
  }, [])

  const addLine = (product: Product) => {
    // Default batch no based on date
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    setLines((prev) => [
      ...prev,
      {
        product,
        batchNo: `${product.sku ?? 'B'}-${today}`,
        mfgDate: '',
        expiryDate: '',
        purchasePrice: 0,
        qty: 1,
      },
    ])
    setSearchOpen(false)
  }

  useBarcodeScanner({
    onScan: async (barcode: string) => {
      const product = await getProductByBarcode(barcode)
      if (!product) { addToast('warning', `No product found for barcode: ${barcode}`); return }
      addLine(product)
    },
    enabled: true,
  })

  const updateLine = (idx: number, patch: Partial<GrnLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (lines.length === 0) {
      addToast('error', 'Add at least one product')
      return
    }
    for (const line of lines) {
      if (!line.expiryDate) {
        addToast('error', `Expiry date required for ${line.product.name}`)
        return
      }
      if (line.qty <= 0) {
        addToast('error', `Qty must be > 0 for ${line.product.name}`)
        return
      }
    }

    setSaving(true)
    try {
      const synced: Array<{ batchId: number; productId: number }> = []
      const vendorName =
        vendorId === 'other' || vendorId === ''
          ? vendorFreeText.trim() || undefined
          : vendors.find((v) => v.id === vendorId)?.name

      let savedGrnId = 0
      await db.transaction('rw', [db.batches, db.products, db.grns], async () => {
        const grnId = await createGrn({
          vendorName,
          invoiceNo: invoiceNo.trim() || undefined,
          createdAt: new Date(),
          createdBy: employeeId ?? 0,
          totalValue: lines.reduce((s, l) => s + l.purchasePrice * l.qty, 0),
          lineCount: lines.length,
        })
        savedGrnId = grnId
        for (const line of lines) {
          const productId = line.product.id!
          const batchId = await addBatch({
            productId,
            batchNo: line.batchNo,
            mfgDate: line.mfgDate ? new Date(line.mfgDate) : undefined,
            expiryDate: new Date(line.expiryDate),
            purchasePrice: line.purchasePrice,
            qtyRemaining: line.qty,
            createdAt: new Date(),
            vendor: vendorName,
            invoiceNo: invoiceNo.trim() || undefined,
            grnId,
          })
          // Increment product stock
          await db.products
            .where('id')
            .equals(productId)
            .modify((p) => {
              p.stock += line.qty
              p.updatedAt = new Date()
            })
          synced.push({ batchId, productId })
        }
      })

      // Fire-and-forget: sync new batches + updated product stock to Firestore
      for (const { batchId, productId } of synced) {
        db.batches.get(batchId).then((b) => { if (b) syncBatchToFirestore({ ...b, id: batchId }) })
        db.products.get(productId).then((p) => {
          if (p) syncProductToFirestore({ id: p.id!, name: p.name, stock: p.stock, reorderLevel: p.reorderLevel, unit: p.unit, sellingPrice: p.sellingPrice, category: p.category })
        })
      }

addToast('success', `GRN #${savedGrnId} saved — ${lines.length} item(s) received`)
      setLines([])
      setVendorId('')
      setVendorFreeText('')
      setInvoiceNo('')
    } catch (err) {
      addToast('error', 'Failed to save GRN')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer title="Receive Stock" subtitle="Record vendor deliveries (GRN)">
      <div className="max-w-4xl space-y-4">
        {/* Scanner indicator */}
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 w-fit">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Scanner ready — scan barcode to add product
        </div>
        {/* Vendor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Supplier</label>
          {vendors.length > 0 ? (
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value === '' ? '' : e.target.value === 'other' ? 'other' : parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">— Select vendor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}{v.phone ? ` · ${v.phone}` : ''}</option>
              ))}
              <option value="other">Other (type below)</option>
            </select>
          ) : null}
          {(vendors.length === 0 || vendorId === 'other') && (
            <input
              type="text"
              value={vendorFreeText}
              onChange={(e) => setVendorFreeText(e.target.value)}
              placeholder="e.g. Amul Distributor, Local Market…"
              className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${vendors.length > 0 ? 'mt-2' : ''}`}
            />
          )}
        </div>

        {/* Invoice Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice / Bill No <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            placeholder="e.g. INV-2024-001"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* GRN Lines */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left w-32">Batch No</th>
                <th className="px-3 py-2 text-left w-32">Mfg Date</th>
                <th className="px-3 py-2 text-left w-32">Expiry Date *</th>
                <th className="px-3 py-2 text-right w-28">Purchase Price</th>
                <th className="px-3 py-2 text-right w-24">Qty</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-sm">
                    No items yet — click "Add Product" to start
                  </td>
                </tr>
              )}
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900">{line.product.name}</p>
                    <p className="text-xs text-gray-400">{line.product.sku} · {line.product.unit}</p>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={line.batchNo}
                      onChange={(e) => updateLine(idx, { batchNo: e.target.value })}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={line.mfgDate}
                      onChange={(e) => updateLine(idx, { mfgDate: e.target.value })}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={line.expiryDate}
                      onChange={(e) => updateLine(idx, { expiryDate: e.target.value })}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={line.purchasePrice || ''}
                      min={0}
                      step={0.01}
                      onChange={(e) => updateLine(idx, { purchasePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-right focus:border-brand-500 focus:outline-none"
                      placeholder="₹0"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={line.qty}
                      min={0.001}
                      step={line.product.soldByWeight ? 0.001 : 1}
                      onChange={(e) => updateLine(idx, { qty: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-right focus:border-brand-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeLine(idx)}
                      className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-gray-100 px-3 py-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
        </div>

        {/* Summary + Save */}
        {lines.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
            <span className="text-sm text-gray-600">
              {lines.length} item(s) · {lines.reduce((sum, l) => sum + l.qty, 0).toFixed(2).replace(/\.00$/, '')} units · Total value:{' '}
              <span className="font-semibold text-gray-900">
                {formatCurrency(lines.reduce((sum, l) => sum + l.purchasePrice * l.qty, 0))}
              </span>
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save GRN'}
            </button>
          </div>
        )}
      </div>

      <ProductSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={addLine}
      />
    </PageContainer>
  )
}

function ProductSearchModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (product: Product) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.trim().length < 1) { setResults([]); return }
    const res = await searchProducts(q)
    setResults(res)
  }

  return (
    <Modal open={open} onClose={onClose} title="Select Product" size="md">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, barcode or SKU…"
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          autoFocus
        />
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
        {results.length === 0 && query.length > 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No products found</p>
        )}
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-left"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-400">{p.sku} · {p.category}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{formatCurrency(p.sellingPrice)}</p>
              <p className="text-xs text-gray-400">Stock: {p.stock} {p.unit}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
