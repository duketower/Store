export function createSyncId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createEntityId(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const parts = new Uint32Array(2)
    crypto.getRandomValues(parts)
    const high = parts[0] & 0x1fffff
    const low = parts[1]
    const nextId = high * 0x100000000 + low
    return nextId === 0 ? 1 : nextId
  }

  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) || Date.now()
}
