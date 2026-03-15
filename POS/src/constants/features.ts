// Plan feature matrix — defines which features are available per subscription tier.
// Add new features here before using hasFeature() anywhere in the app.
// Never check plan strings directly in UI — always use hasFeature().

import type { PlanFeature, PlanTier } from '@/types/clientConfig'

const PLAN_FEATURES: Record<PlanTier, PlanFeature[]> = {
  free: [
    'billing',
    'basic_inventory',
    'receipt_printer',
  ],
  pro: [
    'billing',
    'basic_inventory',
    'receipt_printer',
    'dashboard',
    'reports',
    'firebase_sync',
    'multi_device',
    'credit_ledger',
    'rtv',
    'sheets_export',
    'advanced_reports',
    'weighing_scale',
    'attendance',
  ],
  enterprise: [
    'billing',
    'basic_inventory',
    'receipt_printer',
    'dashboard',
    'reports',
    'firebase_sync',
    'multi_device',
    'credit_ledger',
    'rtv',
    'sheets_export',
    'advanced_reports',
    'weighing_scale',
    'attendance',
    'api_webhooks',
    'custom_branding',
  ],
}

/** Returns true if the given plan tier includes the given feature. */
export function hasFeature(plan: PlanTier, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan].includes(feature)
}

/** Returns true if the license expiry date has passed. */
export function isLicenseExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}
