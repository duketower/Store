import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, AlertTriangle, Sliders } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import { getAllProducts, upsertProduct, adjustStock } from '@/db/queries/products'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/utils/currency'
import { GST_SLABS } from '@/constants/gst'
import { CATEGORIES, UNITS } from '@/constants/app'
import type { Product } from '@/types'

const EMPTY_FORM: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  barcode: '',
  sku: '',
  category: 'Grocery',
  unit: 'pcs',
  soldByWeight: false,
  sellingPrice: 0,
  mrp: 0,
  taxRate: 0,
  hsnCode: '',
  stock: 0,
  reorderLevel: 5,
  isActive: true,
}

export function ProductsPage() {
  const { role, employeeId } = useAuth()
  const { addToast } = useUiStore()
  const canEdit = role === 'admin' || role === 'manager'

  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [adjustDelta, setAdjustDelta] = useState('')
  const [adjustReason, setAdjustReason] = useState('Count Correction')
  const [adjustSaving, setAdjustSaving] = useState(false)

  const load = async () => {
    const all = await getAllProducts()
    setProducts(all)
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter((p) => {
    const matchQuery =
      !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.barcode ?? '').includes(query) ||
      (p.sku ?? '').toLowerCase().includes(query.toLowerCase())
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter
    return matchQuery && matchCat
  })

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category))).sort()]

  const openAdd = () => {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditProduct(product)
    setForm({
      name: product.name,
      barcode: product.barcode ?? '',
      sku: product.sku ?? '',
      category: product.category,
      unit: product.unit,
      soldByWeight: product.soldByWeight,
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      taxRate: product.taxRate,
      hsnCode: product.hsnCode,
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      isActive: product.isActive ?? true,
    })
    setModalOpen(true)
  }

  const openAdjust = (product: Product) => {
    setAdjustProduct(product)
    setAdjustDelta('')
    setAdjustReason('Count Correction')
    setAdjustModalOpen(true)
  }

  const handleAdjust = async () => {
    if (!adjustProduct || !employeeId) return
    const delta = parseFloat(adjustDelta)
    if (isNaN(delta) || delta === 0) { addToast('error', 'Enter a non-zero adjustment'); return }
    setAdjustSaving(true)
    try {
      await adjustStock(adjustProduct.id!, delta, adjustReason, employeeId)
      addToast('success', `Stock adjusted: ${delta > 0 ? '+' : ''}${delta} ${adjustProduct.unit}`)
      setAdjustModalOpen(false)
      await load()
    } catch {
      addToast('error', 'Failed to adjust stock')
    } finally {
      setAdjustSaving(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('error', 'Product name is required'); return }
    if (form.sellingPrice <= 0) { addToast('error', 'Selling price must be > 0'); return }

    setSaving(true)
    try {
      await upsertProduct({
        ...form,
        id: editProduct?.id,
        createdAt: editProduct?.createdAt ?? new Date(),
        updatedAt: new Date(),
      })
      addToast('success', editProduct ? 'Product updated' : 'Product added')
      setModalOpen(false)
      await load()
    } catch (err) {
      addToast('error', 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const isLowStock = (p: Product) => p.stock <= p.reorderLevel

  return (
    <PageContainer title="Products" subtitle={`${products.length} products`}>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, barcode or SKU…"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        {canEdit && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add Product
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Selling Price</th>
              <th className="px-4 py-3 text-right">MRP</th>
              <th className="px-4 py-3 text-center">GST</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Reorder</th>
              {canEdit && <th className="px-4 py-3 w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">No products found</td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className={`hover:bg-gray-50 ${isLowStock(p) ? 'bg-amber-50 hover:bg-amber-100' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isLowStock(p) && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />}
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku} · {p.barcode ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(p.sellingPrice)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(p.mrp)}</td>
                <td className="px-4 py-3 text-center">
                  {p.taxRate > 0 ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{p.taxRate}%</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Nil</span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${isLowStock(p) ? 'text-amber-600' : 'text-gray-900'}`}>
                  {p.stock} {p.unit}
                </td>
                <td className="px-4 py-3 text-right text-gray-400">{p.reorderLevel}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Edit product"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => openAdjust(p)}
                        className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                        title="Adjust stock"
                      >
                        <Sliders size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'Edit Product' : 'Add Product'}
        size="xl"
      >
        <ProductForm
          form={form}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          saving={saving}
          isEdit={!!editProduct}
        />
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock — ${adjustProduct?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="text-gray-500">Current stock</p>
            <p className="text-2xl font-bold text-gray-900">{adjustProduct?.stock} {adjustProduct?.unit}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adjustment (use − for damage/loss)</label>
            <input
              type="number"
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(e.target.value)}
              placeholder="e.g. −5 or +10"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              autoFocus
            />
            {adjustDelta && !isNaN(parseFloat(adjustDelta)) && adjustProduct && (
              <p className="mt-1 text-xs text-gray-500">
                New stock: <strong>{Math.max(0, adjustProduct.stock + parseFloat(adjustDelta))} {adjustProduct.unit}</strong>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              {['Count Correction', 'Damage', 'Theft/Loss', 'Expiry Write-off', 'Opening Stock', 'Other'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setAdjustModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAdjust} disabled={adjustSaving} className="btn-primary flex-1">
              {adjustSaving ? 'Saving…' : 'Apply Adjustment'}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}

type FormPatch = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>

function ProductForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  isEdit,
}: {
  form: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  onChange: (patch: FormPatch) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  isEdit: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Barcode</label>
          <input type="text" value={form.barcode} onChange={(e) => onChange({ barcode: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
          <input type="text" value={form.sku} onChange={(e) => onChange({ sku: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select value={form.category} onChange={(e) => onChange({ category: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
          <select value={form.unit} onChange={(e) => onChange({ unit: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹) *</label>
          <input type="number" value={form.sellingPrice || ''} min={0} step={0.01}
            onChange={(e) => onChange({ sellingPrice: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">MRP (₹)</label>
          <input type="number" value={form.mrp || ''} min={0} step={0.01}
            onChange={(e) => onChange({ mrp: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">GST Rate</label>
          <select value={form.taxRate} onChange={(e) => onChange({ taxRate: parseInt(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            {GST_SLABS.map((r) => <option key={r} value={r}>{r === 0 ? 'Nil (0%)' : `${r}%`}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">HSN Code</label>
          <input type="text" value={form.hsnCode} onChange={(e) => onChange({ hsnCode: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Opening Stock</label>
          <input type="number" value={form.stock} min={0}
            onChange={(e) => onChange({ stock: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Reorder Level</label>
          <input type="number" value={form.reorderLevel} min={0}
            onChange={(e) => onChange({ reorderLevel: parseInt(e.target.value) || 0 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.soldByWeight}
              onChange={(e) => onChange({ soldByWeight: e.target.checked })}
              className="rounded text-blue-600" />
            <span className="text-sm text-gray-700">Sold by weight (scale auto-fills qty)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={onSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
        </button>
      </div>
    </div>
  )
}
