// Outbox pattern removed — all writes go directly to Firestore via syncXToFirestore().
// These stubs exist so any remaining import sites compile without modification.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queueOutboxEntry(_input: any): Promise<number> {
  return Promise.resolve(0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function markOutboxSyncing(_id: number): Promise<void> {
  return Promise.resolve()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function markOutboxSynced(_id: number): Promise<void> {
  return Promise.resolve()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function markOutboxFailed(_id: number, _error: unknown): Promise<void> {
  return Promise.resolve()
}

export async function listPendingOutboxEntries(): Promise<never[]> {
  return Promise.resolve([])
}

export async function getOutboxSummary(): Promise<{ pending: number; failed: number; syncing: number }> {
  return Promise.resolve({ pending: 0, failed: 0, syncing: 0 })
}
