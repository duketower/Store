/**
 * Firestore read queries — for cross-device dashboard data.
 * The dashboard combines shared sales, shared expenses, and shared targets,
 * while using local product/batch cost data only for best-effort legacy profit
 * estimates when older sales are missing stored profit snapshots.
 */
import {
  collection,
  doc,
  onSnapshot,
  query,
  Timestamp,
  where,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import { firestore } from '.'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

const DEFAULT_PERFORMANCE_TARGETS = {
  monthlySalesTarget: 0,
  monthlyBreakEvenTarget: 0,
  updatedAt: new Date(0),
}
import type { CashEntry, DaySession } from '@/types'

export interface SalesAggregate {
  totalBills: number
  totalSales: number
  cashTotal: number
  upiTotal: number
  creditTotal: number
  expensesTotal: number
  cogsTotal: number
  grossProfitTotal: number
  netProfitTotal: number
  estimatedProfit: boolean
}

export interface DashboardMetrics {
  today: SalesAggregate & {
    salesTarget: number
    salesRemaining: number
    salesOverBy: number
    salesAchieved: boolean
  }
  month: SalesAggregate & {
    salesTarget: number
    salesRemaining: number
    salesOverBy: number
    salesAchieved: boolean
    breakEvenTarget: number
    breakEvenRemaining: number
    breakEvenOverBy: number
    breakEvenAchieved: boolean
  }
  targets: {
    monthlySalesTarget: number
    monthlyBreakEvenTarget: number
  }
}

export interface ShiftReport {
  totalBills: number
  totalSales: number
  cashTotal: number
  upiTotal: number
  creditTotal: number
  openingFloat: number
  cashOutTotal: number
  cashEntries: CashEntry[]
  expectedCash: number
  gstByRate: Array<{ rate: number; taxAmount: number }>
  topProducts: Array<{ name: string; qty: number; total: number }>
}

interface DashboardSnapshotState {
  todaySalesSnapshot: QuerySnapshot<DocumentData> | null
  todayExpensesSnapshot: QuerySnapshot<DocumentData> | null
  monthSalesSnapshot: QuerySnapshot<DocumentData> | null
  monthExpensesSnapshot: QuerySnapshot<DocumentData> | null
}

const EMPTY_AGGREGATE: SalesAggregate = {
  totalBills: 0,
  totalSales: 0,
  cashTotal: 0,
  upiTotal: 0,
  creditTotal: 0,
  expensesTotal: 0,
  cogsTotal: 0,
  grossProfitTotal: 0,
  netProfitTotal: 0,
  estimatedProfit: false,
}

function createEmptyShiftReport(openingFloat = 0): ShiftReport {
  return {
    totalBills: 0,
    totalSales: 0,
    cashTotal: 0,
    upiTotal: 0,
    creditTotal: 0,
    openingFloat,
    cashOutTotal: 0,
    cashEntries: [],
    expectedCash: openingFloat,
    gstByRate: [],
    topProducts: [],
  }
}

function tsToDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value as string)
}

function createEmptyMetrics(now = new Date()): DashboardMetrics {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dailySalesTarget = DEFAULT_PERFORMANCE_TARGETS.monthlySalesTarget / daysInMonth

  return {
    today: {
      ...EMPTY_AGGREGATE,
      salesTarget: dailySalesTarget,
      salesRemaining: dailySalesTarget,
      salesOverBy: 0,
      salesAchieved: dailySalesTarget <= 0,
    },
    month: {
      ...EMPTY_AGGREGATE,
      salesTarget: DEFAULT_PERFORMANCE_TARGETS.monthlySalesTarget,
      salesRemaining: DEFAULT_PERFORMANCE_TARGETS.monthlySalesTarget,
      salesOverBy: 0,
      salesAchieved: DEFAULT_PERFORMANCE_TARGETS.monthlySalesTarget <= 0,
      breakEvenTarget: DEFAULT_PERFORMANCE_TARGETS.monthlyBreakEvenTarget,
      breakEvenRemaining: DEFAULT_PERFORMANCE_TARGETS.monthlyBreakEvenTarget,
      breakEvenOverBy: 0,
      breakEvenAchieved: DEFAULT_PERFORMANCE_TARGETS.monthlyBreakEvenTarget <= 0,
    },
    targets: {
      monthlySalesTarget: DEFAULT_PERFORMANCE_TARGETS.monthlySalesTarget,
      monthlyBreakEvenTarget: DEFAULT_PERFORMANCE_TARGETS.monthlyBreakEvenTarget,
    },
  }
}

