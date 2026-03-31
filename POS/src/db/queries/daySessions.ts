import type { DaySession } from '@/types'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { syncSessionToFirestore } from '@/services/firebase/sync'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export async function getOpenSession(): Promise<DaySession | undefined> {
  const sessions = useFirestoreDataStore.getState().daySessions
  return sessions.find((s) => s.status === 'open')
}

export async function openSession(employeeId: number, openingFloat: number): Promise<number> {
  const id = createEntityId()
  const session: DaySession = {
    id,
    syncId: createSyncId('session'),
    openedBy: employeeId,
    openingFloat,
    status: 'open',
    openedAt: new Date(),
  }

  await syncSessionToFirestore(session)
  return id
}

export async function closeSession(
  sessionId: number,
  closedBy: number,
  closingCash: number,
  expectedCash: number,
  varianceNote?: string
): Promise<void> {
  const sessions = useFirestoreDataStore.getState().daySessions
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) throw new Error('Session not found')
  if (session.status === 'closed') return

  const closedAt = new Date()
  const syncId = session.syncId ?? createSyncId('session')
  const nextSession: DaySession = {
    ...session,
    syncId,
    closedBy,
    closingCash,
    expectedCash,
    variance: closingCash - expectedCash,
    varianceNote,
    status: 'closed',
    closedAt,
  }

  await syncSessionToFirestore(nextSession)
}

export async function getTodaySessions(): Promise<DaySession[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const sessions = useFirestoreDataStore.getState().daySessions
  return sessions.filter((s) => {
    const openedAt = s.openedAt instanceof Date ? s.openedAt : new Date(s.openedAt)
    return openedAt >= startOfDay
  })
}
