// Format date as DD-MM-YY
export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = String(date.getFullYear()).slice(-2)
  return `${d}-${m}-${y}`
}

// Format as DD-MM-YY HH:MM AM/PM
export function formatDateTime(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = String(date.getFullYear()).slice(-2)
  const hours = date.getHours()
  const mins = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h = String(hours % 12 || 12).padStart(2, '0')
  return `${d}-${m}-${y} ${h}:${mins} ${ampm}`
}

// Get today's start (midnight)
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// Add days to a date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Days between two dates (positive if date2 is after date1)
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((date2.getTime() - date1.getTime()) / msPerDay)
}
