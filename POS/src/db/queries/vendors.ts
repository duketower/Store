import { db } from '@/db'
import type { Vendor } from '@/types'

export async function getAllVendors(): Promise<Vendor[]> {
  return db.vendors.orderBy('name').toArray()
}

export async function getActiveVendors(): Promise<Vendor[]> {
  return db.vendors.where('isActive').equals(1).sortBy('name')
}

export async function upsertVendor(vendor: Vendor): Promise<number> {
  const now = new Date()
  if (vendor.id) {
    await db.vendors.update(vendor.id, { ...vendor, updatedAt: now })
    return vendor.id
  }
  return db.vendors.add({ ...vendor, createdAt: now, updatedAt: now })
}

export async function toggleVendorActive(id: number, isActive: boolean): Promise<void> {
  await db.vendors.update(id, { isActive, updatedAt: new Date() })
}
