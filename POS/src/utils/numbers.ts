export function toFiniteNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function roundCurrency(value: number): number {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 100) / 100
}
