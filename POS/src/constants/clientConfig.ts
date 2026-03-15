// Single source of truth for all client-specific config in the app.
// In production builds, __CLIENT_CONFIG__ is injected by vite.config.ts via define.
// In dev mode (no CLIENT env var), falls back to STORE_CONFIG defaults so dev workflow is unchanged.

import type { ClientConfig, AppBuild } from '@/types/clientConfig'
import { STORE_CONFIG } from '@/constants/app'

// Declared globally via vite.config.ts define — null in dev mode fallback.
declare const __CLIENT_CONFIG__: ClientConfig | null
declare const __APP_BUILD__: AppBuild | null

function getClientConfig(): ClientConfig {
  if (typeof __CLIENT_CONFIG__ !== 'undefined' && __CLIENT_CONFIG__ !== null) {
    return __CLIENT_CONFIG__
  }
  // Dev fallback: mirrors existing STORE_CONFIG so nothing changes in dev
  return {
    store: { ...STORE_CONFIG },
    brand: {
      themeColor: '#1e40af',
      appName: 'Grocery Store POS',
      shortName: 'POS',
    },
    plan: 'enterprise',       // dev gets full access
    clientId: 'dev',
    licenseExpiresAt: '2099-12-31',
  }
}

function getAppBuild(): AppBuild {
  if (typeof __APP_BUILD__ !== 'undefined' && __APP_BUILD__ !== null) {
    return __APP_BUILD__
  }
  return {
    version: '0.0.0-dev',
    gitCommit: 'dev',
    builtAt: new Date().toISOString(),
    clientId: 'dev',
  }
}

export const CLIENT_CONFIG = getClientConfig()
export const APP_BUILD = getAppBuild()
