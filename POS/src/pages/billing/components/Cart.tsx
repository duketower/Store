import { Trash2, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import type { CartItem } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { calcGstInclusive, groupByGstSlab } from '@/utils/gst'
import { cn } from '@/utils/cn'

interface CartProps {
  onPay: () => void
}

export function Cart({ onPay }: CartProps) {
  const { items, removeItem, updateQty, totals } = useCartStore()
  const { subtotal, itemDiscount, taxTotal, grandTotal } = totals()

  const gstSlabs = groupByGstSlab(items)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
        <div className="text-5xl mb-3">🛒</div>
        <p className="text-sm font-medium">Cart is empty</p>
        <p className="text-xs mt-1">Scan a barcode or search to add products</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Item list */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
            <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-center w-28">Qty</th>
              <th className="px-3 py-2 text-right w-24">Price</th>
              <th className="px-3 py-2 text-right w-24">Total</th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <CartRow
                key={item.productId}
                item={item}
                onUpdateQty={(qty) => updateQty(item.productId, qty)}
                onRemove={() => removeItem(item.productId)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals footer */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 space-y-1.5">
        <TotalRow label="Subtotal" value={subtotal} />
        {itemDiscount > 0 && (
          <TotalRow label="Discount" value={-itemDiscount} className="text-green-600" />
        )}

        {/* GST breakdown by slab */}
        {gstSlabs.filter((s) => s.rate > 0).map((slab) => (
          <div key={slab.rate} className="flex justify-between text-xs text-gray-500">
            <span>CGST {slab.rate / 2}% + SGST {slab.rate / 2}%</span>
            <span>{formatCurrency(slab.cgst + slab.sgst)}</span>
          </div>
        ))}

        {taxTotal > 0 && (
          <TotalRow label="Total GST" value={taxTotal} className="text-gray-500 text-xs" />
        )}

        <div className="border-t border-gray-200 pt-2 mt-2">
          <TotalRow label="Grand Total" value={grandTotal} bold />
        </div>

        <button
          onClick={onPay}
          disabled={items.length === 0}
          className="btn-primary w-full mt-3 py-3 text-base font-bold"
        >
          Pay {formatCurrency(grandTotal)}
        </button>
        <p className="text-center text-xs text-gray-400">Press F2 to open payment</p>
      </div>
    </div>
  )
}

interface CartRowProps {
  item: CartItem
  onUpdateQty: (qty: number) => void
  onRemove: () => void
  // onDiscount: (amount: number) => void
}

function CartRow({ item, onUpdateQty, onRemove }: CartRowProps) {
  const { taxTotal } = calcGstInclusive(item.lineTotal, item.taxRate)

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-3 py-2">
        <p className="font-medium text-gray-900 leading-tight">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.taxRate > 0 && (
            <span className="text-xs text-gray-400">GST {item.taxRate}%: {formatCurrency(taxTotal)}</span>
          )}
          {item.discount > 0 && (
            <span className="text-xs text-green-600">-{formatCurrency(item.discount)}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onUpdateQty(item.qty - (item.soldByWeight ? 0.1 : 1))}
            disabled={item.soldByWeight ? item.qty <= 0.1 : item.qty <= 1}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus size={12} />
          </button>
          <input
            type="number"
            value={item.qty}
            min={0.001}
            step={item.soldByWeight ? 0.001 : 1}
            onChange={(e) => onUpdateQty(parseFloat(e.target.value) || 0)}
            className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-center text-sm focus:border-blue-400 focus:outline-none"
          />
          <button
            onClick={() => onUpdateQty(item.qty + (item.soldByWeight ? 0.1 : 1))}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          >
            <Plus size={12} />
          </button>
        </div>
      </td>
      <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
      <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(item.lineTotal)}</td>
      <td className="px-3 py-2">
        <button
          onClick={onRemove}
          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

interface TotalRowProps {
  label: string
  value: number
  bold?: boolean
  className?: string
}

function TotalRow({ label, value, bold, className }: TotalRowProps) {
  return (
    <div className={cn('flex justify-between', bold ? 'text-base font-bold text-gray-900' : 'text-sm text-gray-600', className)}>
      <span>{label}</span>
      <span className={value < 0 ? 'text-green-600' : ''}>{formatCurrency(Math.abs(value))}</span>
    </div>
  )
}
