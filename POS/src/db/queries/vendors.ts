import { db } from '@/db'
import type { Vendor } from '@/types'
import { syncVendorToFirestore } from '@/services/firebase/sync'
import { createSyncId } from '@/utils/syncIds'
import { queueOutboxEntry } from './outbox'

function buildVendorSyncPayload(vendor: Vendor, id: number, syncId: string) {
  return {
    id,
    syncId,
    name: vendor.name,
    phone: vendor.phone,
    gstin: vendor.gstin,
    address: vendor.address,
    isActive: vendor.isActive,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  }
}

async function queueVendorSync(vendor: Vendor, id: number, syncId: string, createdAt: Date): Promise<void> {
  const payload = buildVendorSyncPayload(vendor, id, syncId)
  await queueOutboxEntry({
    action: 'upsert_vendor',
    entityType: 'vendor',
    entityKey: syncId,
    payload: JSON.stringify({
      ...payload,
      createdAt: payload.createdAt.toISOString(),
      updatedAt: payload.updatedAt.toISOString(),
    }),
    createdAt,
  })
}

export async function getAllVendors(): Promise<Vendor[]> {
  return db.vendors.orderBy('name').toArray()
}

export async function getActiveVendors(): Promise<Vendor[]> {
  return db.vendors.where('isActive').equals(1).sortBy('name')
}

export async function upsertVendor(vendor: Vendor): Promise<number> {
  const now = new Date()
  if (vendor.id) {
    const syncId = vendor.syncId ?? `legacy-vendor-${vendor.id}`
    const saved: Vendor = { ...vendor, syncId, updatedAt: now }
    await db.transaction('rw', [db.vendors, db.outbox], async () => {
      await db.vendors.update(vendor.id!, saved)
      await queueVendorSync(saved, vendor.id!, syncId, now)
    })
    syncVendorToFirestore(buildVendorSyncPayload(saved, vendor.id, syncId)).catch((err: unknown) =>
      console.warn('[Firestore] vendor sync failed (will retry):', err)
    )
    return vendor.id
  }
  const syncId = vendor.syncId ?? createSyncId('vendor')
  const saved: Vendor = { ...vendor, syncId, createdAt: now, updatedAt: now }
  const id = await db.transaction('rw', [db.vendors, db.outbox], async () => {
    const vendorId = await db.vendors.add(saved)
    await queueVendorSync(saved, vendorId, syncId, now)
    return vendorId
  })
  syncVendorToFirestore(buildVendorSyncPayload(saved, id, syncId)).catch((err: unknown) =>
    console.warn('[Firestore] vendor sync failed (will retry):', err)
  )
  return id
}

export async function toggleVendorActive(id: number, isActive: boolean): Promise<void> {
  const existing = await db.vendors.get(id)
  if (!existing) throw new Error('Vendor not found')
  const now = new Date()
  const syncId = existing.syncId ?? `legacy-vendor-${id}`
  const saved: Vendor = { ...existing, syncId, isActive, updatedAt: now }

  await db.transaction('rw', [db.vendors, db.outbox], async () => {
    await db.vendors.put(saved)
    await queueVendorSync(saved, id, syncId, now)
  })

  syncVendorToFirestore(buildVendorSyncPayload(saved, id, syncId)).catch((err: unknown) =>
    console.warn('[Firestore] vendor sync failed (will retry):', err)
  )
}
