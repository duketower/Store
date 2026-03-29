let fallbackSequence = 0

function nextFallbackSequence(modulo = 1024): number {
  fallbackSequence = (fallbackSequence + 1) % modulo
  return fallbackSequence
}

export function createSyncId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  const perfStamp = typeof performance !== 'undefined'
    ? Math.floor(performance.now() * 1000).toString(36)
    : '0'
  return `${prefix}-${Date.now().toString(36)}-${nextFallbackSequence(1_000_000).toString(36)}-${perfStamp}`
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

  const nextId = Date.now() * 1024 + nextFallbackSequence()
  return nextId === 0 ? Date.now() : nextId
}
