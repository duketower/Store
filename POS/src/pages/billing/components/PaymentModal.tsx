import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { PaymentMethod, Customer } from '@/types'
import { Modal } from '@/components/common/Modal'
import { formatCurrency, parseAmount } from '@/utils/currency'
import { cn } from '@/utils/cn'
import { loadStoreConfig } from '@/utils/storeConfig'
import { searchCustomers } from '@/db/queries/customers'

export interface PaymentEntry {
  method: PaymentMethod
  amount: number
  referenceNo?: string
  customerId?: number
}

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  grandTotal: number
  billNo: string
  onComplete: (payments: PaymentEntry[], change: number, customerId?: number) => void
}

type Tab = 'cash' | 'upi' | 'credit' | 'split'

export function PaymentModal({ open, onClose, grandTotal, billNo, onComplete }: PaymentModalProps) {
  const [tab, setTab] = useState<Tab>('cash')
  const [cashTendered, setCashTendered] = useState('')
  const [splitPayments, setSplitPayments] = useState<Record<PaymentMethod, string>>({
    cash: '', upi: '', credit: '', card: '', split: '',
  })
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [creditError, setCreditError] = useState('')

  const cashAmount = parseAmount(cashTendered)
  const change = Math.max(0, cashAmount - grandTotal)

  const store = loadStoreConfig()
  const upiLink = `upi://pay?pa=${store.upiVpa}&pn=${encodeURIComponent(store.name)}&am=${grandTotal.toFixed(2)}&tn=${billNo}&cu=INR`

  const handleCashComplete = () => {
    onComplete([{ method: 'cash', amount: grandTotal }], change)
  }

  const handleUpiComplete = () => {
    onComplete([{ method: 'upi', amount: grandTotal }], 0)
  }

  const handleCreditComplete = () => {
    if (!selectedCustomer) return
    const newBalance = selectedCustomer.currentBalance + grandTotal
    if (newBalance > selectedCustomer.creditLimit) {
      setCreditError(`Credit limit exceeded. Limit: ${formatCurrency(selectedCustomer.creditLimit)}, Balance would be: ${formatCurrency(newBalance)}`)
      return
    }
    onComplete([{ method: 'credit', amount: grandTotal, customerId: selectedCustomer.id }], 0, selectedCustomer.id)
  }

  const splitTotal = Object.entries(splitPayments)
    .filter(([k]) => k !== 'split')
    .reduce((sum, [, v]) => sum + parseAmount(v), 0)
  const splitRemaining = grandTotal - splitTotal

  const handleSplitComplete = () => {
    const payments: PaymentEntry[] = []
    for (const [method, value] of Object.entries(splitPayments)) {
      const amount = parseAmount(value)
      if (amount > 0 && method !== 'split') {
        const entry: PaymentEntry = { method: method as PaymentMethod, amount }
        if (method === 'credit' && selectedCustomer) entry.customerId = selectedCustomer.id
        payments.push(entry)
      }
    }
    const creditCustomerId = selectedCustomer?.id
    onComplete(payments, 0, creditCustomerId)
  }

  const handleCustomerSearch = async (q: string) => {
    setCustomerSearch(q)
    setCreditError('')
    if (q.length < 2) { setCustomerResults([]); return }
    const results = await searchCustomers(q)
    setCustomerResults(results)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'cash', label: 'Cash' },
    { id: 'upi', label: 'UPI' },
    { id: 'credit', label: 'Credit' },
    { id: 'split', label: 'Split' },
  ]

  return (
    <Modal open={open} onClose={onClose} title={`Payment — ${formatCurrency(grandTotal)}`} size="md">
      {/* Tab selector */}
      <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CASH */}
      {tab === 'cash' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Amount Tendered (₹)</label>
            <input
              type="number"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              placeholder="0.00"
              className="input-field text-lg font-semibold"
              autoFocus
              min={0}
            />
          </div>
          {cashAmount > 0 && (
            <div className={cn('rounded-lg p-3 text-center', change > 0 ? 'bg-green-50' : cashAmount >= grandTotal ? 'bg-blue-50' : 'bg-yellow-50')}>
              <p className="text-sm text-gray-600">Change to return</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(change)}</p>
            </div>
          )}
          <button
            onClick={handleCashComplete}
            disabled={cashAmount < grandTotal}
            className="btn-primary w-full py-3 text-base font-bold"
          >
            Complete Cash Payment
          </button>
        </div>
      )}

      {/* UPI */}
      {tab === 'upi' && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">Scan this QR code to pay {formatCurrency(grandTotal)}</p>
          <div className="flex justify-center">
            <div className="rounded-xl border-4 border-blue-100 p-3 bg-white">
              <QRCodeSVG value={upiLink} size={200} />
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500 font-mono break-all">
            {upiLink}
          </div>
          <button onClick={handleUpiComplete} className="btn-primary w-full py-3 text-base font-bold">
            Payment Received ✓
          </button>
          <p className="text-xs text-gray-400">Cashier confirms payment manually</p>
        </div>
      )}

      {/* CREDIT */}
      {tab === 'credit' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Search Customer</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              placeholder="Name or phone number..."
              className="input-field"
              autoFocus
            />
          </div>

          {/* Customer search results */}
          {customerResults.length > 0 && !selectedCustomer && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              {customerResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setCustomerResults([]) }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-red-600 font-medium">Owes {formatCurrency(c.currentBalance)}</p>
                    <p className="text-gray-400">Limit {formatCurrency(c.creditLimit)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected customer info */}
          {selectedCustomer && (
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                </div>
                <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); setCreditError('') }} className="text-gray-400 hover:text-gray-600 text-xs">Change</button>
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <span>Current: <strong className="text-red-600">{formatCurrency(selectedCustomer.currentBalance)}</strong></span>
                <span>After: <strong>{formatCurrency(selectedCustomer.currentBalance + grandTotal)}</strong></span>
                <span>Limit: {formatCurrency(selectedCustomer.creditLimit)}</span>
              </div>
            </div>
          )}

          {creditError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{creditError}</div>
          )}

          <button
            onClick={handleCreditComplete}
            disabled={!selectedCustomer}
            className="btn-primary w-full py-3 text-base font-bold"
          >
            Add to Udhaar
          </button>
        </div>
      )}

      {/* SPLIT */}
      {tab === 'split' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Total: {formatCurrency(grandTotal)}</p>
          {(['cash', 'upi'] as PaymentMethod[]).map((method) => (
            <div key={method}>
              <label className="mb-1 block text-sm font-medium text-gray-700 capitalize">{method} Amount (₹)</label>
              <input
                type="number"
                value={splitPayments[method]}
                onChange={(e) => setSplitPayments((prev) => ({ ...prev, [method]: e.target.value }))}
                placeholder="0.00"
                className="input-field"
                min={0}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Credit (Udhaar) Amount (₹)</label>
            <input
              type="number"
              value={splitPayments['credit']}
              onChange={(e) => setSplitPayments((prev) => ({ ...prev, credit: e.target.value }))}
              placeholder="0.00"
              className="input-field"
              min={0}
            />
            {parseAmount(splitPayments['credit']) > 0 && !selectedCustomer && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  placeholder="Search customer for credit…"
                  className="input-field text-sm"
                />
                {customerResults.length > 0 && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden mt-1">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setCustomerResults([]) }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-red-600">Owes {formatCurrency(c.currentBalance)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {selectedCustomer && parseAmount(splitPayments['credit']) > 0 && (
              <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs flex justify-between items-center">
                <span className="font-medium text-blue-800">{selectedCustomer.name}</span>
                <button onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }} className="text-gray-400 hover:text-gray-600">Change</button>
              </div>
            )}
          </div>
          <div className={cn('rounded-lg p-3 text-center', Math.abs(splitRemaining) < 0.01 ? 'bg-green-50' : 'bg-yellow-50')}>
            <p className="text-sm text-gray-600">Remaining</p>
            <p className={cn('text-xl font-bold', Math.abs(splitRemaining) < 0.01 ? 'text-green-700' : 'text-yellow-700')}>
              {formatCurrency(Math.max(0, splitRemaining))}
            </p>
          </div>
          <button
            onClick={handleSplitComplete}
            disabled={Math.abs(splitRemaining) > 0.01 || (parseAmount(splitPayments['credit']) > 0 && !selectedCustomer)}
            className="btn-primary w-full py-3 text-base font-bold"
          >
            Complete Payment
          </button>
          {parseAmount(splitPayments['credit']) > 0 && !selectedCustomer && (
            <p className="text-xs text-center text-red-500">Select a customer for the credit portion</p>
          )}
        </div>
      )}
    </Modal>
  )
}
