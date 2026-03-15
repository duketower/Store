import type { Sale, SaleItem, Payment } from '@/types'

interface ReceiptItem extends SaleItem {
  productName: string
  unit: string
}

export function formatReceiptText(
  sale: Sale,
  items: ReceiptItem[],
  payments: Payment[],
  storeName: string,
  cashierName: string
): string {
  const line = (label: string, value: string) => {
    const pad = 28 - label.length - value.length
    return `${label}${' '.repeat(Math.max(1, pad))}${value}`
  }
  const sep = '-'.repeat(32)
  const dbl = '='.repeat(32)

  const lines: string[] = [
    dbl,
    storeName.toUpperCase(),
    dbl,
    `Bill: ${sale.billNo}`,
    `Cashier: ${cashierName}`,
    sep,
  ]

  for (const item of items) {
    lines.push(`${item.productName}`)
    lines.push(line(`  ${item.qty}${item.unit} x ₹${item.unitPrice.toFixed(0)}`, `₹${item.lineTotal.toFixed(2)}`))
    if (item.discount > 0) lines.push(`  Disc: -₹${item.discount.toFixed(2)}`)
  }

  lines.push(sep)
  lines.push(line('Subtotal', `₹${sale.subtotal.toFixed(2)}`))
  if (sale.discount > 0) lines.push(line('Discount', `-₹${sale.discount.toFixed(2)}`))
  if (sale.taxTotal > 0) lines.push(line('GST', `₹${sale.taxTotal.toFixed(2)}`))
  lines.push(dbl)
  lines.push(line('TOTAL', `₹${sale.grandTotal.toFixed(2)}`))
  lines.push(sep)

  for (const p of payments) {
    lines.push(line(p.method.toUpperCase(), `₹${p.amount.toFixed(2)}`))
  }

  lines.push(dbl)
  lines.push('Thank you for shopping! 🛍️')
  lines.push(dbl)

  return lines.join('\n')
}
