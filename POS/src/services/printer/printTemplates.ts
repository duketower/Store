import { CMD, buildDocument, twoCol, separator, padRight, padLeft } from './escpos'
import { formatDateTime } from '@/utils/date'
import { formatAmount } from '@/utils/currency'
import { loadStoreConfig } from '@/utils/storeConfig'

export interface ReceiptItem {
  name: string
  qty: number
  unit: string
  unitPrice: number
  discount: number
  taxRate: number
  lineTotal: number
}

export interface ReceiptPayment {
  method: string
  amount: number
}

export interface ReceiptTemplateData {
  billNo: string
  cashierName: string
  createdAt: Date
  items: ReceiptItem[]
  subtotal: number
  itemDiscount: number
  taxTotal: number
  grandTotal: number
  payments: ReceiptPayment[]
  gstSlabs: Array<{ rate: number; cgst: number; sgst: number }>
  change?: number
}

const W = 42  // 80mm paper ≈ 42 chars at 12cpi

export function buildReceiptBytes(data: ReceiptTemplateData): Uint8Array {
  const lines: (number[] | string)[] = []
  const store = loadStoreConfig()

  const add = (...parts: (number[] | string)[]) => lines.push(...parts)

  // Header
  add(CMD.INIT)
  add(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.FONT_DOUBLE)
  add(store.name + '\n')
  add(CMD.FONT_NORMAL, CMD.BOLD_OFF)
  add(store.address + '\n')
  add(store.city + '\n')
  add('Ph: ' + store.phone + '\n')
  add('GSTIN: ' + store.gstin + '\n')
  add(separator(W, '=') + '\n')

  // Bill info
  add(CMD.ALIGN_LEFT)
  add(twoCol('Bill No: ' + data.billNo, formatDateTime(data.createdAt), W) + '\n')
  add('Cashier: ' + data.cashierName + '\n')
  add(separator(W) + '\n')

  // Column headers
  add(CMD.BOLD_ON)
  add(padRight('ITEM', 22) + padLeft('QTY', 6) + padLeft('PRICE', 7) + padLeft('TOTAL', 7) + '\n')
  add(CMD.BOLD_OFF)
  add(separator(W) + '\n')

  // Items
  for (const item of data.items) {
    const nameLine = item.name.substring(0, 22)
    const qtyStr = item.qty.toString() + item.unit
    const priceStr = formatAmount(item.unitPrice)
    const totalStr = formatAmount(item.lineTotal)
    add(padRight(nameLine, 22) + padLeft(qtyStr, 6) + padLeft(priceStr, 7) + padLeft(totalStr, 7) + '\n')
    if (item.discount > 0) {
      add('  Discount: -' + formatAmount(item.discount) + '\n')
    }
  }

  add(separator(W) + '\n')

  // Totals
  add(twoCol('Subtotal', '₹' + formatAmount(data.subtotal), W) + '\n')
  if (data.itemDiscount > 0) {
    add(twoCol('Discount', '-₹' + formatAmount(data.itemDiscount), W) + '\n')
  }
  add(twoCol('Tax (GST)', '₹' + formatAmount(data.taxTotal), W) + '\n')
  add(separator(W) + '\n')
  add(CMD.BOLD_ON)
  add(twoCol('GRAND TOTAL', '₹' + formatAmount(data.grandTotal), W) + '\n')
  add(CMD.BOLD_OFF)

  // GST breakdown
  if (data.gstSlabs.length > 0) {
    add(separator(W, '-') + '\n')
    add('GST Breakdown:\n')
    for (const slab of data.gstSlabs) {
      if (slab.rate > 0) {
        add(
          twoCol(
            `  CGST ${slab.rate / 2}% + SGST ${slab.rate / 2}%`,
            '₹' + formatAmount(slab.cgst + slab.sgst),
            W
          ) + '\n'
        )
      }
    }
  }

  // Payments
  add(separator(W, '-') + '\n')
  for (const payment of data.payments) {
    add(twoCol('  ' + payment.method.toUpperCase(), '₹' + formatAmount(payment.amount), W) + '\n')
  }
  if (data.change && data.change > 0) {
    add(twoCol('  Change', '₹' + formatAmount(data.change), W) + '\n')
  }

  // Footer
  add(separator(W, '=') + '\n')
  add(CMD.ALIGN_CENTER)
  add('Thank you for shopping!\n')
  add('Visit us again\n')
  add('\n\n\n')
  add(CMD.CUT)

  return buildDocument(...lines)
}
