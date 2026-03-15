import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Truck, Phone, FileText, ToggleLeft, ToggleRight } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import { getAllVendors, upsertVendor, toggleVendorActive } from '@/db/queries/vendors'
import { useUiStore } from '@/stores/uiStore'
import type { Vendor } from '@/types'

const EMPTY_FORM: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  phone: '',
  gstin: '',
  address: '',
  isActive: true,
}

export function VendorsPage() {
  const { addToast } = useUiStore()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const all = await getAllVendors()
    setVendors(all)
  }

  useEffect(() => { load() }, [])

  const filtered = vendors.filter((v) => {
    const matchQuery =
      !query ||
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      (v.phone ?? '').includes(query) ||
      (v.gstin ?? '').toLowerCase().includes(query.toLowerCase())
    const matchActive = showInactive || v.isActive
    return matchQuery && matchActive
  })

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
      await load()
    } catch {
      addToast('error', 'Failed to save vendor')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (vendor: Vendor) => {
    try {
      await toggleVendorActive(vendor.id!, !vendor.isActive)
      await load()
      addToast('success', `${vendor.name} ${vendor.isActive ? 'deactivated' : 'activated'}`)
    } catch {
      addToast('error', 'Failed to update vendor')
    }
  }

  return (
    <PageContainer title="Vendors" subtitle={`${vendors.filter((v) => v.isActive).length} active suppliers`}>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone or GSTIN…"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded text-blue-600"
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
                  <div className="flex-shrink-0 rounded-full bg-blue-50 p-2">
                    <Truck size={16} className="text-blue-600" />
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-400 focus:outline-none"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none"
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
    </PageContainer>
  )
}
