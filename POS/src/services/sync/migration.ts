/**
 * One-time migration: Dexie (IndexedDB) → Firestore.
 * Uses setDoc (idempotent) — safe to re-run; existing docs are overwritten with current values.
 * Never migrates outbox or auth sessions.
 */
import { doc, Timestamp, writeBatch } from 'firebase/firestore'
import { firestore } from '@/services/firebase'
import { db } from '@/db'

export interface MigrationProgress {
  stage: string
  done: number
  total: number
}

type ProgressCallback = (p: MigrationProgress) => void

function toTs(date: Date | undefined): Timestamp | null {
  if (!date) return null
  return Timestamp.fromDate(date instanceof Date ? date : new Date(date))
}

// Firestore writeBatch limit is 500 ops per batch
async function batchWrite(
  collection: string,
  records: Array<{ id: number | string; data: Record<string, unknown> }>
): Promise<void> {
  const CHUNK = 400
  for (let i = 0; i < records.length; i += CHUNK) {
    const batch = writeBatch(firestore)
    for (const r of records.slice(i, i + CHUNK)) {
      batch.set(doc(firestore, collection, String(r.id)), r.data)
    }
    await batch.commit()
  }
}

export async function runMigration(onProgress: ProgressCallback): Promise<void> {
  // ── Products ────────────────────────────────────────────────────────────────
  const products = await db.products.toArray()
  onProgress({ stage: 'Products', done: 0, total: products.length })
  await batchWrite(
    'products',
    products.map((p) => ({
      id: p.id!,
      data: {
        ...p,
        createdAt: toTs(p.createdAt),
        updatedAt: toTs(p.updatedAt),
      },
    }))
  )
  onProgress({ stage: 'Products', done: products.length, total: products.length })

  // ── Batches ─────────────────────────────────────────────────────────────────
  const batches = await db.batches.toArray()
  onProgress({ stage: 'Batches', done: 0, total: batches.length })
  await batchWrite(
    'batches',
    batches.map((b) => ({
      id: b.id!,
      data: {
        ...b,
        mfgDate: toTs(b.mfgDate),
        expiryDate: toTs(b.expiryDate),
        createdAt: toTs(b.createdAt),
      },
    }))
  )
  onProgress({ stage: 'Batches', done: batches.length, total: batches.length })

  // ── Customers ────────────────────────────────────────────────────────────────
  const customers = await db.customers.toArray()
  onProgress({ stage: 'Customers', done: 0, total: customers.length })
  await batchWrite(
    'customers',
    customers.map((c) => ({
      id: c.id!,
      data: { ...c },
    }))
  )
  onProgress({ stage: 'Customers', done: customers.length, total: customers.length })

  // ── Employees ────────────────────────────────────────────────────────────────
  // Strip credential hashes before syncing to Firestore — hashes stay in IndexedDB only.
  // This prevents bcrypt hashes from being readable by any device with anonymous auth.
  const employees = await db.employees.toArray()
  onProgress({ stage: 'Employees', done: 0, total: employees.length })
  await batchWrite(
    'employees',
    employees.map((e) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, pinHash, ...safeFields } = e
      return {
        id: e.id!,
        data: { ...safeFields, createdAt: toTs(e.createdAt) },
      }
    })
  )
  onProgress({ stage: 'Employees', done: employees.length, total: employees.length })

  onProgress({ stage: 'Done', done: 0, total: 0 })
}
