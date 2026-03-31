import { useMemo, useState } from 'react'
import { Banknote, ArrowDownLeft, Clock } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuth } from '@/hooks/useAuth'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { syncCashEntryToFirestore } from '@/services/firebase/sync'
import { createSyncId } from '@/utils/syncIds'
import { formatCurrency } from '@/utils/currency'
import type { CashEntry, CashEntryCategory } from '@/types'

const CATEGORY_LABELS: Record<CashEntryCategory, string> = {
  supplies:       'Store Supplies',
  vendor_payment: 'Vendor Payment',
  salary_advance: 'Salary Advance',
  utilities:      'Utilities (Electric/Water)',
  transport:      'Transport / Delivery',
  other:          'Other',
}

export function CashOutPage() {
  const { session } = useAuth()
  const { currentSession } = useSessionStore()
  const { addToast } = useUiStore()
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<CashEntryCategory>('supplies')
  const [note, setNote] = useState('')

  const cashEntries = useFirestoreDataStore((s) => s.cashEntries)
  const sales = useFirestoreDataStore((s) => s.sales)

  const todayEntries = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return cashEntries
      .filter((e) => new Date(e.createdAt) >= start)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [cashEntries])

  const cashSalesTotal = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return sales
      .filter((s) => new Date(s.createdAt) >= start)
      .reduce((sum, sale) => {
        return sum + (sale.payments ?? [])
          .filter((p) => p.method === 'cash')
          .reduce((s2, p) => s2 + p.amount, 0)
      }, 0)
  }, [sales])

  const cashOutTotal = useMemo(
    () => todayEntries.reduce((s, e) => s + e.amount, 0),
    [todayEntries]
  )

  const cashInDrawer = (currentSession?.openingFloat ?? 0) + cashSalesTotal - cashOutTotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { addToast('error', 'Enter a valid amount'); return }
    if (!session?.employeeId) return

    setLoading(true)
    try {
      const entry: CashEntry = {
        syncId: createSyncId('cash'),
        sessionId: currentSession?.id,
        amount: amt,
        category,
        note: note.trim() || undefined,
        authorizedBy: session.employeeId,
        createdAt: new Date(),
      }
      await syncCashEntryToFirestore(entry)
      addToast('success', `Cash out of ${formatCurrency(amt)} recorded`)
      setAmount('')
      setNote('')
      setCategory('supplies')
    } catch {
      addToast('error', 'Failed to record cash out — check connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="Cash Out" subtitle="Record cash leaving the counter">
      <div className="max-w-2xl space-y-5">

        {/* Running cash balance */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 mb-1">Opening Float</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(currentSession?.openingFloat ?? 0)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 mb-1">Cash Sales Today</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(cashSalesTotal)}</p>
          </div>
          <div className={`rounded-lg border p-4 ${cashInDrawer < 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <p className="text-xs text-gray-500 mb-1">Est. Cash in Drawer</p>
            <p className={`text-lg font-bold ${cashInDrawer < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {formatCurrency(cashInDrawer)}
            </p>
          </div>
        </div>

        {cashOutTotal > 0 && (
          <p className="text-xs text-amber-600 -mt-2">
            − {formatCurrency(cashOutTotal)} total cash out today already deducted
          </p>
        )}

        {/* Cash out form */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowDownLeft size={16} className="text-red-500" />
            Record Cash Out
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  step={1}
                  placeholder="0"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CashEntryCategory)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none bg-white"
                >
                  {(Object.entries(CATEGORY_LABELS) as [CashEntryCategory, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Paid Reliance for grocery bags"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button type="submit" disabled={loading || !amount} className="btn-primary w-full flex items-center justify-center gap-2">
              <Banknote size={16} />
              {loading ? 'Recording…' : 'Record Cash Out'}
            </button>
          </form>
        </div>

        {/* Today's cashout log */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Today's Cash Outs</h3>
            {cashOutTotal > 0 && (
              <span className="text-sm font-bold text-red-600">−{formatCurrency(cashOutTotal)}</span>
            )}
          </div>
          {todayEntries.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">No cash outs recorded today.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayEntries.map((entry, i) => (
                <div key={entry.syncId ?? i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{CATEGORY_LABELS[entry.category]}</p>
                    {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-600">−{formatCurrency(entry.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  )
}
