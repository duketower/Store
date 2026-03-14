export interface GstBreakdown {
  baseAmount: number  // price excluding tax
  cgst: number
  sgst: number
  taxTotal: number
  totalWithTax: number
}

// Tax-inclusive: MRP already includes GST (default for grocery retail)
export function calcGstInclusive(totalPrice: number, taxRate: number): GstBreakdown {
  if (taxRate === 0) {
    return { baseAmount: totalPrice, cgst: 0, sgst: 0, taxTotal: 0, totalWithTax: totalPrice }
  }
  const taxTotal = totalPrice - totalPrice / (1 + taxRate / 100)
  const baseAmount = totalPrice - taxTotal
  const cgst = taxTotal / 2
  const sgst = taxTotal / 2
  return { baseAmount, cgst, sgst, taxTotal, totalWithTax: totalPrice }
}

// Tax-exclusive: taxRate applied on top of base price
export function calcGstExclusive(basePrice: number, taxRate: number): GstBreakdown {
  const taxTotal = basePrice * (taxRate / 100)
  const cgst = taxTotal / 2
  const sgst = taxTotal / 2
  return { baseAmount: basePrice, cgst, sgst, taxTotal, totalWithTax: basePrice + taxTotal }
}

// Group cart items by GST slab for receipt
export interface GstSlabSummary {
  rate: number
  taxableAmount: number
  cgst: number
  sgst: number
}

export function groupByGstSlab(
  items: Array<{ unitPrice: number; qty: number; discount: number; taxRate: number }>
): GstSlabSummary[] {
  const slabMap = new Map<number, GstSlabSummary>()

  for (const item of items) {
    const lineGross = item.unitPrice * item.qty - item.discount
    const breakdown = calcGstInclusive(lineGross, item.taxRate)

    const existing = slabMap.get(item.taxRate)
    if (existing) {
      existing.taxableAmount += breakdown.baseAmount
      existing.cgst += breakdown.cgst
      existing.sgst += breakdown.sgst
    } else {
      slabMap.set(item.taxRate, {
        rate: item.taxRate,
        taxableAmount: breakdown.baseAmount,
        cgst: breakdown.cgst,
        sgst: breakdown.sgst,
      })
    }
  }

  return Array.from(slabMap.values()).sort((a, b) => a.rate - b.rate)
}
