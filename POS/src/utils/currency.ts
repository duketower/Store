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
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
  return isNaN(parsed) ? 0 : Math.max(0, parsed)
}
