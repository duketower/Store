import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AuthSession } from '@/types'
import { isSessionExpired } from '@/auth/authService'

interface AuthState {
  session: AuthSession | null
  setSession: (session: AuthSession) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      session: null,

      setSession: (session) => set({ session }, false, 'auth/setSession'),

      logout: () => set({ session: null }, false, 'auth/logout'),

      isAuthenticated: () => {
        const { session } = get()
        if (!session) return false
        if (isSessionExpired(session)) {
          set({ session: null }, false, 'auth/expiredSession')
          return false
        }
        return true
      },
    }),
    { name: 'auth' }
  )
)
