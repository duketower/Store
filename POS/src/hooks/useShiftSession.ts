import { useEffect } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export function useShiftSession() {
  const { currentSession, setCurrentSession } = useSessionStore()
  const daySessions = useFirestoreDataStore((s) => s.daySessions)

  // Keep sessionStore in sync whenever the daySessions list changes
  useEffect(() => {
    const open = daySessions.find((s) => s.status === 'open') ?? null
    setCurrentSession(open)
  }, [daySessions, setCurrentSession])

  return { currentSession, setCurrentSession }
}
