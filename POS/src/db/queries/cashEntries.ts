import { db } from '@/db'
import type { CashEntry } from '@/types'

export async function addCashEntry(entry: Omit<CashEntry, 'id'>): Promise<number> {
  return db.cash_entries.add(entry)
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
