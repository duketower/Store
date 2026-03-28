import { useState, useEffect } from 'react'
import { Receipt, Plus, Trash2, X } from 'lucide-react'
import { createExpense, deleteExpenseById, listExpensesBetween } from '@/db/queries/expenses'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { StatCard } from './SalesTab'
import type { Expense } from '@/types'

const EXPENSE_CATEGORIES = [
  'Electricity',
  'Rent',
  'Staff Salary',
  'Maintenance',
  'Purchase',
  'Other',
]

type DateRange = 'today' | 'week' | 'month' | 'custom'

function getDateRange(range: DateRange, customFrom: string, customTo: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (range === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
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

export function ExpenseTab() {
  const [range, setRange] = useState<DateRange>('month')
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo, setCustomTo] = useState(todayStr())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)

  // Add form state
  const [showForm, setShowForm] = useState(false)
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0])
  const [formAmount, setFormAmount] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formDate, setFormDate] = useState(todayStr())
  const [formSaving, setFormSaving] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    loadExpenses()
  }, [range, customFrom, customTo])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRange(range, customFrom, customTo)
      setExpenses(await listExpensesBetween(start, end))
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    const amount = parseFloat(formAmount)
    if (!formAmount || isNaN(amount) || amount <= 0) return
    setFormSaving(true)
    try {
      await createExpense({
        category: formCategory,
        amount,
        note: formNote.trim() || undefined,
        date: new Date(formDate),
      })
      setShowForm(false)
      setFormAmount('')
      setFormNote('')
      setFormDate(todayStr())
      setFormCategory(EXPENSE_CATEGORIES[0])
      await loadExpenses()
    } finally {
      setFormSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteExpenseById(id)
    setDeleteId(null)
    await loadExpenses()
  }

  const exportCsv = () => {
    if (expenses.length === 0) return
    const header = 'Date,Category,Note,Amount'
    const rows = expenses.map((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date)
      const dateStr = formatDate(d)
      const note = (e.note ?? '').replace(/"/g, '""')
      return `${dateStr},${e.category},"${note}",${e.amount.toFixed(2)}`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Derived stats
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
  }
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {(['today', 'week', 'month', 'custom'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-2 capitalize ${range === r ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'Custom'}
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

        <div className="ml-auto flex gap-2">
          <button
            onClick={exportCsv}
            disabled={expenses.length === 0}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-700">New Expense</p>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
              <input
                type="text"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="e.g. KSEB bill"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            <button
              onClick={handleAddExpense}
              disabled={formSaving || !formAmount || parseFloat(formAmount) <= 0}
              className="btn-primary text-sm disabled:opacity-40"
            >
              {formSaving ? 'Saving…' : 'Save Expense'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : expenses.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <Receipt size={32} className="mx-auto mb-3 opacity-30" />
          <p>No expenses for this period</p>
          <p className="text-xs mt-1">Click "Add Expense" to log one</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Total Expenses" value={formatCurrency(total)} highlight />
            <StatCard label="No. of Entries" value={String(expenses.length)} />
            <StatCard label="Categories" value={String(categoryEntries.length)} />
          </div>

          {/* Category Breakdown */}
          {categoryEntries.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">By Category</p>
              <div className="divide-y divide-gray-100">
                {categoryEntries.map(([cat, amt]) => (
                  <div key={cat} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-700">{cat}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">
                        {total > 0 ? Math.round((amt / total) * 100) : 0}%
                      </span>
                      <span className="font-medium text-gray-900 w-28 text-right">{formatCurrency(amt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses Table */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Note</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => {
                  const d = e.date instanceof Date ? e.date : new Date(e.date)
                  return (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(d)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{e.category}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{e.note ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        {deleteId === e.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button
                              onClick={() => handleDelete(e.id!)}
                              className="text-xs text-red-600 font-medium hover:underline"
                            >Yes</button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="text-xs text-gray-500 hover:underline"
                            >No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(e.id!)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
