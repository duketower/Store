// Route-level plan-tier guard — wraps routes that require a specific feature.
// Complements ProtectedRoute (role guard) and nav hiding (cosmetic).
// Placed in routes/index.tsx around plan-gated routes.
// If the client's plan doesn't include the feature, redirects to /billing with a toast.

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { CLIENT_CONFIG } from '@/constants/clientConfig'
import { hasFeature, isLicenseExpired } from '@/constants/features'
import type { PlanFeature } from '@/types/clientConfig'
import { ROUTES } from '@/constants/routes'

interface ProtectedFeatureRouteProps {
  children: ReactNode
  feature: PlanFeature
}

export function ProtectedFeatureRoute({ children, feature }: ProtectedFeatureRouteProps) {
  // License expired = block everything (belt-and-suspenders; main.tsx also checks)
  if (isLicenseExpired(CLIENT_CONFIG.licenseExpiresAt)) {
    return <Navigate to={ROUTES.BILLING} replace />
  }

  // Feature not in plan = redirect to billing
  if (!hasFeature(CLIENT_CONFIG.plan, feature)) {
    return <Navigate to={ROUTES.BILLING} replace />
  }

  return <>{children}</>
}
