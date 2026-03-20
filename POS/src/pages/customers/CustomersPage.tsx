import { useState, useEffect } from 'react'
import { Plus, Search, ChevronRight, CreditCard, History, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Modal } from '@/components/common/Modal'
import {
  getAllCustomers,
  searchCustomers,
  upsertCustomer,
  getCreditHistory,
  addCreditLedgerEntry,
  updateCreditBalance,
  requestCreditLine,
  approveCreditLine,
  declineCreditRequest,
  revokeCreditLine,
  getPendingCreditRequestCount,
} from '@/db/queries/customers'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import type { Customer, CreditLedgerEntry } from '@/types'

export function CustomersPage() {
  const { addToast, setCreditRequestCount } = useUiStore()
  const { role } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [history, setHistory] = useState<CreditLedgerEntry[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [collectOpen, setCollectOpen] = useState(false)
  const [collectAmount, setCollectAmount] = useState('')

  // Credit approval modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<Customer | null>(null)
  const [approveLimit, setApproveLimit] = useState('1000')

  const isManagerOrAdmin = role === 'admin' || role === 'manager'
  const pendingRequests = customers.filter((c) => c.creditRequested === true)

  const refreshCreditBadge = () =>
    getPendingCreditRequestCount().then(setCreditRequestCount)

  const load = async () => {
    const all = await getAllCustomers()
    setCustomers(all.sort((a, b) => a.name.localeCompare(b.name)))
  }

  useEffect(() => { load() }, [])

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.trim().length < 2) { load(); return }
    const res = await searchCustomers(q)
    setCustomers(res)
  }

  const selectCustomer = async (c: Customer) => {
    setSelected(c)
    const ledger = await getCreditHistory(c.id!)
    setHistory(ledger)
  }

  const openAdd = () => { setEditCustomer(null); setFormOpen(true) }
  const openEdit = (c: Customer) => { setEditCustomer(c); setFormOpen(true) }

  const handleCollect = async () => {
    const amount = parseFloat(collectAmount)
    if (!selected || isNaN(amount) || amount <= 0) { addToast('error', 'Enter a valid amount'); return }
    if (amount > selected.currentBalance) { addToast('error', `Amount exceeds balance of ${formatCurrency(selected.currentBalance)}`); return }
    try {
      await updateCreditBalance(selected.id!, -amount)
      await addCreditLedgerEntry({ customerId: selected.id!, entryType: 'credit', amount, notes: 'Cash payment received', createdAt: new Date() })
      addToast('success', `Collected ${formatCurrency(amount)} from ${selected.name}`)
      setCollectOpen(false)
      setCollectAmount('')
      await load()
      const refreshed = { ...selected, currentBalance: selected.currentBalance - amount }
      setSelected(refreshed)
      setHistory(await getCreditHistory(selected.id!))
    } catch {
      addToast('error', 'Failed to record payment')
    }
  }

  const handleRequestCredit = async (c: Customer) => {
    await requestCreditLine(c.id!)
    addToast('success', `Credit request submitted — pending approval`)
    await load()
    refreshCreditBadge()
    setSelected({ ...c, creditRequested: true })
  }

  const openApprove = (c: Customer) => {
    setApproveTarget(c)
    setApproveLimit(c.creditLimit > 0 ? String(c.creditLimit) : '1000')
    setApproveModalOpen(true)
  }

  const handleApprove = async () => {
    if (!approveTarget?.id) return
    const limit = parseInt(approveLimit, 10) || 0
    await approveCreditLine(approveTarget.id, limit)
    addToast('success', `Credit approved for ${approveTarget.name}`)
    refreshCreditBadge()
    setApproveModalOpen(false)
    setApproveTarget(null)
    await load()
    if (selected?.id === approveTarget.id) setSelected({ ...approveTarget, creditApproved: true, creditRequested: false, creditLimit: limit })
  }

  const handleDecline = async (c: Customer) => {
    await declineCreditRequest(c.id!)
    addToast('info', `Credit request declined for ${c.name}`)
    await load()
    refreshCreditBadge()
    if (selected?.id === c.id) setSelected({ ...c, creditRequested: false })
  }

  const handleRevoke = async (c: Customer) => {
    await revokeCreditLine(c.id!)
    addToast('info', `Credit line revoked for ${c.name}`)
    await load()
    if (selected?.id === c.id) setSelected({ ...c, creditApproved: false, creditRequested: false, creditLimit: 0 })
  }

  return (
    <PageContainer title="Customers" subtitle={`${customers.length} customers`}>

      {/* Pending credit requests banner — admin/manager only */}
      {isManagerOrAdmin && pendingRequests.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-700">
              {pendingRequests.length} pending credit request{pendingRequests.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone ?? 'No phone'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openApprove(c)}
                    className="text-xs bg-green-600 text-white rounded-md px-3 py-1 hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecline(c)}
                    className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-1 hover:bg-red-100 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:h-[calc(100vh-12rem)]">
        {/* Left: Customer list */}
        <div className="w-full md:w-72 md:flex-shrink-0 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name or phone…"
                className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button onClick={openAdd} className="btn-primary px-3">
              <Plus size={16} />
            </button>
          </div>

          <div className="max-h-64 md:max-h-none flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {customers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">No customers found</p>
            )}
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selected?.id === c.id ? 'bg-brand-50' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone ?? 'No phone'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.creditRequested && <span className="w-2 h-2 rounded-full bg-amber-400" title="Credit request pending" />}
                  {c.creditApproved && <ShieldCheck size={12} className="text-green-500" />}
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Customer detail */}
        <div className="flex-1 overflow-y-auto">
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="md:hidden flex items-center gap-1 text-sm text-brand-600 mb-3"
            >
              ← Back
            </button>
          )}
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
                  <button onClick={() => openEdit(selected)} className="text-sm text-brand-600 hover:underline">
                    Edit
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs font-medium text-red-600 mb-1">Outstanding Credit</p>
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

              {/* Credit Line section */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Credit Line</h3>

                {selected.creditApproved ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-700">
                      <ShieldCheck size={16} />
                      <span className="text-sm font-medium">Approved — limit {formatCurrency(selected.creditLimit)}</span>
                    </div>
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => handleRevoke(selected)}
                        className="flex items-center gap-1 text-xs text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50"
                      >
                        <ShieldOff size={12} />
                        Revoke
                      </button>
                    )}
                  </div>
                ) : selected.creditRequested ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle size={15} />
                      <span className="text-sm">Request pending approval</span>
                    </div>
                    {isManagerOrAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => openApprove(selected)} className="text-xs bg-green-600 text-white rounded-md px-3 py-1 hover:bg-green-700">
                          Approve
                        </button>
                        <button onClick={() => handleDecline(selected)} className="text-xs text-red-600 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50">
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Not enabled</p>
                    <div className="flex gap-2">
                      {!isManagerOrAdmin && (
                        <button
                          onClick={() => handleRequestCredit(selected)}
                          className="text-xs text-brand-600 border border-brand-200 rounded-md px-3 py-1 hover:bg-brand-50"
                        >
                          Request Credit Line
                        </button>
                      )}
                      {isManagerOrAdmin && (
                        <button
                          onClick={() => openApprove(selected)}
                          className="text-xs bg-green-600 text-white rounded-md px-3 py-1 hover:bg-green-700"
                        >
                          Enable Credit
                        </button>
                      )}
                    </div>
                  </div>
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
                            {formatDate(entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt))}
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
        onSaved={async () => { await load(); setFormOpen(false) }}
        role={role}
      />

      {/* Collect payment modal */}
      <Modal open={collectOpen} onClose={() => setCollectOpen(false)} title="Collect Credit Payment" size="sm">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setCollectOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCollect} className="btn-primary">Record Payment</button>
          </div>
        </div>
      </Modal>

      {/* Approve credit modal */}
      {approveModalOpen && approveTarget && (
        <Modal open onClose={() => setApproveModalOpen(false)} title={`Approve Credit — ${approveTarget.name}`} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Set the maximum credit limit for this customer.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={approveLimit}
                onChange={(e) => setApproveLimit(e.target.value)}
                min={0}
                step={100}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApproveModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleApprove} className="btn-primary flex-1">Approve Credit</button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  )
}

function CustomerFormModal({
  open,
  onClose,
  editCustomer,
  onSaved,
  role,
}: {
  open: boolean
  onClose: () => void
  editCustomer: Customer | null
  onSaved: () => void
  role: string | null
}) {
  const { addToast } = useUiStore()
  const [form, setForm] = useState({ name: '', phone: '', creditLimit: 0, loyaltyPoints: 0 })
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
      setForm({ name: '', phone: '', creditLimit: 0, loyaltyPoints: 0 })
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
        creditApproved: editCustomer?.creditApproved ?? false,
        creditRequested: editCustomer?.creditRequested ?? false,
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" autoFocus />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Credit Limit (₹)
            {role !== 'admin' && <span className="ml-1 text-gray-400">(Admin only)</span>}
          </label>
          <input type="number" value={form.creditLimit} min={0}
            disabled={role !== 'admin'}
            onChange={(e) => setForm((f) => ({ ...f, creditLimit: parseInt(e.target.value, 10) || 0 }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" />
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
