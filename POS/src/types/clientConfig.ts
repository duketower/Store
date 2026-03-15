// Types for the multi-client distribution system.
// Each paying client gets their own build with these values baked in at compile time.
// Never import from `clients/` inside src/ — only vite.config.ts reads those files.

export type PlanTier = 'free' | 'pro' | 'enterprise'

// All features that can be gated behind a plan tier.
// Always use hasFeature() to check — never compare plan strings directly.
export type PlanFeature =
  // free tier
  | 'billing'
  | 'basic_inventory'
  | 'receipt_printer'
  // pro tier
  | 'dashboard'
  | 'reports'
  | 'firebase_sync'
  | 'multi_device'
  | 'credit_ledger'
  | 'rtv'
  | 'sheets_export'
  | 'advanced_reports'
  | 'weighing_scale'
  // enterprise only
  | 'api_webhooks'
  | 'custom_branding'

export interface ClientConfig {
  store: {
    name: string
    address: string
    city: string
    phone: string
    gstin: string
    upiVpa: string
    sheetsWebAppUrl: string
  }
  brand: {
    themeColor: string   // hex — used in PWA manifest + UI accent
    appName: string      // full name shown on home screen
    shortName: string    // short name for PWA icon label
  }
  plan: PlanTier
  clientId: string             // unique kebab-case slug (matches folder name)
  licenseExpiresAt: string     // ISO date string — checked at app boot
}

// Build metadata injected by vite.config.ts at compile time.
export interface AppBuild {
  version: string
  gitCommit: string
  builtAt: string    // ISO timestamp
  clientId: string
}
