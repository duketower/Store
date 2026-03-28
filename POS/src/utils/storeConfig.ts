// Store config cache for synchronous consumers (receipts, print flows, exports).
// The source of truth is the shared Firestore/Dexie store_settings document.
// localStorage is kept as a fast local mirror so non-React code can read it synchronously.

import { CLIENT_CONFIG } from '@/constants/clientConfig'
import type { StoreConfig } from '@/types'

const SETTINGS_KEY = 'pos_store_config'

export function loadStoreConfig(): StoreConfig {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...CLIENT_CONFIG.store, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...CLIENT_CONFIG.store }
}

export function persistStoreConfigCache(config: StoreConfig) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(config))
}

export function clearStoreConfigCache() {
  localStorage.removeItem(SETTINGS_KEY)
}
