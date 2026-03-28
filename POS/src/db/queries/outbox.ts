import { db } from '@/db'
import type { OutboxEntry } from '@/types'

interface QueueInput {
  action: string
  entityType: string
  entityKey?: string
  payload: string
  createdAt?: Date
}

export async function queueOutboxEntry(input: QueueInput): Promise<number> {
  const createdAt = input.createdAt ?? new Date()
  return db.outbox.add({
    action: input.action,
    entityType: input.entityType,
    entityKey: input.entityKey,
    payload: input.payload,
    status: 'pending',
    retryCount: 0,
    createdAt,
    updatedAt: createdAt,
  })
}

export async function markOutboxSyncing(id: number): Promise<void> {
  await db.outbox.update(id, {
    status: 'syncing',
    lastAttemptAt: new Date(),
    updatedAt: new Date(),
    lastError: undefined,
  })
}

export async function markOutboxSynced(id: number): Promise<void> {
  const now = new Date()
  await db.outbox.update(id, {
    status: 'pending',
    syncedAt: now,
    updatedAt: now,
    lastError: undefined,
  })
}

export async function markOutboxFailed(id: number, error: unknown): Promise<void> {
  const existing = await db.outbox.get(id)
  const now = new Date()
  await db.outbox.update(id, {
    status: 'failed',
    retryCount: (existing?.retryCount ?? 0) + 1,
    lastAttemptAt: now,
    lastError: error instanceof Error ? error.message : String(error ?? 'Unknown sync error'),
    updatedAt: now,
  })
}

export async function listPendingOutboxEntries(): Promise<OutboxEntry[]> {
  const entries = await db.outbox.orderBy('createdAt').reverse().toArray()
  return entries.filter(
    (entry) => entry.status === 'pending' || entry.status === 'failed' || entry.status === 'syncing'
  )
}

export async function getOutboxSummary(): Promise<{
  pending: number
  failed: number
  syncing: number
}> {
  const entries = await db.outbox.toArray()
  return entries.reduce(
    (acc, entry) => {
      if (entry.status === 'failed') acc.failed += 1
      else if (entry.status === 'syncing') acc.syncing += 1
      else acc.pending += 1
      return acc
    },
    { pending: 0, failed: 0, syncing: 0 }
  )
}