function finaliseAggregate(
  aggregate: SalesAggregate,
  salesTarget: number
): SalesAggregate & {
  salesTarget: number
  salesRemaining: number
  salesOverBy: number
  salesAchieved: boolean
} {
  const safeTarget = Math.max(0, salesTarget)
  return {
    ...aggregate,
    netProfitTotal: aggregate.grossProfitTotal - aggregate.expensesTotal,
    salesTarget: safeTarget,
    salesRemaining: Math.max(0, safeTarget - aggregate.totalSales),
    salesOverBy: Math.max(0, aggregate.totalSales - safeTarget),
    salesAchieved: safeTarget <= 0 || aggregate.totalSales >= safeTarget,
  }
}

async function buildEstimatedCostMap(): Promise<Map<number, number>> {
  const { products, batches } = useFirestoreDataStore.getState()
  const costMap = new Map<number, number>()

  for (const product of products) {
    const productBatches = batches.filter((batch) => batch.productId === product.id)
    const qtyWeightedTotal = productBatches.reduce(
      (sum, batch) => sum + batch.purchasePrice * Math.max(batch.qtyRemaining, 0),
      0
    )
    const qtyTotal = productBatches.reduce((sum, batch) => sum + Math.max(batch.qtyRemaining, 0), 0)
    const averagePurchasePrice =
      qtyTotal > 0
        ? qtyWeightedTotal / qtyTotal
        : productBatches.length > 0
          ? productBatches.reduce((sum, batch) => sum + batch.purchasePrice, 0) / productBatches.length
          : undefined

    costMap.set(product.id!, averagePurchasePrice ?? product.costPrice ?? 0)
  }

  return costMap
}

function applyPayments(aggregate: SalesAggregate, payments: unknown) {
  if (!Array.isArray(payments)) return

  for (const payment of payments) {
    if (!payment || typeof payment !== 'object') continue
    const method = 'method' in payment ? payment.method : undefined
    const amountRaw = 'amount' in payment ? payment.amount : 0
    const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw ?? 0)

    if (method === 'cash') aggregate.cashTotal += amount
    if (method === 'upi') aggregate.upiTotal += amount
    if (method === 'credit') aggregate.creditTotal += amount
  }
}

function applySaleToAggregate(
  aggregate: SalesAggregate,
  totalSales: number,
  cogsTotal: number,
  grossProfitTotal: number,
  profitEstimated: boolean,
  payments: unknown
) {
  aggregate.totalBills += 1
  aggregate.totalSales += totalSales
  aggregate.cogsTotal += cogsTotal
  aggregate.grossProfitTotal += grossProfitTotal
  aggregate.estimatedProfit = aggregate.estimatedProfit || profitEstimated
  applyPayments(aggregate, payments)
}

function estimateLegacySaleCogs(data: DocumentData, costMap: Map<number, number>): number {
  if (!Array.isArray(data.items)) return 0

  return data.items.reduce((sum: number, item: DocumentData) => {
    const qty = typeof item?.qty === 'number' ? item.qty : Number(item?.qty ?? 0)
    const productId = typeof item?.productId === 'number' ? item.productId : Number(item?.productId ?? 0)
    const estimatedUnitCost = costMap.get(productId) ?? 0
    return sum + qty * estimatedUnitCost
  }, 0)
}

