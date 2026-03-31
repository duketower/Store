import { useState, useMemo } from 'react'
import { Download, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { updateCreditBalance, addCreditLedgerEntry } from '@/db/queries/customers'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { formatCurrency } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { StatCard } from './SalesTab'
import type { Customer } from '@/types'

export function CreditTab() {
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [collectCustomer, setCollectCustomer] = useState<Customer | null>(null)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectSaving, setCollectSaving] = useState(false)

  const customers = useFirestoreDataStore((s) => s.customers)
  const creditLedger = useFirestoreDataStore((s) => s.creditLedger)

  const creditDebtors = useMemo(
    () =>
      customers
        .filter((c) => c.currentBalance > 0)
        .sort((a, b) => b.currentBalance - a.currentBalance),
    [customers]
  )

  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id!, c.name])),
    [customers]
  )

  const sortedLedger = useMemo(
    () =>
      [...creditLedger]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((e) => ({ ...e, customerName: customerMap.get(e.customerId) ?? `#${e.customerId}` })),
    [creditLedger, customerMap]
  )

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
    } finally {
      setCollectSaving(false)
    }
  }

  const exportCreditCSV = () => {
    if (!creditDebtors.length) return
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {`${creditDebtors.length} customer${creditDebtors.length !== 1 ? 's' : ''} with outstanding credit`}
        </p>
        <button onClick={exportCreditCSV} disabled={!creditDebtors.length} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Summary Card */}
      {creditDebtors.length > 0 && (
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

      {creditDebtors.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <CheckCircle size={32} className="mx-auto mb-3 text-green-400 opacity-60" />
          <p className="font-medium text-green-600">All clear — no pending credit</p>
        </div>
      ) : (
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
      )}

      {/* Full Ledger */}
      {sortedLedger.length > 0 && (
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
                {sortedLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateTime(new Date(entry.createdAt))}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{entry.customerName}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.entryType === 'credit'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-brand-100 text-brand-700'
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
    </div>
  )
}
