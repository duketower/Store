import type { ClientConfig } from './clientConfig'

export type StoreConfig = ClientConfig['store']

export interface SharedStoreSettings {
  key: 'store_details'
  config: StoreConfig
  updatedAt: Date
  updatedBy?: number
}
