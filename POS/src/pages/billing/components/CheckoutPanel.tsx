import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { User, X, ChevronDown, Clock } from 'lucide-react'
import type { PaymentMethod, Customer } from '@/types'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency, parseAmount } from '@/utils/currency'
import { groupByGstSlab } from '@/utils/gst'
import { cn } from '@/utils/cn'
import { loadStoreConfig } from '@/utils/storeConfig'
import { searchCustomers, getCustomerById, getCustomerByPhone, upsertCustomer } from '@/db/queries/customers'
import { toFiniteNumber } from '@/utils/numbers'

export interface PaymentEntry {
  method: PaymentMethod
  amount: number
  referenceNo?: string
  customerId?: number
}

interface CheckoutPanelProps {
  onComplete: (payments: PaymentEntry[], change: number, customerId?: number) => Promise<void>
  disabled: boolean
}

type ActiveMethod = 'cash' | 'upi' | 'card' | 'credit' | 'split' | null

const DENOMINATIONS = [50, 100, 200, 500, 2000]

export function CheckoutPanel({ onComplete, disabled }: CheckoutPanelProps) {
  const {
    items,
    billDiscount,
    setBillDiscount,
    heldBills,
    holdCurrentBill,
    recallHeldBill,
    discardHeldBill,
    selectedCustomerId,
    setSelectedCustomer,
    totals,
  } = useCartStore()

  const { subtotal, itemDiscount, billDiscountAmount, taxTotal, grandTotal } = totals()
  const gstSlabs = groupByGstSlab(items, billDiscountAmount)

  // Payment state
  const [activeMethod, setActiveMethod] = useState<ActiveMethod>(null)
  const [cashReceived, setCashReceived] = useState('')
  const [cardRef, setCardRef] = useState('')
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', upi: '', card: '', credit: '' })
  const [completing, setCompleting] = useState(false)

  // Customer state
  const [selectedCustomer, setSelectedCustomerLocal] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [creditError, setCreditError] = useState('')

  // Phone-first customer form state
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null)
  const [lookupDone, setLookupDone] = useState(false)

  // Held bills dropdown
  const [showHeldBills, setShowHeldBills] = useState(false)
  const [recallConfirmId, setRecallConfirmId] = useState<string | null>(null)

  // Load customer by ID when store has one selected
  useEffect(() => {
    let active = true

    if (selectedCustomerId) {
      void getCustomerById(selectedCustomerId).then((c) => {
        if (active) setSelectedCustomerLocal(c ?? null)
      })
    }
    if (!selectedCustomerId) {
      setSelectedCustomerLocal(null)
    }
    return () => {
      active = false
    }
  }, [selectedCustomerId])

  // Reset payment state when method changes
  const selectMethod = (m: ActiveMethod) => {
    if (m === activeMethod) { setActiveMethod(null); return }
    setActiveMethod(m)
    setCashReceived('')
    setCardRef('')
    setSplitAmounts({ cash: '', upi: '', card: '', credit: '' })
    setCreditError('')
  }

  // F2-F5 keyboard shortcuts for method selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return
      if (e.key === 'F2') { e.preventDefault(); selectMethod('cash') }
      if (e.key === 'F3') { e.preventDefault(); selectMethod('upi') }
      if (e.key === 'F4') { e.preventDefault(); selectMethod('card') }
      if (e.key === 'F5') { e.preventDefault(); selectMethod('credit') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [disabled, activeMethod])

  // Customer search
  const handleCustomerSearch = useCallback(async (q: string) => {
    setCustomerSearch(q)
    setCreditError('')
    if (q.length < 2) { setCustomerResults([]); return }
    const results = await searchCustomers(q)
    setCustomerResults(results)
  }, [])

  const selectCustomer = (c: Customer) => {
    setSelectedCustomerLocal(c)
    setSelectedCustomer(c.id!)
    setCustomerSearch('')
    setCustomerResults([])
    setCreditError('')
  }

  const clearCustomer = () => {
    setSelectedCustomerLocal(null)
    setSelectedCustomer(null)
    setCustomerSearch('')
    setCustomerResults([])
    setCreditError('')
    setShowCustomerForm(false)
    setPhoneInput('')
    setNameInput('')
    setFoundCustomer(null)
    setLookupDone(false)
  }

  const handlePhoneChange = async (val: string) => {
    setPhoneInput(val)
    setFoundCustomer(null)
    setLookupDone(false)
    setNameInput('')
    if (val.length === 10) {
      const match = await getCustomerByPhone(val)
      if (match) {
        setFoundCustomer(match)
        setNameInput(match.name)
      }
      setLookupDone(true)
    }
  }

  const handleAttachCustomer = async () => {
    if (foundCustomer) {
      selectCustomer(foundCustomer)
    } else {
      const name = nameInput.trim()
      const phone = phoneInput.trim()
      if (!name && !phone) { setShowCustomerForm(false); return }
      const id = await upsertCustomer({
        name: name || 'Customer',
        phone: phone || undefined,
        creditLimit: 0,
        currentBalance: 0,
        loyaltyPoints: 0,
        creditApproved: false,
        creditRequested: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const created = await getCustomerById(id)
      if (created) selectCustomer(created)
    }
    setShowCustomerForm(false)
    setPhoneInput('')
    setNameInput('')
    setFoundCustomer(null)
    setLookupDone(false)
  }

  // Denomination button fills nearest multiple ≥ grandTotal
  const handleDenomination = (denom: number) => {
    const needed = Math.ceil(grandTotal / denom) * denom
    setCashReceived(needed.toString())
  }

  const cashAmount = parseAmount(cashReceived)
  const cashReturn = cashAmount - grandTotal

  // Complete handlers
  const complete = async (payments: PaymentEntry[], change = 0, customerId?: number) => {
    if (completing) return
    setCompleting(true)
    try {
      await onComplete(payments, change, customerId)
      setActiveMethod(null)
      setCashReceived('')
      setCardRef('')
      setSplitAmounts({ cash: '', upi: '', card: '', credit: '' })
    } finally {
      setCompleting(false)
    }
  }

  const handleCash = () => {
    complete([{ method: 'cash', amount: grandTotal }], cashReturn)
  }

  const handleUpi = () => {
    complete([{ method: 'upi', amount: grandTotal }], 0, selectedCustomer?.id)
  }

  const handleCard = () => {
    complete([{ method: 'card', amount: grandTotal, referenceNo: cardRef || undefined }], 0, selectedCustomer?.id)
  }

  const handleCredit = () => {
    if (!selectedCustomer) return
    if (!selectedCustomer.creditApproved) {
      setCreditError(`Credit not enabled for ${selectedCustomer.name}. Go to Customers page to request.`)
      return
    }
    const currentBalance = toFiniteNumber(selectedCustomer.currentBalance)
    const newBalance = currentBalance + grandTotal
    if (newBalance > selectedCustomer.creditLimit) {
      setCreditError(`Limit exceeded. Limit: ${formatCurrency(selectedCustomer.creditLimit)}, Would be: ${formatCurrency(newBalance)}`)
      return
    }
    complete([{ method: 'credit', amount: grandTotal, customerId: selectedCustomer.id }], 0, selectedCustomer.id)
  }

  // Split
  const splitTotal = (Object.values(splitAmounts) as string[]).reduce((s, v) => s + parseAmount(v), 0)
  const splitRemaining = grandTotal - splitTotal

  const handleSplit = () => {
    const payments: PaymentEntry[] = []
    for (const [method, value] of Object.entries(splitAmounts)) {
      const amount = parseAmount(value)
      if (amount > 0) {
        const entry: PaymentEntry = { method: method as PaymentMethod, amount }
        if (method === 'credit' && selectedCustomer) entry.customerId = selectedCustomer.id
        payments.push(entry)
      }
    }
    complete(payments, 0, selectedCustomer?.id)
  }

  // Hold bill
  const handleHold = () => {
    holdCurrentBill()
    setActiveMethod(null)
  }

  const handleRecall = (id: string) => {
    if (items.length > 0) {
      setRecallConfirmId(id)
    } else {
      recallHeldBill(id)
      setShowHeldBills(false)
    }
  }

  const store = loadStoreConfig()
  const upiLink = `upi://pay?pa=${store.upiVpa}&pn=${encodeURIComponent(store.name)}&am=${grandTotal.toFixed(2)}&tn=TXN-${Date.now()}&cu=INR`

  const earnedPoints = Math.floor(grandTotal / 100)

  return (
    <div className="flex w-full md:w-80 flex-col border-l border-gray-200 bg-white overflow-y-auto">

      {/* Customer selector */}
      <div className="border-b border-gray-100 px-4 py-3">
        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedCustomer.name || 'Customer'}</p>
              <p className="text-xs text-gray-500">
                {selectedCustomer.phone ? `${selectedCustomer.phone} · ` : ''}
                ⭐ {selectedCustomer.loyaltyPoints} pts
                {toFiniteNumber(selectedCustomer.currentBalance) > 0
                  ? ` · owes ${formatCurrency(toFiniteNumber(selectedCustomer.currentBalance))}`
                  : ''}
              </p>
            </div>
            <button onClick={clearCustomer} className="text-gray-400 hover:text-gray-600 ml-2">
              <X size={14} />
            </button>
          </div>
        ) : !showCustomerForm ? (
          <button
            onClick={() => setShowCustomerForm(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-400 hover:border-brand-500 hover:text-brand-500 transition-colors"
          >
            <User size={14} />
            Add Customer (optional)
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => handlePhoneChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Phone number (optional)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                autoFocus
                maxLength={10}
              />
              <button onClick={() => { setShowCustomerForm(false); setPhoneInput(''); setNameInput(''); setFoundCustomer(null); setLookupDone(false) }}
                className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            {lookupDone && foundCustomer && (
              <p className="text-xs text-green-600 px-1">✓ Found: {foundCustomer.name}</p>
            )}
            {(lookupDone && !foundCustomer) || (!lookupDone && phoneInput.length === 0) ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Customer name (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            ) : null}
            {phoneInput.length > 0 && phoneInput.length < 10 && (
              <p className="text-xs text-gray-400 px-1">{10 - phoneInput.length} more digits…</p>
            )}
            <button
              onClick={handleAttachCustomer}
              disabled={phoneInput.length > 0 && phoneInput.length < 10}
              className="btn-primary w-full py-1.5 text-sm disabled:opacity-40"
            >
              {foundCustomer ? 'Attach Customer' : 'Add & Attach'}
            </button>
          </div>
        )}
      </div>

      {/* Bill totals */}
      <div className="border-b border-gray-100 px-4 py-3 space-y-1.5">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {itemDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Item Discounts</span>
            <span>-{formatCurrency(itemDiscount)}</span>
          </div>
        )}

        {/* Bill discount */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 flex-shrink-0">Discount</span>
          <input
            type="number"
            value={billDiscount.value || ''}
            min={0}
            step={billDiscount.mode === 'percent' ? 1 : 0.5}
            onChange={(e) => setBillDiscount(billDiscount.mode, parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-16 rounded border border-gray-200 px-2 py-0.5 text-right text-sm focus:border-brand-500 focus:outline-none"
          />
          <div className="flex rounded border border-gray-200 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setBillDiscount('percent', billDiscount.value)}
              className={cn('px-2 py-0.5', billDiscount.mode === 'percent' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
            >%</button>
            <button
              onClick={() => setBillDiscount('flat', billDiscount.value)}
              className={cn('px-2 py-0.5 border-l border-gray-200', billDiscount.mode === 'flat' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
            >₹</button>
          </div>
          {billDiscountAmount > 0 && (
            <span className="text-sm text-green-600 ml-auto">-{formatCurrency(billDiscountAmount)}</span>
          )}
        </div>

        {/* GST breakdown */}
        {gstSlabs.filter((s) => s.rate > 0).map((slab) => (
          <div key={slab.rate} className="flex justify-between text-xs text-gray-400">
            <span>GST {slab.rate}% (CGST+SGST)</span>
            <span>{formatCurrency(slab.cgst + slab.sgst)}</span>
          </div>
        ))}
        {taxTotal > 0 && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Total GST</span>
            <span>{formatCurrency(taxTotal)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
          <span>Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>

        {selectedCustomer && earnedPoints > 0 && (
          <p className="text-xs text-amber-600">⭐ Will earn {earnedPoints} loyalty pts</p>
        )}
      </div>

      {/* Payment method buttons */}
      <div className="border-b border-gray-100 px-3 py-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Payment Method</p>
        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
          {([
            { id: 'cash', label: 'Cash', key: 'F2', emoji: '💵' },
            { id: 'upi',  label: 'UPI',  key: 'F3', emoji: '📱' },
            { id: 'card', label: 'Card', key: 'F4', emoji: '💳' },
          ] as const).map((m) => (
            <button
              key={m.id}
              onClick={() => selectMethod(m.id)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center rounded-lg px-2 py-2 text-xs font-medium transition-colors disabled:opacity-40',
                activeMethod === m.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <span className="text-base">{m.emoji}</span>
              <span>{m.label}</span>
              <span className={cn('text-[10px]', activeMethod === m.id ? 'text-brand-100' : 'text-gray-400')}>{m.key}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { id: 'credit', label: 'Credit', key: 'F5', emoji: '📒' },
            { id: 'split',  label: 'Split',  key: '',   emoji: '⚡' },
          ] as const).map((m) => (
            <button
              key={m.id}
              onClick={() => selectMethod(m.id)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center rounded-lg px-2 py-2 text-xs font-medium transition-colors disabled:opacity-40',
                activeMethod === m.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <span className="text-base">{m.emoji}</span>
              <span>{m.label}</span>
              {m.key && <span className={cn('text-[10px]', activeMethod === m.id ? 'text-brand-100' : 'text-gray-400')}>{m.key}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Active payment panel */}
      <div className="flex-1 px-4 py-3">

        {/* CASH */}
        {activeMethod === 'cash' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cash Received</label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="input-field text-xl font-bold text-right"
                autoFocus
                min={0}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {DENOMINATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDenomination(d)}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-brand-500"
                >
                  ₹{d}
                </button>
              ))}
              <button
                onClick={() => setCashReceived(Math.ceil(grandTotal).toString())}
                className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-brand-500"
              >
                Exact
              </button>
            </div>
            {cashReceived && (
              <div className={cn('rounded-lg p-3 text-center', cashReturn >= 0 ? 'bg-green-50' : 'bg-red-50')}>
                <p className="text-xs text-gray-500">Cash Return</p>
                <p className={cn('text-3xl font-bold', cashReturn >= 0 ? 'text-green-700' : 'text-red-600')}>
                  {formatCurrency(Math.abs(cashReturn))}
                </p>
                {cashReturn < 0 && <p className="text-xs text-red-500 mt-1">Insufficient amount</p>}
              </div>
            )}
            <button
              onClick={handleCash}
              disabled={cashAmount < grandTotal || completing}
              className="btn-primary w-full py-3 font-bold disabled:opacity-50"
            >
              {completing ? 'Saving…' : '✓ Complete Cash Payment'}
            </button>
          </div>
        )}

        {/* UPI */}
        {activeMethod === 'upi' && (
          <div className="space-y-3 text-center">
            <p className="text-xs text-gray-500">Scan to pay {formatCurrency(grandTotal)}</p>
            <div className="flex justify-center">
              <div className="rounded-xl border-4 border-brand-50 p-2 bg-white shadow-sm">
                <QRCodeSVG value={upiLink} size={160} />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-mono break-all">{upiLink}</p>
            <button onClick={handleUpi} disabled={completing} className="btn-primary w-full py-3 font-bold">
              {completing ? 'Saving…' : '✓ Payment Received'}
            </button>
          </div>
        )}

        {/* CARD */}
        {activeMethod === 'card' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ref / Last 4 digits (optional)</label>
              <input
                type="text"
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value)}
                placeholder="e.g. 4532"
                className="input-field"
                autoFocus
                maxLength={20}
              />
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500">Amount to charge</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
            </div>
            <button onClick={handleCard} disabled={completing} className="btn-primary w-full py-3 font-bold">
              {completing ? 'Saving…' : '✓ Complete Card Payment'}
            </button>
          </div>
        )}

        {/* CREDIT */}
        {activeMethod === 'credit' && (
          <div className="space-y-3">
            {!selectedCustomer ? (
              <>
                <label className="block text-xs font-medium text-gray-600">Select Customer</label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  placeholder="Name or phone..."
                  className="input-field"
                  autoFocus
                />
                {customerResults.length > 0 && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.phone}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-red-500">owes {formatCurrency(toFiniteNumber(c.currentBalance))}</p>
                          <p className="text-gray-400">limit {formatCurrency(c.creditLimit)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg bg-brand-50 p-3 text-sm space-y-1">
                <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>Current: <strong className="text-red-600">{formatCurrency(toFiniteNumber(selectedCustomer.currentBalance))}</strong></span>
                  <span>After: <strong>{formatCurrency(toFiniteNumber(selectedCustomer.currentBalance) + grandTotal)}</strong></span>
                </div>
                <p className="text-xs text-gray-500">Limit: {formatCurrency(selectedCustomer.creditLimit)}</p>
              </div>
            )}
            {creditError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{creditError}</div>
            )}
            <button
              onClick={handleCredit}
              disabled={!selectedCustomer || completing}
              className="btn-primary w-full py-3 font-bold disabled:opacity-50"
            >
              {completing ? 'Saving…' : '✓ Add to Credit'}
            </button>
          </div>
        )}

        {/* SPLIT */}
        {activeMethod === 'split' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Total: {formatCurrency(grandTotal)}</p>
            {(['cash', 'upi', 'card'] as const).map((m) => (
              <div key={m}>
                <label className="block text-xs font-medium text-gray-600 mb-0.5 capitalize">{m} (₹)</label>
                <input
                  type="number"
                  value={splitAmounts[m]}
                  onChange={(e) => setSplitAmounts((prev) => ({ ...prev, [m]: e.target.value }))}
                  placeholder="0"
                  className="input-field text-sm"
                  min={0}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Credit (₹)</label>
              <input
                type="number"
                value={splitAmounts.credit}
                onChange={(e) => setSplitAmounts((prev) => ({ ...prev, credit: e.target.value }))}
                placeholder="0"
                className="input-field text-sm"
                min={0}
              />
              {parseAmount(splitAmounts.credit) > 0 && !selectedCustomer && (
                <div className="mt-1">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    placeholder="Search customer for credit…"
                    className="input-field text-xs"
                  />
                  {customerResults.map((c) => (
                    <button key={c.id} onClick={() => selectCustomer(c)}
                      className="flex w-full justify-between px-3 py-1.5 text-xs hover:bg-gray-50 border border-gray-100">
                      <span>{c.name}</span>
                      <span className="text-red-500">{formatCurrency(toFiniteNumber(c.currentBalance))}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && parseAmount(splitAmounts.credit) > 0 && (
                <div className="mt-1 flex items-center justify-between rounded bg-brand-50 px-2 py-1 text-xs">
                  <span className="font-medium text-brand-800">{selectedCustomer.name}</span>
                  <button onClick={clearCustomer} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </div>
              )}
            </div>
            <div className={cn('rounded-lg p-3 text-center', Math.abs(splitRemaining) < 0.01 ? 'bg-green-50' : 'bg-yellow-50')}>
              <p className="text-xs text-gray-500">Remaining</p>
              <p className={cn('text-xl font-bold', Math.abs(splitRemaining) < 0.01 ? 'text-green-700' : 'text-yellow-700')}>
                {formatCurrency(Math.max(0, splitRemaining))}
              </p>
            </div>
            {parseAmount(splitAmounts.credit) > 0 && !selectedCustomer && (
              <p className="text-xs text-center text-red-500">Select a customer for credit portion</p>
            )}
            <button
              onClick={handleSplit}
              disabled={Math.abs(splitRemaining) > 0.01 || (parseAmount(splitAmounts.credit) > 0 && !selectedCustomer) || completing}
              className="btn-primary w-full py-3 font-bold disabled:opacity-50"
            >
              {completing ? 'Saving…' : '✓ Complete Split Payment'}
            </button>
          </div>
        )}

        {!activeMethod && !disabled && (
          <p className="text-center text-xs text-gray-400 py-4">Select a payment method above</p>
        )}
      </div>

      {/* Hold Bill + Held Bills */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-2">
        {items.length > 0 && (
          <button
            onClick={handleHold}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
          >
            <Clock size={13} />
            Hold Bill
          </button>
        )}

        {heldBills.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowHeldBills(!showHeldBills)}
              className="flex w-full items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 hover:bg-amber-100"
            >
              <span>📌 {heldBills.length} held bill{heldBills.length !== 1 ? 's' : ''}</span>
              <ChevronDown size={12} className={cn('transition-transform', showHeldBills && 'rotate-180')} />
            </button>
            {showHeldBills && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-gray-200 bg-white shadow-lg z-20 max-h-48 overflow-y-auto">
                {heldBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-gray-900 truncate max-w-28">{bill.label}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(bill.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRecall(bill.id)}
                        className="rounded bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-brand-700"
                      >
                        Recall
                      </button>
                      <button
                        onClick={() => discardHeldBill(bill.id)}
                        className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-100"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recall confirmation */}
      {recallConfirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 shadow-xl max-w-xs mx-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Replace current bill?</p>
            <p className="text-xs text-gray-500 mb-4">The current cart has items. Recalling will replace them.</p>
            <div className="flex gap-3">
              <button onClick={() => setRecallConfirmId(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button
                onClick={() => { recallHeldBill(recallConfirmId); setRecallConfirmId(null); setShowHeldBills(false) }}
                className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Recall
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
