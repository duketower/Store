import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types'
import { ROUTES } from '@/constants/routes'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: Role[]
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (requiredRoles && role && !requiredRoles.includes(role)) {
    return <Navigate to={ROUTES.BILLING} replace />
  }

  return <>{children}</>
}
