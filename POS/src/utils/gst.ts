import { roundCurrency, toFiniteNumber } from './numbers'

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

export interface DiscountableGstItem {
  unitPrice: number
  qty: number
  discount: number
  taxRate: number
}

export interface DiscountedGstLine extends DiscountableGstItem {
  lineGross: number
  lineBillDiscount: number
  lineNetTotal: number
  breakdown: GstBreakdown
}

export function buildDiscountedGstLines(
  items: DiscountableGstItem[],
  billDiscountAmount = 0
): DiscountedGstLine[] {
  const normalizedItems = items.map((item) => ({
    ...item,
    unitPrice: toFiniteNumber(item.unitPrice),
    qty: toFiniteNumber(item.qty),
    discount: toFiniteNumber(item.discount),
    taxRate: toFiniteNumber(item.taxRate),
  }))

  const lineGrossTotals = normalizedItems.map((item) =>
    roundCurrency(Math.max(0, item.unitPrice * item.qty - item.discount))
  )
  const afterItemDiscount = roundCurrency(lineGrossTotals.reduce((sum, value) => sum + value, 0))
  const clampedBillDiscount = roundCurrency(
    Math.min(Math.max(0, toFiniteNumber(billDiscountAmount)), afterItemDiscount)
  )
  const discountableIndexes = lineGrossTotals
    .map((value, index) => (value > 0 ? index : -1))
    .filter((index) => index >= 0)
  const lastDiscountableIndex =
    discountableIndexes.length > 0 ? discountableIndexes[discountableIndexes.length - 1] : -1
  let remainingDiscount = clampedBillDiscount

  return normalizedItems.map((item, index) => {
    const lineGross = lineGrossTotals[index]
    let lineBillDiscount = 0

    if (lineGross > 0 && clampedBillDiscount > 0 && afterItemDiscount > 0) {
      if (index === lastDiscountableIndex) {
        lineBillDiscount = remainingDiscount
      } else {
        lineBillDiscount = roundCurrency((lineGross / afterItemDiscount) * clampedBillDiscount)
        lineBillDiscount = Math.min(lineBillDiscount, remainingDiscount)
        remainingDiscount = roundCurrency(remainingDiscount - lineBillDiscount)
      }
    }

    const lineNetTotal = roundCurrency(Math.max(0, lineGross - lineBillDiscount))

    return {
      ...item,
      lineGross,
      lineBillDiscount,
      lineNetTotal,
      breakdown: calcGstInclusive(lineNetTotal, item.taxRate),
    }
  })
}

export function calculateInclusiveTaxTotal(
  items: DiscountableGstItem[],
  billDiscountAmount = 0
): number {
  return roundCurrency(
    buildDiscountedGstLines(items, billDiscountAmount).reduce(
      (sum, line) => sum + line.breakdown.taxTotal,
      0
    )
  )
}

export function groupByGstSlab(
  items: DiscountableGstItem[],
  billDiscountAmount = 0
): GstSlabSummary[] {
  const slabMap = new Map<number, GstSlabSummary>()

  for (const line of buildDiscountedGstLines(items, billDiscountAmount)) {
    const breakdown = line.breakdown

    const existing = slabMap.get(line.taxRate)
    if (existing) {
      existing.taxableAmount += breakdown.baseAmount
      existing.cgst += breakdown.cgst
      existing.sgst += breakdown.sgst
    } else {
      slabMap.set(line.taxRate, {
        rate: line.taxRate,
        taxableAmount: breakdown.baseAmount,
        cgst: breakdown.cgst,
        sgst: breakdown.sgst,
      })
    }
  }

  return Array.from(slabMap.values())
    .map((slab) => ({
      ...slab,
      taxableAmount: roundCurrency(slab.taxableAmount),
      cgst: roundCurrency(slab.cgst),
      sgst: roundCurrency(slab.sgst),
    }))
    .sort((a, b) => a.rate - b.rate)
}
