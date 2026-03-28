import { db } from '@/db'
import type { SharedStoreSettings, StoreConfig } from '@/types'
import { syncStoreSettingsToFirestore } from '@/services/firebase/sync'
import { queueOutboxEntry } from './outbox'
import { CLIENT_CONFIG } from '@/constants/clientConfig'
import { persistStoreConfigCache } from '@/utils/storeConfig'

const STORE_SETTINGS_KEY: SharedStoreSettings['key'] = 'store_details'

export const DEFAULT_STORE_SETTINGS: SharedStoreSettings = {
  key: STORE_SETTINGS_KEY,
  config: { ...CLIENT_CONFIG.store },
  updatedAt: new Date(0),
}

export async function getStoreSettings(): Promise<SharedStoreSettings> {
  const settings = await db.store_settings.get(STORE_SETTINGS_KEY)
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

  await db.transaction('rw', [db.store_settings, db.outbox], async () => {
    await db.store_settings.put(settings)
    await queueOutboxEntry({
      action: 'set_store_settings',
      entityType: 'store_settings',
      entityKey: STORE_SETTINGS_KEY,
      payload: JSON.stringify({
        config: settings.config,
        updatedAt: settings.updatedAt.toISOString(),
        updatedBy: settings.updatedBy ?? null,
      }),
      createdAt: settings.updatedAt,
    })
  })

  syncStoreSettingsToFirestore({
    config: settings.config,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
  }).catch((err: unknown) => console.warn('[Firestore] store settings sync failed (will retry):', err))

  return settings
}
