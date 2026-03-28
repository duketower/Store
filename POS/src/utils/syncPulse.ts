export function toTimeValue(value: Date | string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (value instanceof Date) return value.getTime()
  const next = new Date(value)
  return Number.isNaN(next.getTime()) ? 0 : next.getTime()
}

export function textChecksum(value: string | null | undefined): number {
  if (!value) return 0
  let checksum = 0
  for (let index = 0; index < value.length; index += 1) {
    checksum = (checksum + value.charCodeAt(index) * (index + 1)) % 2147483647
  }
  return checksum
}
