import { useState, useMemo } from 'react'
import { Truck, Plus, Search, Edit2, Phone, FileText, ToggleLeft, ToggleRight } from 'lucide-react'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { StatCard } from './SalesTab'
import { Modal } from '@/components/common/Modal'
import { upsertVendor, toggleVendorActive } from '@/db/queries/vendors'
import { useUiStore } from '@/stores/uiStore'
import type { Vendor } from '@/types'

type DateRange = 'last30' | 'last90' | 'last180' | 'thisYear' | 'custom'
type SubTab = 'summary' | 'vendors'

function getDateRange(range: DateRange, customFrom: string, customTo: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (range === 'last30') {
    const start = new Date(now)
    start.setDate(now.getDate() - 30)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'last90') {
    const start = new Date(now)
    start.setDate(now.getDate() - 90)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'last180') {
    const start = new Date(now)
    start.setDate(now.getDate() - 180)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'thisYear') {
    const start = new Date(now.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  // custom
  const start = new Date(customFrom)
  start.setHours(0, 0, 0, 0)
  const endCustom = new Date(customTo)
  endCustom.setHours(23, 59, 59, 999)
  return { start, end: endCustom }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface VendorRow {
  vendorName: string
  grnCount: number
  totalValue: number
  lastGrnDate: Date
}

const EMPTY_FORM: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  phone: '',
  gstin: '',
  address: '',
  isActive: true,
}

export function VendorSummaryTab() {
  const { addToast } = useUiStore()

  // Sub-tab state
  const [subTab, setSubTab] = useState<SubTab>('summary')

  // Summary state
  const [range, setRange] = useState<DateRange>('last30')
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo, setCustomTo] = useState(todayStr())

  // Vendors state
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const allGrns = useFirestoreDataStore((s) => s.grns)
  const vendors = useFirestoreDataStore((s) => s.vendors)

  const rows = useMemo((): VendorRow[] => {
    const { start, end } = getDateRange(range, customFrom, customTo)
    const grns = allGrns.filter((g) => {
      const d = g.createdAt instanceof Date ? g.createdAt : new Date(g.createdAt)
      return d >= start && d <= end
    })

    const map: Record<string, VendorRow> = {}
    for (const grn of grns) {
      const key = grn.vendorName?.trim() || '(Unknown Vendor)'
      const d = grn.createdAt instanceof Date ? grn.createdAt : new Date(grn.createdAt)
      if (!map[key]) {
        map[key] = { vendorName: key, grnCount: 0, totalValue: 0, lastGrnDate: d }
      }
      map[key].grnCount += 1
      map[key].totalValue += grn.totalValue
      if (d > map[key].lastGrnDate) {
        map[key].lastGrnDate = d
      }
    }

    return Object.values(map).sort((a, b) => b.totalValue - a.totalValue)
  }, [allGrns, range, customFrom, customTo])

  const filtered = useMemo(() => vendors.filter((v) => {
    const matchQuery =
      !query ||
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      (v.phone ?? '').includes(query) ||
      (v.gstin ?? '').toLowerCase().includes(query.toLowerCase())
    const matchActive = showInactive || v.isActive
    return matchQuery && matchActive
  }), [vendors, query, showInactive])

  const exportCsv = () => {
    if (rows.length === 0) return
    const header = 'Vendor,GRNs,Total Value,Last GRN Date'
    const csvRows = rows.map((r) => {
      const dateStr = formatDate(r.lastGrnDate)
      const name = r.vendorName.replace(/"/g, '""')
      return `"${name}",${r.grnCount},${r.totalValue.toFixed(2)},${dateStr}`
    })
    const csv = [header, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-summary-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openAdd = () => {
    setEditVendor(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (vendor: Vendor) => {
    setEditVendor(vendor)
    setForm({
      name: vendor.name,
      phone: vendor.phone ?? '',
      gstin: vendor.gstin ?? '',
      address: vendor.address ?? '',
      isActive: vendor.isActive,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('error', 'Vendor name is required'); return }
    setSaving(true)
    try {
      await upsertVendor({
        ...form,
        id: editVendor?.id,
        createdAt: editVendor?.createdAt ?? new Date(),
        updatedAt: new Date(),
      })
      addToast('success', editVendor ? 'Vendor updated' : 'Vendor added')
      setModalOpen(false)
    } catch {
      addToast('error', 'Failed to save vendor')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (vendor: Vendor) => {
    try {
      await toggleVendorActive(vendor.id!, !vendor.isActive)
      addToast('success', `${vendor.name} ${vendor.isActive ? 'deactivated' : 'activated'}`)
    } catch {
      addToast('error', 'Failed to update vendor')
    }
  }

  const totalValue = rows.reduce((s, r) => s + r.totalValue, 0)
  const totalVendors = rows.length

  const rangeLabels: Record<DateRange, string> = {
    last30: 'Last 30 Days',
    last90: 'Last 3 Months',
    last180: 'Last 6 Months',
    thisYear: 'This Year',
    custom: 'Custom',
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab pills */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('summary')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            subTab === 'summary'
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setSubTab('vendors')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            subTab === 'vendors'
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Vendors
        </button>
      </div>

      {/* ── Summary view ── */}
      {subTab === 'summary' && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              {(Object.keys(rangeLabels) as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-2 ${range === r ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {rangeLabels[r]}
                </button>
              ))}
            </div>

            {range === 'custom' && (
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="ml-auto btn-secondary text-sm disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
              <Truck size={32} className="mx-auto mb-3 opacity-30" />
              <p>No GRNs found for this period</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Vendors" value={String(totalVendors)} />
                <StatCard label="Total Purchase Value" value={formatCurrency(totalValue)} highlight />
              </div>

              {/* Vendor Table */}
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-right">GRNs</th>
                      <th className="px-4 py-3 text-right">Total Value</th>
                      <th className="px-4 py-3 text-right">Last GRN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => (
                      <tr key={row.vendorName} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{row.vendorName}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.grnCount}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.totalValue)}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500">
                          {formatDate(row.lastGrnDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        {rows.reduce((s, r) => s + r.grnCount, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(totalValue)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Vendors view ── */}
      {subTab === 'vendors' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone or GSTIN…"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded text-brand-600"
              />
              Show inactive
            </label>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Vendor
            </button>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
              <Truck size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">No vendors yet — add your first supplier</p>
              <button onClick={openAdd} className="mt-4 btn-primary">Add Vendor</button>
            </div>
          )}

          {/* Vendor cards */}
          {filtered.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-lg border bg-white p-4 space-y-2 ${v.isActive ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-shrink-0 rounded-full bg-brand-50 p-2">
                        <Truck size={16} className="text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{v.name}</p>
                        {!v.isActive && (
                          <span className="text-xs text-gray-400 font-medium">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(v)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Edit vendor"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(v)}
                        className={`rounded p-1 ${v.isActive ? 'text-gray-400 hover:bg-red-50 hover:text-red-500' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                        title={v.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {v.isActive ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {v.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-gray-400 flex-shrink-0" />
                        <span>{v.phone}</span>
                      </div>
                    )}
                    {v.gstin && (
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-xs">{v.gstin}</span>
                      </div>
                    )}
                    {v.address && (
                      <p className="text-xs text-gray-400 leading-snug">{v.address}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editVendor ? 'Edit Vendor' : 'Add Vendor'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              autoFocus
              placeholder="e.g. Amul Distributor"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none"
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none"
              placeholder="Optional"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editVendor ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
