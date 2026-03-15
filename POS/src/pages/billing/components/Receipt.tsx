import { Printer, MessageCircle } from 'lucide-react'
import type { Sale, SaleItem, Payment } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { calcGstInclusive, groupByGstSlab } from '@/utils/gst'
import { loadStoreConfig } from '@/utils/storeConfig'
import { formatReceiptText } from '@/utils/receiptText'

interface ReceiptItem extends SaleItem {
  productName: string
  unit: string
}

interface ReceiptProps {
  sale: Sale
  items: ReceiptItem[]
  payments: Payment[]
  cashierName: string
  change?: number
  onPrint?: () => void
}

export function Receipt({ sale, items, payments, cashierName, change, onPrint }: ReceiptProps) {
  const STORE_CONFIG = loadStoreConfig()
  const gstSlabs = groupByGstSlab(
    items.map((i) => ({
      unitPrice: i.unitPrice,
      qty: i.qty,
      discount: i.discount,
      taxRate: i.taxRate,
    }))
  )

  return (
    <div>
      {/* Action buttons (hidden on print) */}
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <button
          onClick={() => {
            const text = formatReceiptText(sale, items, payments, STORE_CONFIG.name, cashierName)
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
          }}
          className="btn-secondary flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
        >
          <MessageCircle size={16} /> WhatsApp
        </button>
        {onPrint && (
          <button onClick={onPrint} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> Print
          </button>
        )}
      </div>

      {/* Receipt content */}
      <div id="receipt-print" className="font-mono text-xs leading-relaxed max-w-xs mx-auto">
        {/* Header */}
        <div className="text-center mb-3">
          <p className="text-base font-bold">{STORE_CONFIG.name}</p>
          <p>{STORE_CONFIG.address}</p>
          <p>{STORE_CONFIG.city}</p>
          <p>Ph: {STORE_CONFIG.phone}</p>
          <p>GSTIN: {STORE_CONFIG.gstin}</p>
          <p>{'='.repeat(42)}</p>
        </div>

        {/* Bill info */}
        <div className="mb-2">
          <div className="flex justify-between">
            <span>Bill No: {sale.billNo}</span>
            <span>{formatDateTime(sale.createdAt)}</span>
          </div>
          <p>Cashier: {cashierName}</p>
          <p>{'-'.repeat(42)}</p>
        </div>

        {/* Column headers */}
        <div className="flex font-bold mb-1">
          <span className="flex-1">ITEM</span>
          <span className="w-10 text-right">QTY</span>
          <span className="w-14 text-right">PRICE</span>
          <span className="w-14 text-right">TOTAL</span>
        </div>
        <p>{'-'.repeat(42)}</p>

        {/* Items */}
        {items.map((item, i) => {
          const { taxTotal } = calcGstInclusive(item.lineTotal, item.taxRate)
          return (
            <div key={i} className="mb-1">
              <div className="flex">
                <span className="flex-1 truncate">{item.productName}</span>
                <span className="w-10 text-right">{item.qty}{item.unit}</span>
                <span className="w-14 text-right">₹{item.unitPrice.toFixed(0)}</span>
                <span className="w-14 text-right">₹{item.lineTotal.toFixed(2)}</span>
              </div>
              {item.discount > 0 && (
                <p className="pl-2 text-gray-500">  Discount: -{formatCurrency(item.discount)}</p>
              )}
              {item.taxRate > 0 && (
                <p className="pl-2 text-gray-500">  GST {item.taxRate}%: ₹{taxTotal.toFixed(2)}</p>
              )}
            </div>
          )
        })}

        <p>{'-'.repeat(42)}</p>

        {/* Totals */}
        <Row label="Subtotal" value={`₹${sale.subtotal.toFixed(2)}`} />
        {sale.discount > 0 && <Row label="Discount" value={`-₹${sale.discount.toFixed(2)}`} />}
        <Row label="GST Total" value={`₹${sale.taxTotal.toFixed(2)}`} />
        <p>{'='.repeat(42)}</p>
        <Row label="GRAND TOTAL" value={`₹${sale.grandTotal.toFixed(2)}`} bold />
        <p>{'-'.repeat(42)}</p>

        {/* GST slab breakdown */}
        {gstSlabs.filter((s) => s.rate > 0).length > 0 && (
          <>
            <p className="font-bold mt-1">GST Breakdown:</p>
            {gstSlabs.filter((s) => s.rate > 0).map((slab) => (
              <Row
                key={slab.rate}
                label={`  CGST ${slab.rate / 2}% + SGST ${slab.rate / 2}%`}
                value={`₹${(slab.cgst + slab.sgst).toFixed(2)}`}
              />
            ))}
            <p>{'-'.repeat(42)}</p>
          </>
        )}

        {/* Payments */}
        {payments.map((p, i) => (
          <Row key={i} label={`  ${p.method.toUpperCase()}`} value={`₹${p.amount.toFixed(2)}`} />
        ))}
        {change !== undefined && change > 0 && (
          <Row label="  Change" value={`₹${change.toFixed(2)}`} />
        )}

        {/* Footer */}
        <div className="text-center mt-3">
          <p>{'='.repeat(42)}</p>
          <p className="font-bold">Thank you for shopping!</p>
          <p>Visit us again</p>
          <p className="text-gray-400 mt-2">Bill powered by POS</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
