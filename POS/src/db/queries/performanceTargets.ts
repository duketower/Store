import { db } from '@/db'
import type { PerformanceTargets } from '@/types'
import { syncPerformanceTargetsToFirestore } from '@/services/firebase/sync'
import { queueOutboxEntry } from './outbox'

const PERFORMANCE_TARGETS_KEY: PerformanceTargets['key'] = 'performance_targets'

export const DEFAULT_PERFORMANCE_TARGETS: PerformanceTargets = {
  key: PERFORMANCE_TARGETS_KEY,
  monthlySalesTarget: 0,
  monthlyBreakEvenTarget: 0,
  updatedAt: new Date(0),
}

export async function getPerformanceTargets(): Promise<PerformanceTargets> {
  const targets = await db.performance_targets.get(PERFORMANCE_TARGETS_KEY)
  return targets ?? { ...DEFAULT_PERFORMANCE_TARGETS }
}

export async function putPerformanceTargets(
  input: Omit<PerformanceTargets, 'key'>
): Promise<PerformanceTargets> {
  const targets: PerformanceTargets = {
    key: PERFORMANCE_TARGETS_KEY,
    ...input,
  }

  await db.transaction('rw', [db.performance_targets, db.outbox], async () => {
    await db.performance_targets.put(targets)
    await queueOutboxEntry({
      action: 'set_performance_targets',
      entityType: 'performance_targets',
      entityKey: PERFORMANCE_TARGETS_KEY,
      payload: JSON.stringify({
        monthlySalesTarget: targets.monthlySalesTarget,
        monthlyBreakEvenTarget: targets.monthlyBreakEvenTarget,
        updatedAt: targets.updatedAt.toISOString(),
        updatedBy: targets.updatedBy ?? null,
      }),
      createdAt: targets.updatedAt,
    })
  })

  syncPerformanceTargetsToFirestore({
    monthlySalesTarget: targets.monthlySalesTarget,
    monthlyBreakEvenTarget: targets.monthlyBreakEvenTarget,
    updatedAt: targets.updatedAt,
    updatedBy: targets.updatedBy,
  }).catch((err: unknown) => console.warn('[Firestore] performance targets sync failed (will retry):', err))

  return targets
}
