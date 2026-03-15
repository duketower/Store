/**
 * Firestore read queries — for cross-device dashboard data.
 * Used on the dashboard to show real-time sales from all devices.
 * Never throws — falls back to zeros on failure (offline or rules issue).
 */
import { collection, query, where, onSnapshot, Timestamp, type QuerySnapshot, type DocumentData } from 'firebase/firestore'
import { firestore } from '.'

export interface TodaySalesSummary {
  totalBills: number
  totalSales: number
  cashTotal: number
  upiTotal: number
  creditTotal: number
}

function summariseSnapshot(snapshot: QuerySnapshot<DocumentData>): TodaySalesSummary {
  let totalBills = 0, totalSales = 0, cashTotal = 0, upiTotal = 0, creditTotal = 0
  snapshot.forEach((doc) => {
    const data = doc.data()
    totalBills++
    totalSales += data.grandTotal ?? 0
    for (const p of (data.payments ?? [])) {
      if (p.method === 'cash') cashTotal += p.amount
      if (p.method === 'upi') upiTotal += p.amount
      if (p.method === 'credit') creditTotal += p.amount
    }
  })
  return { totalBills, totalSales, cashTotal, upiTotal, creditTotal }
}

/**
 * Subscribes to today's sales summary in real-time.
 * Returns an unsubscribe function — call it on component unmount.
 * Calls onData immediately with current data, then on every change.
 * Falls back to zeros on error (offline / rules issue).
 */
export function subscribeTodaySalesSummary(
  onData: (summary: TodaySalesSummary) => void
): () => void {
  const empty: TodaySalesSummary = { totalBills: 0, totalSales: 0, cashTotal: 0, upiTotal: 0, creditTotal: 0 }
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const q = query(
    collection(firestore, 'sales'),
    where('createdAt', '>=', Timestamp.fromDate(startOfDay))
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => onData(summariseSnapshot(snapshot)),
    () => onData(empty)
  )

  return unsubscribe
}
