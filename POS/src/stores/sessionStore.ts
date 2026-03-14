import { create } from 'zustand'
import type { DaySession } from '@/types'

interface SessionState {
  currentSession: DaySession | null
  setCurrentSession: (session: DaySession | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),
}))
