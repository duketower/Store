import { useState, useEffect } from 'react'
import { Plus, Search, ChevronRight, CreditCard, History } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import {
  getAllCustomers,
  searchCustomers,
  upsertCustomer,
  getCreditHistory,
  addCreditLedgerEntry,
  updateCreditBalance,
} from '@/db/queries/customers'
import { useUiStore } from '@/stores/uiStore'
import { formatCurrency } from '@/utils/currency'
import type { Customer, CreditLedgerEntry } from '@/types'

export function CustomersPage() {
  const { addToast } = useUiStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [history, setHistory] = useState<CreditLedgerEntry[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [collectOpen, setCollectOpen] = useState(false)
  const [collectAmount, setCollectAmount] = useState('')

  const load = async () => {
    const all = await getAllCustomers()
    setCustomers(all.sort((a, b) => a.name.localeCompare(b.name)))
  }

  useEffect(() => { load() }, [])

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.trim().length < 2) {
      load()
      return
    }
    const res = await searchCustomers(q)
    setCustomers(res)
  }

  const selectCustomer = async (c: Customer) => {
    setSelected(c)
    const ledger = await getCreditHistory(c.id!)
    setHistory(ledger)
  }

  const openAdd = () => {
    setEditCustomer(null)
    setFormOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditCustomer(c)
    setFormOpen(true)
  }

  const handleCollect = async () => {
    const amount = parseFloat(collectAmount)
    if (!selected || isNaN(amount) || amount <= 0) {
      addToast('error', 'Enter a valid amount')
      return
    }
    if (amount > selected.currentBalance) {
      addToast('error', `Amount exceeds outstanding balance of ${formatCurrency(selected.currentBalance)}`)
      return
    }

    try {
      await updateCreditBalance(selected.id!, -amount)
      await addCreditLedgerEntry({
        customerId: selected.id!,
        entryType: 'credit',
        amount,
        notes: 'Cash payment received',
        createdAt: new Date(),
      })
      addToast('success', `Collected ${formatCurrency(amount)} from ${selected.name}`)
      setCollectOpen(false)
      setCollectAmount('')
      // Refresh
      await load()
      const updated = customers.find((c) => c.id === selected.id)
      if (updated) {
        const refreshed = { ...updated, currentBalance: updated.currentBalance - amount }
        setSelected(refreshed)
        const ledger = await getCreditHistory(selected.id!)
        setHistory(ledger)
      }
    } catch (err) {
      addToast('error', 'Failed to record payment')
    }
  }

  return (
    <PageContainer title="Customers" subtitle={`${customers.length} customers`}>
      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        {/* Left: Customer list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name or phone…"
                className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            <button onClick={openAdd} className="btn-primary px-3">
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {customers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">No customers found</p>
            )}
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selected?.id === c.id ? 'bg-blue-50' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone ?? 'No phone'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.currentBalance > 0 && (
                    <span className="text-xs font-semibold text-red-600">
                      {formatCurrency(c.currentBalance)}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Customer detail */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a customer to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header card */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selected.name}</h2>
                    <p className="text-sm text-gray-500">{selected.phone ?? 'No phone'}</p>
                  </div>
                  <button
                    onClick={() => openEdit(selected)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs font-medium text-red-600 mb-1">Outstanding (Udhaar)</p>
                    <p className="text-xl font-bold text-red-700">{formatCurrency(selected.currentBalance)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Credit Limit</p>
                    <p className="text-xl font-bold text-gray-700">{formatCurrency(selected.creditLimit)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-600 mb-1">Loyalty Points</p>
                    <p className="text-xl font-bold text-amber-700">{selected.loyaltyPoints}</p>
                  </div>
                </div>

                {selected.currentBalance > 0 && (
                  <button
                    onClick={() => { setCollectAmount(''); setCollectOpen(true) }}
                    className="btn-primary mt-4 flex items-center gap-2"
                  >
                    <CreditCard size={16} />
                    Collect Payment
                  </button>
                )}
              </div>

              {/* Credit history */}
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
                  <History size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">Transaction History</h3>
                </div>
                {history.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">No transactions yet</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm text-gray-700">{entry.notes ?? (entry.entryType === 'debit' ? 'Purchase' : 'Payment')}</p>
                          <p className="text-xs text-gray-400">
                            {entry.createdAt instanceof Date
                              ? entry.createdAt.toLocaleDateString('en-IN')
                              : new Date(entry.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold ${entry.entryType === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                          {entry.entryType === 'debit' ? '+' : '-'}{formatCurrency(entry.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit customer modal */}
      <CustomerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editCustomer={editCustomer}
        onSaved={async () => {
          await load()
          setFormOpen(false)
        }}
      />

      {/* Collect payment modal */}
      <Modal open={collectOpen} onClose={() => setCollectOpen(false)} title="Collect Udhaar Payment" size="sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Outstanding balance: <span className="font-semibold text-red-600">{formatCurrency(selected?.currentBalance ?? 0)}</span>
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount Received (₹)</label>
            <input
              type="number"
              value={collectAmount}
              onChange={(e) => setCollectAmount(e.target.value)}
              min={1}
              max={selected?.currentBalance}
              step={0.01}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setCollectOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCollect} className="btn-primary">Record Payment</button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}

function CustomerFormModal({
  open,
  onClose,
  editCustomer,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  editCustomer: Customer | null
  onSaved: () => void
}) {
  const { addToast } = useUiStore()
  const [form, setForm] = useState({ name: '', phone: '', creditLimit: 1000, loyaltyPoints: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editCustomer) {
      setForm({
        name: editCustomer.name,
        phone: editCustomer.phone ?? '',
        creditLimit: editCustomer.creditLimit,
        loyaltyPoints: editCustomer.loyaltyPoints,
      })
    } else {
      setForm({ name: '', phone: '', creditLimit: 1000, loyaltyPoints: 0 })
    }
  }, [editCustomer, open])

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('error', 'Name is required'); return }
    setSaving(true)
    try {
      await upsertCustomer({
        ...form,
        id: editCustomer?.id,
        currentBalance: editCustomer?.currentBalance ?? 0,
        createdAt: editCustomer?.createdAt ?? new Date(),
        updatedAt: new Date(),
      })
      addToast('success', editCustomer ? 'Customer updated' : 'Customer added')
      onSaved()
    } catch {
      addToast('error', 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editCustomer ? 'Edit Customer' : 'New Customer'} size="sm">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" autoFocus />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Credit Limit (₹)</label>
          <input type="number" value={form.creditLimit} min={0}
            onChange={(e) => setForm((f) => ({ ...f, creditLimit: parseInt(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : editCustomer ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
