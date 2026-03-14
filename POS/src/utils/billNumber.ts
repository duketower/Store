import { db } from '@/db'
import { firestore } from '@/services/firebase'
import { doc, runTransaction } from 'firebase/firestore'

const COUNTER_DOC = doc(firestore, 'counters', 'billNumber')

/**
 * Returns the next globally unique bill number via Firestore atomic counter.
 * Falls back to a locally-generated sequence (prefixed 'L') when offline.
 * The 'L' prefix makes offline-generated numbers easy to identify in reports.
 */
export async function generateBillNumber(): Promise<string> {
  const year = new Date().getFullYear()

  try {
    const seq = await runTransaction(firestore, async (txn) => {
      const snap = await txn.get(COUNTER_DOC)
      if (!snap.exists()) {
        // First use — initialize from local count so sequence doesn't restart at 1
        const localCount = await db.sales.count()
        const next = localCount + 1
        txn.set(COUNTER_DOC, { current: next })
        return next
      }
      const next = (snap.data().current as number) + 1
      txn.update(COUNTER_DOC, { current: next })
      return next
    })

    return `INV-${year}-${String(seq).padStart(5, '0')}`
  } catch {
    // Offline fallback — unblocks the cashier; may collide if two devices are both offline
    console.warn('[BillNumber] Firestore unavailable — using local fallback')
    const localCount = await db.sales.count()
    return `INV-${year}-L${String(localCount + 1).padStart(4, '0')}`
  }
}
