export function createSyncId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

let entityCounter = 0

export function createEntityId(): number {
  entityCounter = (entityCounter + 1) % 1000
  return Date.now() * 1000 + entityCounter
}
