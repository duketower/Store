import type { CashEntry } from '@/types'
import { createSyncId } from '@/utils/syncIds'
import { syncCashEntryToFirestore } from '@/services/firebase/sync'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export async function addCashEntry(entry: Omit<CashEntry, 'id'>): Promise<number> {
  const cashEntry: CashEntry = {
    ...entry,
    syncId: entry.syncId ?? createSyncId('cash'),
  }
  await syncCashEntryToFirestore(cashEntry)
  return Date.now()
}

export async function getTodayCashEntries(): Promise<CashEntry[]> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const entries = useFirestoreDataStore.getState().cashEntries
  return entries.filter((e) => {
    const createdAt = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt)
    return createdAt >= start
  })
}

export async function getTodayCashOutTotal(): Promise<number> {
  const entries = await getTodayCashEntries()
  return entries.reduce((s, e) => s + e.amount, 0)
}

export async function getSessionCashEntries(sessionId: number): Promise<CashEntry[]> {
  const entries = useFirestoreDataStore.getState().cashEntries
  return entries.filter((e) => e.sessionId === sessionId)
}
