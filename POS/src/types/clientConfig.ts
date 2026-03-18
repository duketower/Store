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
  | 'attendance'
  // enterprise only
  | 'api_webhooks'
  | 'custom_branding'

// Staff member from the client's requirement form.
// Passwords are NOT stored here (config is committed to git).
// Default credentials are set by seed.ts and communicated to the client on handover.
// Default passwords: admin → "Admin@1234", manager → "Manager@1234", cashier PIN → "1234"
export interface StaffMember {
  name: string
  role: 'admin' | 'manager' | 'cashier'
}

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
    // Optional per-client color overrides — if absent, defaults to blue
    primaryColor?: string       // e.g. '#1A4533' — buttons, active nav, focus rings
    primaryHoverColor?: string  // e.g. '#132e22' — button hover state
    primaryTintColor?: string   // e.g. '#edf2ef' — active nav background tint
    bgColor?: string            // e.g. '#F9F8F4' — app background
    textColor?: string          // e.g. '#2B2B2B' — body text
  }
  // Staff from the client's requirement form — seeded into IndexedDB on first app load.
  // If absent (dev mode), seed.ts uses hardcoded dev defaults instead.
  staff?: StaffMember[]
  plan: PlanTier
  clientId: string             // unique kebab-case slug (matches folder name)
  licenseExpiresAt: string     // ISO date string — checked at app boot
  // Firebase service account for this client build.
  // When present, app signs in with email/password instead of anonymously.
  // Absent in dev mode — dev uses anonymous auth so no credentials are needed locally.
  firebase?: {
    serviceEmail: string
    servicePassword: string
  }
}

// Build metadata injected by vite.config.ts at compile time.
export interface AppBuild {
  version: string
  gitCommit: string
  builtAt: string    // ISO timestamp
  clientId: string
}
