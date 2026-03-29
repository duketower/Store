/**
 * One-time migration: Dexie (IndexedDB) → Firestore.
 * Uses setDoc (idempotent) — safe to re-run; existing docs are overwritten with current values.
 * Never migrates outbox or auth sessions.
 */
import { doc, Timestamp, writeBatch } from 'firebase/firestore'
import { firestore } from '@/services/firebase'
import { db } from '@/db'
import { loadStoreConfig } from '@/utils/storeConfig'

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
      data: {
        ...c,
        createdAt: toTs(c.createdAt),
        updatedAt: toTs(c.updatedAt),
      },
    }))
  )
  onProgress({ stage: 'Customers', done: customers.length, total: customers.length })

  // ── Employees ────────────────────────────────────────────────────────────────
  const employees = await db.employees.toArray()
  onProgress({ stage: 'Employees', done: 0, total: employees.length })
  await batchWrite(
    'employees',
    employees.map((e) => ({
      id: e.id!,
      data: {
        id: e.id,
        name: e.name,
        role: e.role,
        isActive: e.isActive,
        ...(e.monthlyLeaveAllotment !== undefined
          ? { monthlyLeaveAllotment: e.monthlyLeaveAllotment }
          : {}),
        ...(e.credentialUpdatedAt ? { credentialUpdatedAt: toTs(e.credentialUpdatedAt) } : {}),
        createdAt: toTs(e.createdAt),
        updatedAt: toTs(e.updatedAt ?? e.createdAt),
      },
    }))
  )
  onProgress({ stage: 'Employees', done: employees.length, total: employees.length })

  const employeeCredentials = await db.employee_credentials.toArray()
  onProgress({ stage: 'Employee Credentials', done: 0, total: employeeCredentials.length })
  await batchWrite(
    'employee_credentials',
    employeeCredentials.map((credential) => ({
      id: credential.employeeId,
      data: {
        employeeId: credential.employeeId,
        pinHash: credential.pinHash,
        updatedAt: toTs(credential.updatedAt),
      },
    }))
  )
  onProgress({ stage: 'Employee Credentials', done: employeeCredentials.length, total: employeeCredentials.length })

  // ── Expenses ───────────────────────────────────────────────────────────────
  const expenses = await db.expenses.toArray()
  onProgress({ stage: 'Expenses', done: 0, total: expenses.length })
  await batchWrite(
    'expenses',
    expenses.map((expense) => ({
      id: expense.syncId,
      data: {
        ...expense,
        date: toTs(expense.date),
        createdAt: toTs(expense.createdAt),
        updatedAt: toTs(expense.updatedAt),
      },
    }))
  )
  onProgress({ stage: 'Expenses', done: expenses.length, total: expenses.length })

  // ── Vendors ───────────────────────────────────────────────────────────────
  const vendors = await db.vendors.toArray()
  onProgress({ stage: 'Vendors', done: 0, total: vendors.length })
  await batchWrite(
    'vendors',
    vendors.map((vendor) => ({
      id: vendor.syncId ?? `legacy-vendor-${vendor.id!}`,
      data: {
        ...vendor,
        syncId: vendor.syncId ?? `legacy-vendor-${vendor.id!}`,
        createdAt: toTs(vendor.createdAt),
        updatedAt: toTs(vendor.updatedAt),
      },
    }))
  )
  onProgress({ stage: 'Vendors', done: vendors.length, total: vendors.length })

  // ── GRNs ──────────────────────────────────────────────────────────────────
  const grns = await db.grns.toArray()
  onProgress({ stage: 'GRNs', done: 0, total: grns.length })
  await batchWrite(
    'grns',
    grns.map((grn) => ({
      id: grn.syncId ?? `legacy-grn-${grn.id!}`,
      data: {
        ...grn,
        syncId: grn.syncId ?? `legacy-grn-${grn.id!}`,
        createdAt: toTs(grn.createdAt),
      },
    }))
  )
  onProgress({ stage: 'GRNs', done: grns.length, total: grns.length })

  // ── RTVs ──────────────────────────────────────────────────────────────────
  const rtvs = await db.rtvs.toArray()
  onProgress({ stage: 'RTVs', done: 0, total: rtvs.length })
  await batchWrite(
    'rtvs',
    await Promise.all(
      rtvs.map(async (rtv) => ({
        id: rtv.syncId ?? `legacy-rtv-${rtv.id!}`,
        data: {
          ...rtv,
          syncId: rtv.syncId ?? `legacy-rtv-${rtv.id!}`,
          createdAt: toTs(rtv.createdAt),
          items: await db.rtv_items.where('rtvId').equals(rtv.id!).toArray(),
        },
      }))
    )
  )
  onProgress({ stage: 'RTVs', done: rtvs.length, total: rtvs.length })

  // ── Sales ─────────────────────────────────────────────────────────────────
  const sales = await db.sales.toArray()
  onProgress({ stage: 'Sales', done: 0, total: sales.length })
  await batchWrite(
    'sales',
    await Promise.all(
      sales.map(async (sale) => ({
        id: sale.billNo,
        data: {
          ...sale,
          saleId: sale.id,
          createdAt: toTs(sale.createdAt),
          ...(sale.lastReturnAt ? { lastReturnAt: toTs(sale.lastReturnAt) } : {}),
          items: await db.sale_items.where('saleId').equals(sale.id!).toArray(),
          payments: (await db.payments.where('saleId').equals(sale.id!).toArray()).map((payment) => ({
            ...payment,
            createdAt: toTs(payment.createdAt),
          })),
        },
      }))
    )
  )
  onProgress({ stage: 'Sales', done: sales.length, total: sales.length })

  // ── Sale Returns ──────────────────────────────────────────────────────────
  const saleReturns = await db.sale_returns.toArray()
  onProgress({ stage: 'Returns', done: 0, total: saleReturns.length })
  await batchWrite(
    'sale_returns',
    saleReturns.map((saleReturn) => ({
      id: saleReturn.syncId,
      data: {
        ...saleReturn,
        createdAt: toTs(saleReturn.createdAt),
      },
    }))
  )
  onProgress({ stage: 'Returns', done: saleReturns.length, total: saleReturns.length })

  // ── Credit Ledger ─────────────────────────────────────────────────────────
  const creditLedger = await db.credit_ledger.toArray()
  onProgress({ stage: 'Credit Ledger', done: 0, total: creditLedger.length })
  await batchWrite(
    'credit_ledger',
    creditLedger.map((entry) => ({
      id: entry.syncId ?? `legacy-credit-${entry.id!}`,
      data: {
        ...entry,
        syncId: entry.syncId ?? `legacy-credit-${entry.id!}`,
        createdAt: toTs(entry.createdAt),
      },
    }))
  )
  onProgress({ stage: 'Credit Ledger', done: creditLedger.length, total: creditLedger.length })

  // ── Day Sessions ──────────────────────────────────────────────────────────
  const sessions = await db.day_sessions.toArray()
  onProgress({ stage: 'Day Sessions', done: 0, total: sessions.length })
  await batchWrite(
    'day_sessions',
    sessions.map((session) => ({
      id: session.syncId ?? `legacy-session-${session.id!}`,
      data: {
        ...session,
        syncId: session.syncId ?? `legacy-session-${session.id!}`,
        openedAt: toTs(session.openedAt),
        closedAt: toTs(session.closedAt),
      },
    }))
  )
  onProgress({ stage: 'Day Sessions', done: sessions.length, total: sessions.length })

  // ── Cash Entries ──────────────────────────────────────────────────────────
  const cashEntries = await db.cash_entries.toArray()
  onProgress({ stage: 'Cash Entries', done: 0, total: cashEntries.length })
  await batchWrite(
    'cash_entries',
    cashEntries.map((entry) => ({
      id: entry.syncId ?? `legacy-cash-${entry.id!}`,
      data: {
        ...entry,
        syncId: entry.syncId ?? `legacy-cash-${entry.id!}`,
        createdAt: toTs(entry.createdAt),
      },
    }))
  )
  onProgress({ stage: 'Cash Entries', done: cashEntries.length, total: cashEntries.length })

  // ── External Staff ────────────────────────────────────────────────────────
  const externalStaff = await db.staff_external.toArray()
  onProgress({ stage: 'External Staff', done: 0, total: externalStaff.length })
  await batchWrite(
    'staff_external',
    externalStaff.map((staff) => ({
      id: staff.syncId ?? `legacy-external-staff-${staff.id!}`,
      data: {
        ...staff,
        syncId: staff.syncId ?? `legacy-external-staff-${staff.id!}`,
        createdAt: toTs(staff.createdAt),
        updatedAt: toTs(staff.updatedAt ?? staff.createdAt),
      },
    }))
  )
  onProgress({ stage: 'External Staff', done: externalStaff.length, total: externalStaff.length })

  // ── Attendance Logs ───────────────────────────────────────────────────────
  const attendanceLogs = await db.attendance_logs.toArray()
  onProgress({ stage: 'Attendance Logs', done: 0, total: attendanceLogs.length })
  await batchWrite(
    'attendance_logs',
    attendanceLogs.map((log) => ({
      id: log.syncId ?? `legacy-attendance-${log.id!}`,
      data: {
        ...log,
        syncId: log.syncId ?? `legacy-attendance-${log.id!}`,
        checkIn: toTs(log.checkIn),
        checkOut: toTs(log.checkOut),
        createdAt: toTs(log.createdAt),
      },
    }))
  )
  onProgress({ stage: 'Attendance Logs', done: attendanceLogs.length, total: attendanceLogs.length })

  // ── Leave Requests ────────────────────────────────────────────────────────
  const leaveRequests = await db.leave_requests.toArray()
  onProgress({ stage: 'Leave Requests', done: 0, total: leaveRequests.length })
  await batchWrite(
    'leave_requests',
    leaveRequests.map((request) => ({
      id: request.syncId ?? `legacy-leave-${request.id!}`,
      data: {
        ...request,
        syncId: request.syncId ?? `legacy-leave-${request.id!}`,
        createdAt: toTs(request.createdAt),
        approvedAt: toTs(request.approvedAt),
      },
    }))
  )
  onProgress({ stage: 'Leave Requests', done: leaveRequests.length, total: leaveRequests.length })

  // ── Performance Targets ───────────────────────────────────────────────────
  const performanceTargets = await db.performance_targets.toArray()
  onProgress({ stage: 'Performance Targets', done: 0, total: performanceTargets.length })
  await batchWrite(
    'app_settings',
    performanceTargets.map((targets) => ({
      id: targets.key,
      data: {
        monthlySalesTarget: targets.monthlySalesTarget,
        monthlyBreakEvenTarget: targets.monthlyBreakEvenTarget,
        updatedAt: toTs(targets.updatedAt),
        ...(targets.updatedBy !== undefined ? { updatedBy: targets.updatedBy } : {}),
      },
    }))
  )
  onProgress({ stage: 'Performance Targets', done: performanceTargets.length, total: performanceTargets.length })

  // ── Store Settings ────────────────────────────────────────────────────────
  const storedSettings = await db.store_settings.get('store_details')
  const storeConfig = storedSettings?.config ?? loadStoreConfig()
  onProgress({ stage: 'Store Settings', done: 0, total: 1 })
  await batchWrite('app_settings', [{
    id: 'store_details',
    data: {
      config: storeConfig,
      updatedAt: toTs(storedSettings?.updatedAt ?? new Date()),
      ...(storedSettings?.updatedBy !== undefined ? { updatedBy: storedSettings.updatedBy } : {}),
    },
  }])
  onProgress({ stage: 'Store Settings', done: 1, total: 1 })

  onProgress({ stage: 'Done', done: 0, total: 0 })
}
