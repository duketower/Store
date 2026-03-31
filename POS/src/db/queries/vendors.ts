import type { Vendor } from '@/types'
import { syncVendorToFirestore } from '@/services/firebase/sync'
import { createEntityId, createSyncId } from '@/utils/syncIds'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export async function getAllVendors(): Promise<Vendor[]> {
  const vendors = useFirestoreDataStore.getState().vendors
  return [...vendors].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getActiveVendors(): Promise<Vendor[]> {
  const vendors = useFirestoreDataStore.getState().vendors
  return [...vendors].filter((v) => v.isActive).sort((a, b) => a.name.localeCompare(b.name))
}

export async function upsertVendor(vendor: Vendor): Promise<number> {
  const now = new Date()
  if (vendor.id) {
    const syncId = vendor.syncId ?? `legacy-vendor-${vendor.id}`
    const saved: Vendor = { ...vendor, syncId, updatedAt: now }
    await syncVendorToFirestore({ ...saved, id: vendor.id, syncId })
    return vendor.id
  }
  const syncId = vendor.syncId ?? createSyncId('vendor')
  const vendorId = createEntityId()
  const saved: Vendor = { ...vendor, id: vendorId, syncId, createdAt: now, updatedAt: now }
  await syncVendorToFirestore({ ...saved, id: vendorId, syncId })
  return vendorId
}

export async function toggleVendorActive(id: number, isActive: boolean): Promise<void> {
  const vendor = useFirestoreDataStore.getState().vendors.find((v) => v.id === id)
  if (!vendor) throw new Error('Vendor not found')
  const now = new Date()
  const syncId = vendor.syncId ?? `legacy-vendor-${id}`
  const saved: Vendor = { ...vendor, syncId, isActive, updatedAt: now }
  await syncVendorToFirestore({ ...saved, id, syncId })
}
