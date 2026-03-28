// Format number as Indian Rupee
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format as plain number with 2 decimal places
export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

// Parse a string to number, returning 0 for invalid
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[₹\s]/g, '')
  if (!cleaned) return 0

  const signless = cleaned.replace(/^[+-]/, '')
  const [integerPart = '', decimalPart = ''] = signless.split('.')
  if (signless.split('.').length > 2) return 0

  if (
    integerPart.includes(',') &&
    !/^(\d{1,3}(,\d{3})+|\d{1,3}(,\d{2})*,\d{3})$/.test(integerPart)
  ) {
    return 0
  }

  if (decimalPart.includes(',')) return 0

  const normalized = cleaned.replace(/,/g, '')
  if (!/^[+-]?\d*(\.\d*)?$/.test(normalized)) return 0

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}
