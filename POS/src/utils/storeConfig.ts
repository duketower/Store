import { STORE_CONFIG } from '@/constants/app'

export type StoreConfig = typeof STORE_CONFIG

const SETTINGS_KEY = 'pos_store_config'

export function loadStoreConfig(): StoreConfig {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...STORE_CONFIG, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...STORE_CONFIG }
}

export function saveStoreConfig(config: StoreConfig) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(config))
}
