import { useState, useEffect } from 'react'
import { Download, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { getAllCustomers, updateCreditBalance, addCreditLedgerEntry } from '@/db/queries/customers'
import { db } from '@/db'
import { formatCurrency } from '@/utils/currency'
import { StatCard } from './SalesTab'
import type { Customer, CreditLedgerEntry } from '@/types'

export function CreditTab() {
  const [loading, setLoading] = useState(false)
  const [creditDebtors, setCreditDebtors] = useState<Customer[] | null>(null)
  const [creditLedger, setCreditLedger] = useState<Array<CreditLedgerEntry & { customerName: string }> | null>(null)
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [collectCustomer, setCollectCustomer] = useState<Customer | null>(null)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectSaving, setCollectSaving] = useState(false)

  useEffect(() => {
    loadCreditReport()
  }, [])

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

  return (
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
