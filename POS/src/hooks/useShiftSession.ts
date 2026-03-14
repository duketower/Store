import { useEffect } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { getOpenSession } from '@/db/queries/daySessions'

export function useShiftSession() {
  const { currentSession, setCurrentSession } = useSessionStore()

  useEffect(() => {
    getOpenSession().then((session) => setCurrentSession(session ?? null))
  }, [setCurrentSession])

  return { currentSession, setCurrentSession }
}
