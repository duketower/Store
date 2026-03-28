import { db } from '@/db'
import type { CashEntry } from '@/types'
import { createSyncId } from '@/utils/syncIds'
import { queueOutboxEntry } from './outbox'
import { syncCashEntryToFirestore } from '@/services/firebase/sync'

export async function addCashEntry(entry: Omit<CashEntry, 'id'>): Promise<number> {
  const now = new Date()
  const cashEntry: CashEntry = {
    ...entry,
    syncId: entry.syncId ?? createSyncId('cash'),
  }

  const id = await db.transaction('rw', [db.cash_entries, db.outbox], async () => {
    const cashEntryId = await db.cash_entries.add(cashEntry)
    await queueOutboxEntry({
      action: 'upsert_cash_entry',
      entityType: 'cash_entry',
      entityKey: cashEntry.syncId,
      payload: JSON.stringify({
        ...cashEntry,
        createdAt: cashEntry.createdAt.toISOString(),
      }),
      createdAt: now,
    })
    return cashEntryId
  })

  syncCashEntryToFirestore(cashEntry).catch((err: unknown) =>
    console.warn('[Firestore] cash entry sync failed (will retry):', err)
  )

  return id
}

export async function getTodayCashEntries(): Promise<CashEntry[]> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return db.cash_entries.where('createdAt').aboveOrEqual(start).toArray()
}

export async function getTodayCashOutTotal(): Promise<number> {
  const entries = await getTodayCashEntries()
  return entries.reduce((s, e) => s + e.amount, 0)
}

export async function getSessionCashEntries(sessionId: number): Promise<CashEntry[]> {
  return db.cash_entries.where('sessionId').equals(sessionId).toArray()
}
