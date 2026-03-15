// Store config with localStorage override layer.
// The base defaults come from CLIENT_CONFIG (baked in at build time per client).
// Admins can override any field via Settings → Store Details — saved to localStorage.
// On reset-to-defaults, reverts to the build-time CLIENT_CONFIG values.

import { CLIENT_CONFIG } from '@/constants/clientConfig'

export type StoreConfig = typeof CLIENT_CONFIG.store

const SETTINGS_KEY = 'pos_store_config'

export function loadStoreConfig(): StoreConfig {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...CLIENT_CONFIG.store, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...CLIENT_CONFIG.store }
}

export function saveStoreConfig(config: StoreConfig) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(config))
}
