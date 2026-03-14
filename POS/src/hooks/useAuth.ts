import { useAuthStore } from '@/stores/authStore'
import { canAccess, type Feature } from '@/auth/permissions'

export function useAuth() {
  const { session, logout, isAuthenticated } = useAuthStore()

  return {
    session,
    logout,
    isAuthenticated: isAuthenticated(),
    role: session?.role ?? null,
    employeeId: session?.employeeId ?? null,
    name: session?.name ?? null,
    can: (feature: Feature) => (session ? canAccess(session.role, feature) : false),
  }
}
