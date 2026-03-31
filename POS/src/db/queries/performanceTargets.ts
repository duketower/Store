import type { PerformanceTargets } from '@/types'
import { syncPerformanceTargetsToFirestore } from '@/services/firebase/sync'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

const PERFORMANCE_TARGETS_KEY: PerformanceTargets['key'] = 'performance_targets'

export const DEFAULT_PERFORMANCE_TARGETS: PerformanceTargets = {
  key: PERFORMANCE_TARGETS_KEY,
  monthlySalesTarget: 0,
  monthlyBreakEvenTarget: 0,
  updatedAt: new Date(0),
}

export async function getPerformanceTargets(): Promise<PerformanceTargets> {
  const targets = useFirestoreDataStore.getState().performanceTargets
  return targets ?? { ...DEFAULT_PERFORMANCE_TARGETS }
}

export async function putPerformanceTargets(
  input: Omit<PerformanceTargets, 'key'>
): Promise<PerformanceTargets> {
  const targets: PerformanceTargets = {
    key: PERFORMANCE_TARGETS_KEY,
    ...input,
  }

  await syncPerformanceTargetsToFirestore({
    monthlySalesTarget: targets.monthlySalesTarget,
    monthlyBreakEvenTarget: targets.monthlyBreakEvenTarget,
    updatedAt: targets.updatedAt,
    updatedBy: targets.updatedBy,
  })

  return targets
}