async function buildDashboardMetrics(
  snapshots: DashboardSnapshotState,
  targetsData: Partial<DashboardMetrics['targets']>
): Promise<DashboardMetrics> {
  const now = new Date()
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)
  const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthlySalesTarget = Math.max(0, Number(targetsData.monthlySalesTarget ?? 0))
  const monthlyBreakEvenTarget = Math.max(0, Number(targetsData.monthlyBreakEvenTarget ?? 0))
  const dailySalesTarget = monthlySalesTarget / currentMonthDays

  const base = createEmptyMetrics(now)
  const today = { ...base.today }
  const month = { ...base.month }
  const costMap = await buildEstimatedCostMap()

  snapshots.todaySalesSnapshot?.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    const totalSales = typeof data.grandTotal === 'number' ? data.grandTotal : Number(data.grandTotal ?? 0)
    const hasStoredProfit = typeof data.cogsTotal === 'number' || typeof data.grossProfitTotal === 'number'
    const cogsTotal = hasStoredProfit
      ? (typeof data.cogsTotal === 'number' ? data.cogsTotal : Number(data.cogsTotal ?? 0))
      : estimateLegacySaleCogs(data, costMap)
    const grossProfitTotal = hasStoredProfit
      ? (typeof data.grossProfitTotal === 'number'
          ? data.grossProfitTotal
          : totalSales - cogsTotal)
      : totalSales - cogsTotal
    const profitEstimated = hasStoredProfit ? Boolean(data.profitEstimated) : true

    applySaleToAggregate(today, totalSales, cogsTotal, grossProfitTotal, profitEstimated, data.payments)
  })

  snapshots.todayExpensesSnapshot?.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    const amount = typeof data.amount === 'number' ? data.amount : Number(data.amount ?? 0)
    const expenseDate = tsToDate(data.date ?? data.createdAt)
    if (expenseDate >= dayStart) today.expensesTotal += amount
  })

  snapshots.monthSalesSnapshot?.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    const totalSales = typeof data.grandTotal === 'number' ? data.grandTotal : Number(data.grandTotal ?? 0)
    const hasStoredProfit = typeof data.cogsTotal === 'number' || typeof data.grossProfitTotal === 'number'
    const cogsTotal = hasStoredProfit
      ? (typeof data.cogsTotal === 'number' ? data.cogsTotal : Number(data.cogsTotal ?? 0))
      : estimateLegacySaleCogs(data, costMap)
    const grossProfitTotal = hasStoredProfit
      ? (typeof data.grossProfitTotal === 'number'
          ? data.grossProfitTotal
          : totalSales - cogsTotal)
      : totalSales - cogsTotal
    const profitEstimated = hasStoredProfit ? Boolean(data.profitEstimated) : true

    applySaleToAggregate(month, totalSales, cogsTotal, grossProfitTotal, profitEstimated, data.payments)
  })

  snapshots.monthExpensesSnapshot?.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    const amount = typeof data.amount === 'number' ? data.amount : Number(data.amount ?? 0)
    month.expensesTotal += amount
  })

  const todayMetrics = finaliseAggregate(today, dailySalesTarget)
  const monthMetricsBase = finaliseAggregate(month, monthlySalesTarget)
  const monthNetProfit = monthMetricsBase.netProfitTotal

  return {
    today: todayMetrics,
    month: {
      ...monthMetricsBase,
      breakEvenTarget: monthlyBreakEvenTarget,
      breakEvenRemaining: Math.max(0, monthlyBreakEvenTarget - monthNetProfit),
      breakEvenOverBy: Math.max(0, monthNetProfit - monthlyBreakEvenTarget),
      breakEvenAchieved: monthlyBreakEvenTarget <= 0 || monthNetProfit >= monthlyBreakEvenTarget,
    },
    targets: {
      monthlySalesTarget,
      monthlyBreakEvenTarget,
    },
  }
}

