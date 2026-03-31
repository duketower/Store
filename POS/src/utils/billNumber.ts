import { firestore } from '@/services/firebase'
import { doc, runTransaction } from 'firebase/firestore'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

const COUNTER_DOC = doc(firestore, 'counters', 'billNumber')

/**
 * Returns the next globally unique bill number via Firestore atomic counter.
 * Falls back to a UUID-tagged offline number when Firestore is unavailable.
 * The OFF suffix keeps offline-generated numbers easy to identify in reports.
 */
export async function generateBillNumber(): Promise<string> {
  const year = new Date().getFullYear()

  try {
    const seq = await runTransaction(firestore, async (txn) => {
      const snap = await txn.get(COUNTER_DOC)
      if (!snap.exists()) {
        // First use — initialize from local count so sequence doesn't restart at 1
        const localCount = useFirestoreDataStore.getState().sales.length
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
    // Offline fallback — UUID suffix prevents collision when multiple devices are offline simultaneously
    console.warn('[BillNumber] Firestore unavailable — using UUID offline fallback')
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
    return `INV-${year}-OFF-${suffix}`
  }
}
