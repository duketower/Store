import { db } from '@/db'
import type { DaySession } from '@/types'

export async function getOpenSession(): Promise<DaySession | undefined> {
  return db.day_sessions.where('status').equals('open').first()
}

export async function openSession(employeeId: number, openingFloat: number): Promise<number> {
  return db.day_sessions.add({
    openedBy: employeeId,
    openingFloat,
    status: 'open',
    openedAt: new Date(),
  })
}

export async function closeSession(
  sessionId: number,
  closedBy: number,
  closingCash: number,
  expectedCash: number,
  varianceNote?: string
): Promise<void> {
  const variance = closingCash - expectedCash
  await db.day_sessions.update(sessionId, {
    closedBy,
    closingCash,
    expectedCash,
    variance,
    varianceNote,
    status: 'closed',
    closedAt: new Date(),
  })
}

export async function getTodaySessions(): Promise<DaySession[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  return db.day_sessions.where('openedAt').aboveOrEqual(startOfDay).toArray()
}