/**
 * Subscribes to the live dashboard metrics for today plus a selected month.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeDashboardMetrics(
  selectedMonthStart: Date,
  onData: (metrics: DashboardMetrics) => void
): () => void {
  const now = new Date()
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const monthStart = new Date(selectedMonthStart.getFullYear(), selectedMonthStart.getMonth(), 1)
  const monthEnd = new Date(selectedMonthStart.getFullYear(), selectedMonthStart.getMonth() + 1, 1)
  const empty = createEmptyMetrics(now)

  let active = true
  let snapshots: DashboardSnapshotState = {
    todaySalesSnapshot: null,
    todayExpensesSnapshot: null,
    monthSalesSnapshot: null,
    monthExpensesSnapshot: null,
  }
  let latestTargets = {
    monthlySalesTarget: DEFAULT_PERFORMANCE_TARGETS.monthlySalesTarget,
    monthlyBreakEvenTarget: DEFAULT_PERFORMANCE_TARGETS.monthlyBreakEvenTarget,
  }
  let computeVersion = 0

  const emit = async () => {
    const currentVersion = ++computeVersion
    try {
      const metrics = await buildDashboardMetrics(snapshots, latestTargets)
      if (!active || currentVersion !== computeVersion) return
      onData(metrics)
    } catch {
      if (!active || currentVersion !== computeVersion) return
      onData({
        ...empty,
        targets: { ...latestTargets },
        today: {
          ...empty.today,
          salesTarget: latestTargets.monthlySalesTarget / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
        },
        month: {
          ...empty.month,
          salesTarget: latestTargets.monthlySalesTarget,
          salesRemaining: latestTargets.monthlySalesTarget,
          breakEvenTarget: latestTargets.monthlyBreakEvenTarget,
          breakEvenRemaining: latestTargets.monthlyBreakEvenTarget,
        },
      })
    }
  }

  onData(empty)

  const unsubscribeTodaySales = onSnapshot(
    query(
      collection(firestore, 'sales'),
      where('createdAt', '>=', Timestamp.fromDate(dayStart)),
      where('createdAt', '<', Timestamp.fromDate(dayEnd))
    ),
    (snapshot) => {
      snapshots = { ...snapshots, todaySalesSnapshot: snapshot }
      void emit()
    },
    (error) => {
      console.warn('[Dashboard] today sales query failed:', error)
      snapshots = { ...snapshots, todaySalesSnapshot: null }
      void emit()
    }
  )

  const unsubscribeTodayExpenses = onSnapshot(
    query(
      collection(firestore, 'expenses'),
      where('date', '>=', Timestamp.fromDate(dayStart)),
      where('date', '<', Timestamp.fromDate(dayEnd))
    ),
    (snapshot) => {
      snapshots = { ...snapshots, todayExpensesSnapshot: snapshot }
      void emit()
    },
    (error) => {
      console.warn('[Dashboard] today expenses query failed:', error)
      snapshots = { ...snapshots, todayExpensesSnapshot: null }
      void emit()
    }
  )

  const unsubscribeMonthSales = onSnapshot(
    query(
      collection(firestore, 'sales'),
      where('createdAt', '>=', Timestamp.fromDate(monthStart)),
      where('createdAt', '<', Timestamp.fromDate(monthEnd))
    ),
    (snapshot) => {
      snapshots = { ...snapshots, monthSalesSnapshot: snapshot }
      void emit()
    },
    (error) => {
      console.warn('[Dashboard] month sales query failed:', error)
      snapshots = { ...snapshots, monthSalesSnapshot: null }
      void emit()
    }
  )

  const unsubscribeMonthExpenses = onSnapshot(
    query(
      collection(firestore, 'expenses'),
      where('date', '>=', Timestamp.fromDate(monthStart)),
      where('date', '<', Timestamp.fromDate(monthEnd))
    ),
    (snapshot) => {
      snapshots = { ...snapshots, monthExpensesSnapshot: snapshot }
      void emit()
    },
    (error) => {
      console.warn('[Dashboard] month expenses query failed:', error)
      snapshots = { ...snapshots, monthExpensesSnapshot: null }
      void emit()
    }
  )

  const unsubscribeTargets = onSnapshot(
    doc(firestore, 'app_settings', 'performance_targets'),
    (snapshot) => {
      const data = snapshot.data()
      latestTargets = {
        monthlySalesTarget: Number(data?.monthlySalesTarget ?? 0),
        monthlyBreakEvenTarget: Number(data?.monthlyBreakEvenTarget ?? 0),
      }
      void emit()
    },
    (error) => {
      console.warn('[Dashboard] performance targets query failed:', error)
      latestTargets = {
        monthlySalesTarget: DEFAULT_PERFORMANCE_TARGETS.monthlySalesTarget,
        monthlyBreakEvenTarget: DEFAULT_PERFORMANCE_TARGETS.monthlyBreakEvenTarget,
      }
      void emit()
    }
  )

  return () => {
    active = false
    unsubscribeTodaySales()
    unsubscribeTodayExpenses()
    unsubscribeMonthSales()
    unsubscribeMonthExpenses()
    unsubscribeTargets()
  }
}

function buildShiftReport(
  session: DaySession,
  salesSnapshot: QuerySnapshot<DocumentData> | null,
  cashEntriesSnapshot: QuerySnapshot<DocumentData> | null
): ShiftReport {
  const report = createEmptyShiftReport(session.openingFloat ?? 0)
  const productQtyMap: Record<string, { name: string; qty: number; total: number }> = {}
  const gstMap: Record<number, number> = {}

  salesSnapshot?.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    report.totalBills += 1
    report.totalSales += Number(data.grandTotal ?? 0)

    if (Array.isArray(data.payments)) {
      for (const payment of data.payments) {
        if (!payment || typeof payment !== 'object') continue
        const amount = Number((payment as Record<string, unknown>).amount ?? 0)
        const method = (payment as Record<string, unknown>).method
        if (method === 'cash') report.cashTotal += amount
        if (method === 'upi') report.upiTotal += amount
        if (method === 'credit') report.creditTotal += amount
      }
    }

    if (Array.isArray(data.items)) {
      for (const rawItem of data.items) {
        if (!rawItem || typeof rawItem !== 'object') continue
        const item = rawItem as Record<string, unknown>
        const productId = Number(item.productId ?? 0)
        const key = productId > 0 ? String(productId) : `${docSnapshot.id}-${String(item.productName ?? 'unknown')}`
        const productName = String(item.productName ?? `Product #${productId || key}`)
        const qty = Number(item.qty ?? 0)
        const lineTotal = Number(item.lineTotal ?? 0)
        const taxRate = Number(item.taxRate ?? 0)

        if (!productQtyMap[key]) {
          productQtyMap[key] = { name: productName, qty: 0, total: 0 }
        }

        productQtyMap[key].qty += qty
        productQtyMap[key].total += lineTotal

        if (taxRate > 0) {
          const taxAmount = lineTotal - lineTotal / (1 + taxRate / 100)
          gstMap[taxRate] = (gstMap[taxRate] ?? 0) + taxAmount
        }
      }
    }
  })

  const cashEntries: CashEntry[] = []
  cashEntriesSnapshot?.forEach((docSnapshot) => {
    const data = docSnapshot.data()
    const amount = Number(data.amount ?? 0)
    report.cashOutTotal += amount
    cashEntries.push({
      syncId: docSnapshot.id,
      ...(data.sessionId !== undefined ? { sessionId: Number(data.sessionId ?? 0) } : {}),
      amount,
      category: String(data.category ?? 'other') as CashEntry['category'],
      ...(data.note !== undefined ? { note: String(data.note) } : {}),
      authorizedBy: Number(data.authorizedBy ?? 0),
      createdAt: tsToDate(data.createdAt ?? new Date()),
    })
  })

  report.cashEntries = cashEntries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  report.expectedCash = report.openingFloat + report.cashTotal - report.cashOutTotal
  report.topProducts = Object.values(productQtyMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  report.gstByRate = Object.entries(gstMap)
    .map(([rate, taxAmount]) => ({ rate: Number(rate), taxAmount }))
    .sort((a, b) => a.rate - b.rate)

  return report
}

export function subscribeShiftReport(
  session: DaySession,
  onData: (report: ShiftReport) => void
): () => void {
  const shiftStart = session.openedAt instanceof Date ? session.openedAt : new Date(session.openedAt)
  const shiftEnd = session.closedAt
    ? (session.closedAt instanceof Date ? session.closedAt : new Date(session.closedAt))
    : null

  let active = true
  let salesSnapshot: QuerySnapshot<DocumentData> | null = null
  let cashEntriesSnapshot: QuerySnapshot<DocumentData> | null = null

  const emit = () => {
    if (!active) return
    onData(buildShiftReport(session, salesSnapshot, cashEntriesSnapshot))
  }

  onData(createEmptyShiftReport(session.openingFloat ?? 0))

  const salesFilters = [where('createdAt', '>=', Timestamp.fromDate(shiftStart))]
  if (shiftEnd) {
    salesFilters.push(where('createdAt', '<=', Timestamp.fromDate(shiftEnd)))
  }

  const unsubscribeSales = onSnapshot(
    query(collection(firestore, 'sales'), ...salesFilters),
    (snapshot) => {
      salesSnapshot = snapshot
      emit()
    },
    (error) => {
      console.warn('[Shift Report] sales query failed:', error)
      salesSnapshot = null
      emit()
    }
  )

  const cashEntryFilters =
    session.id !== undefined
      ? [where('sessionId', '==', session.id)]
      : [where('createdAt', '>=', Timestamp.fromDate(shiftStart))]

  if (shiftEnd && session.id === undefined) {
    cashEntryFilters.push(where('createdAt', '<=', Timestamp.fromDate(shiftEnd)))
  }

  const unsubscribeCashEntries = onSnapshot(
    query(collection(firestore, 'cash_entries'), ...cashEntryFilters),
    (snapshot) => {
      cashEntriesSnapshot = snapshot
      emit()
    },
    (error) => {
      console.warn('[Shift Report] cash entries query failed:', error)
      cashEntriesSnapshot = null
      emit()
    }
  )

  return () => {
    active = false
    unsubscribeSales()
    unsubscribeCashEntries()
  }
}
