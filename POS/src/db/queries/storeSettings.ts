import type { SharedStoreSettings, StoreConfig } from '@/types'
import { syncStoreSettingsToFirestore } from '@/services/firebase/sync'
import { CLIENT_CONFIG } from '@/constants/clientConfig'
import { persistStoreConfigCache } from '@/utils/storeConfig'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

const STORE_SETTINGS_KEY: SharedStoreSettings['key'] = 'store_details'

export const DEFAULT_STORE_SETTINGS: SharedStoreSettings = {
  key: STORE_SETTINGS_KEY,
  config: { ...CLIENT_CONFIG.store },
  updatedAt: new Date(0),
}

export async function getStoreSettings(): Promise<SharedStoreSettings> {
  const settings = useFirestoreDataStore.getState().storeSettings
  if (settings) {
    persistStoreConfigCache(settings.config)
    return settings
  }

  persistStoreConfigCache(DEFAULT_STORE_SETTINGS.config)
  return { ...DEFAULT_STORE_SETTINGS, config: { ...DEFAULT_STORE_SETTINGS.config } }
}

export async function putStoreSettings(input: {
  config: StoreConfig
  updatedAt: Date
  updatedBy?: number
}): Promise<SharedStoreSettings> {
  const settings: SharedStoreSettings = {
    key: STORE_SETTINGS_KEY,
    config: { ...input.config },
    updatedAt: input.updatedAt,
    ...(input.updatedBy !== undefined ? { updatedBy: input.updatedBy } : {}),
  }

  persistStoreConfigCache(settings.config)

  await syncStoreSettingsToFirestore({
    config: settings.config,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
  })

  return settings
}
