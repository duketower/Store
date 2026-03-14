import { collection, onSnapshot, Timestamp } from 'firebase/firestore'
import { firestore } from '@/services/firebase'
import { db } from '@/db'

function tsToDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val as string)
}

/**
 * Starts real-time Firestore listeners for products and customers.
 * When another device writes a stock or balance change, that change is pushed
 * here via onSnapshot and merged into local Dexie — no polling required.
 *
 * Design notes:
 * - includeMetadataChanges: false → only server-confirmed writes fire the callback
 * - docChanges() → processes only changed docs, not the full collection on every event
 * - db.update() not db.put() → merges fields; preserves Dexie-only fields (barcode, sku, hsn…)
 * - 'removed' changes ignored → deletions are handled by their own admin flows
 * - Self-echo safe: when THIS device writes to Firestore, the round-trip echo is a harmless no-op
 *
 * Must be called AFTER ensureAnonymousAuth() — onSnapshot subscriptions require
 * request.auth != null in Firestore rules.
 *
 * Returns a cleanup function that stops both listeners.
 */
export function startFirestoreListeners(): () => void {
  const unsubProducts = startProductListener()
  const unsubCustomers = startCustomerListener()
  return () => {
    unsubProducts()
    unsubCustomers()
  }
}

function startProductListener(): () => void {
  return onSnapshot(
    collection(firestore, 'products'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') continue
        const data = change.doc.data()
        const id = Number(change.doc.id)
        if (!id) continue

        db.products
          .update(id, {
            stock: data.stock,
            reorderLevel: data.reorderLevel,
            sellingPrice: data.sellingPrice,
            name: data.name,
            unit: data.unit,
            ...(data.category !== undefined && { category: data.category }),
            updatedAt: tsToDate(data.updatedAt),
          })
          .catch((err: unknown) => console.warn('[Listener] product update failed:', err))
      }
    },
    (err) => console.warn('[Listener] products snapshot error:', err)
  )
}

function startCustomerListener(): () => void {
  return onSnapshot(
    collection(firestore, 'customers'),
    { includeMetadataChanges: false },
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') continue
        const data = change.doc.data()
        const id = Number(change.doc.id)
        if (!id) continue

        db.customers
          .update(id, {
            name: data.name,
            ...(data.phone !== undefined && { phone: data.phone }),
            currentBalance: data.currentBalance,
            creditLimit: data.creditLimit,
            updatedAt: tsToDate(data.updatedAt),
          })
          .catch((err: unknown) => console.warn('[Listener] customer update failed:', err))
      }
    },
    (err) => console.warn('[Listener] customers snapshot error:', err)
  )
}
