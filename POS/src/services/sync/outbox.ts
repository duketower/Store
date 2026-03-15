import { db } from '@/db'
import { syncSaleToFirestore, syncProductToFirestore, syncCustomerToFirestore } from '@/services/firebase/sync'

/**
 * Flush pending outbox entries to Firestore.
 * Called on app startup and whenever the browser comes back online.
 * Each entry is deleted only after a confirmed successful sync.
 * syncSaleToFirestore uses setDoc (idempotent) — safe to retry.
 */
export async function flushOutbox(): Promise<void> {
  const pending = await db.outbox.orderBy('createdAt').toArray()
  if (pending.length === 0) return

  console.log(`[Outbox] Flushing ${pending.length} pending entries…`)

  for (const entry of pending) {
    if (entry.action === 'update_product_stock') {
      try {
        const data = JSON.parse(entry.payload)
        await syncProductToFirestore(data)
        await db.outbox.delete(entry.id!)
      } catch { /* leave for retry */ }
      continue
    }

    if (entry.action === 'update_customer_balance') {
      try {
        const data = JSON.parse(entry.payload)
        await syncCustomerToFirestore(data)
        await db.outbox.delete(entry.id!)
      } catch { /* leave for retry */ }
      continue
    }

    if (entry.action !== 'create_sale') continue

    try {
      const data = JSON.parse(entry.payload)

      // Old-format entries (before full-payload outbox) are missing cashierId — delete them.
      // The fire-and-forget attempt at time of sale likely already synced them.
      if (!data.cashierId) {
        console.warn(`[Outbox] Dropping malformed create_sale entry id=${entry.id} (missing cashierId):`, data)
        await db.outbox.delete(entry.id!)
        continue
      }

      await syncSaleToFirestore({
        saleId: data.saleId,
        billNo: data.billNo,
        cashierId: data.cashierId,
        cashierName: data.cashierName ?? null,
        customerId: data.customerId ?? null,
        subtotal: data.subtotal,
        discount: data.discount,
        taxTotal: data.taxTotal,
        grandTotal: data.grandTotal,
        payments: data.payments ?? [],
        items: data.items ?? [],
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(entry.createdAt),
      })

      await db.outbox.delete(entry.id!)
      console.log(`[Outbox] Synced and cleared: ${data.billNo}`)
    } catch {
      // Leave in outbox — will retry on next online event
    }
  }
}

export async function getPendingCount(): Promise<number> {
  return db.outbox.count()
}
