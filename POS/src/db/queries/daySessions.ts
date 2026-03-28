import { db } from '@/db'
import type { DaySession } from '@/types'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { queueOutboxEntry } from './outbox'
import { syncSessionToFirestore } from '@/services/firebase/sync'

export async function getOpenSession(): Promise<DaySession | undefined> {
  return db.day_sessions.where('status').equals('open').first()
}

export async function openSession(employeeId: number, openingFloat: number): Promise<number> {
  const session: DaySession = {
    id: createEntityId(),
    syncId: createSyncId('session'),
    openedBy: employeeId,
    openingFloat,
    status: 'open',
    openedAt: new Date(),
  }

  const id = await db.transaction('rw', [db.day_sessions, db.outbox], async () => {
    const sessionId = session.id!
    await db.day_sessions.put(session)
    await queueOutboxEntry({
      action: 'upsert_day_session',
      entityType: 'day_session',
      entityKey: session.syncId,
      payload: JSON.stringify({
        ...session,
        openedAt: session.openedAt.toISOString(),
      }),
      createdAt: session.openedAt,
    })
    return sessionId
  })

  syncSessionToFirestore({ ...session, id }).catch((err: unknown) =>
    console.warn('[Firestore] session sync failed (will retry):', err)
  )

  return id
}

export async function closeSession(
  sessionId: number,
  closedBy: number,
  closingCash: number,
  expectedCash: number,
  varianceNote?: string
): Promise<void> {
  const variance = closingCash - expectedCash
  const closedAt = new Date()

  await db.transaction('rw', [db.day_sessions, db.outbox], async () => {
    await db.day_sessions.update(sessionId, {
      closedBy,
      closingCash,
      expectedCash,
      variance,
      varianceNote,
      status: 'closed',
      closedAt,
    })

    const session = await db.day_sessions.get(sessionId)
    if (!session?.syncId) return

    await queueOutboxEntry({
      action: 'upsert_day_session',
      entityType: 'day_session',
      entityKey: session.syncId,
      payload: JSON.stringify({
        ...session,
        closedBy,
        closingCash,
        expectedCash,
        variance,
        varianceNote,
        status: 'closed',
        openedAt: session.openedAt.toISOString(),
        closedAt: closedAt.toISOString(),
      }),
      createdAt: closedAt,
    })
  })

  const session = await db.day_sessions.get(sessionId)
  if (session) {
    syncSessionToFirestore(session).catch((err: unknown) =>
      console.warn('[Firestore] session close sync failed (will retry):', err)
    )
  }
}

export async function getTodaySessions(): Promise<DaySession[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  return db.day_sessions.where('openedAt').aboveOrEqual(startOfDay).toArray()
}
