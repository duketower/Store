import Dexie, { type Table } from 'dexie'
import type { Employee, Product, Batch, Customer, CreditLedgerEntry, Sale, SaleItem, Payment, DaySession, OutboxEntry, AuditLogEntry, Vendor, Grn, RtvSession, RtvItem, ExternalStaff, AttendanceLog, LeaveRequest, CashEntry, Expense, PerformanceTargets, SaleReturn } from '@/types'
import { DB_NAME } from '@/constants/app'
import { createSyncId } from '@/utils/syncIds'

export class PosDatabase extends Dexie {
  employees!: Table<Employee>
  products!: Table<Product>
  batches!: Table<Batch>
  customers!: Table<Customer>
  sales!: Table<Sale>
  sale_returns!: Table<SaleReturn>
  sale_items!: Table<SaleItem>
  payments!: Table<Payment>
  credit_ledger!: Table<CreditLedgerEntry>
  day_sessions!: Table<DaySession>
  outbox!: Table<OutboxEntry>
  audit_log!: Table<AuditLogEntry>
  vendors!: Table<Vendor>
  grns!: Table<Grn>
  rtvs!: Table<RtvSession>
  rtv_items!: Table<RtvItem>
  staff_external!: Table<ExternalStaff>
  attendance_logs!: Table<AttendanceLog>
  leave_requests!: Table<LeaveRequest>
  cash_entries!: Table<CashEntry>
  expenses!: Table<Expense>
  performance_targets!: Table<PerformanceTargets, string>

  constructor() {
    super(DB_NAME)

    this.version(1).stores({
      employees:     '++id, role, isActive',
      products:      '++id, barcode, sku, category, stock, reorderLevel',
      batches:       '++id, productId, expiryDate, batchNo',
      customers:     '++id, phone, name',
      sales:         '++id, billNo, customerId, cashierId, status, createdAt',
      sale_items:    '++id, saleId, productId, batchId',
      payments:      '++id, saleId, method, createdAt',
      credit_ledger: '++id, customerId, saleId, entryType, createdAt',
      day_sessions:  '++id, openedBy, status, openedAt',
      outbox:        '++id, action, createdAt',
    })

    this.version(2).stores({
      employees:     '++id, role, isActive',
      products:      '++id, barcode, sku, category, stock, reorderLevel',
      batches:       '++id, productId, expiryDate, batchNo',
      customers:     '++id, phone, name',
      sales:         '++id, billNo, customerId, cashierId, status, createdAt',
      sale_items:    '++id, saleId, productId, batchId',
      payments:      '++id, saleId, method, createdAt',
      credit_ledger: '++id, customerId, saleId, entryType, createdAt',
      day_sessions:  '++id, openedBy, status, openedAt',
      outbox:        '++id, action, createdAt',
      audit_log:     '++id, action, entityType, createdAt, userId',
    })

    this.version(3).stores({
      employees:     '++id, role, isActive',
      products:      '++id, barcode, sku, category, stock, reorderLevel',
      batches:       '++id, productId, expiryDate, batchNo',
      customers:     '++id, phone, name',
      sales:         '++id, billNo, customerId, cashierId, status, createdAt',
      sale_items:    '++id, saleId, productId, batchId',
      payments:      '++id, saleId, method, createdAt',
      credit_ledger: '++id, customerId, saleId, entryType, createdAt',
      day_sessions:  '++id, openedBy, status, openedAt',
      outbox:        '++id, action, createdAt',
      audit_log:     '++id, action, entityType, createdAt, userId',
      vendors:       '++id, name, isActive',
    })

    this.version(4).stores({
      employees:     '++id, role, isActive',
      products:      '++id, barcode, sku, category, stock, reorderLevel',
      batches:       '++id, productId, expiryDate, batchNo, grnId',
      customers:     '++id, phone, name',
      sales:         '++id, billNo, customerId, cashierId, status, createdAt',
      sale_items:    '++id, saleId, productId, batchId',
      payments:      '++id, saleId, method, createdAt',
      credit_ledger: '++id, customerId, saleId, entryType, createdAt',
      day_sessions:  '++id, openedBy, status, openedAt',
      outbox:        '++id, action, createdAt',
      audit_log:     '++id, action, entityType, createdAt, userId',
      vendors:       '++id, name, isActive',
      grns:          '++id, createdAt, createdBy',
      rtvs:          '++id, createdAt, createdBy',
      rtv_items:     '++id, rtvId, productId, batchId',
    })

    // v5: Attendance & Leave Management
    // Backfills monthlyLeaveAllotment = 3 on all existing employees.
    this.version(5)
      .stores({
        employees:        '++id, role, isActive',
        products:         '++id, barcode, sku, category, stock, reorderLevel',
        batches:          '++id, productId, expiryDate, batchNo, grnId',
        customers:        '++id, phone, name',
        sales:            '++id, billNo, customerId, cashierId, status, createdAt',
        sale_items:       '++id, saleId, productId, batchId',
        payments:         '++id, saleId, method, createdAt',
        credit_ledger:    '++id, customerId, saleId, entryType, createdAt',
        day_sessions:     '++id, openedBy, status, openedAt',
        outbox:           '++id, action, createdAt',
        audit_log:        '++id, action, entityType, createdAt, userId',
        vendors:          '++id, name, isActive',
        grns:             '++id, createdAt, createdBy',
        rtvs:             '++id, createdAt, createdBy',
        rtv_items:        '++id, rtvId, productId, batchId',
        staff_external:   '++id, name, isActive',
        attendance_logs:  '++id, staffId, date, [staffType+date], status, loggedBy',
        leave_requests:   '++id, employeeId, status, startDate, [employeeId+status]',
      })
      .upgrade(tx =>
        tx.table('employees').toCollection().modify((emp: Employee) => {
          if (emp.monthlyLeaveAllotment === undefined) {
            emp.monthlyLeaveAllotment = 3
          }
        })
      )

    // v6: Cash Entries — track cash going out of the counter during a shift
    this.version(6).stores({
      employees:        '++id, role, isActive',
      products:         '++id, barcode, sku, category, stock, reorderLevel',
      batches:          '++id, productId, expiryDate, batchNo, grnId',
      customers:        '++id, phone, name',
      sales:            '++id, billNo, customerId, cashierId, status, createdAt',
      sale_items:       '++id, saleId, productId, batchId',
      payments:         '++id, saleId, method, createdAt',
      credit_ledger:    '++id, customerId, saleId, entryType, createdAt',
      day_sessions:     '++id, openedBy, status, openedAt',
      outbox:           '++id, action, createdAt',
      audit_log:        '++id, action, entityType, createdAt, userId',
      vendors:          '++id, name, isActive',
      grns:             '++id, createdAt, createdBy',
      rtvs:             '++id, createdAt, createdBy',
      rtv_items:        '++id, rtvId, productId, batchId',
      staff_external:   '++id, name, isActive',
      attendance_logs:  '++id, staffId, date, [staffType+date], status, loggedBy',
      leave_requests:   '++id, employeeId, status, startDate, [employeeId+status]',
      cash_entries:     '++id, sessionId, createdAt, authorizedBy',
    })

    // v7: Expenses — manual store expense tracking
    this.version(7).stores({
      employees:        '++id, role, isActive',
      products:         '++id, barcode, sku, category, stock, reorderLevel',
      batches:          '++id, productId, expiryDate, batchNo, grnId',
      customers:        '++id, phone, name',
      sales:            '++id, billNo, customerId, cashierId, status, createdAt',
      sale_items:       '++id, saleId, productId, batchId',
      payments:         '++id, saleId, method, createdAt',
      credit_ledger:    '++id, customerId, saleId, entryType, createdAt',
      day_sessions:     '++id, openedBy, status, openedAt',
      outbox:           '++id, action, createdAt',
      audit_log:        '++id, action, entityType, createdAt, userId',
      vendors:          '++id, name, isActive',
      grns:             '++id, createdAt, createdBy',
      rtvs:             '++id, createdAt, createdBy',
      rtv_items:        '++id, rtvId, productId, batchId',
      staff_external:   '++id, name, isActive',
      attendance_logs:  '++id, staffId, date, [staffType+date], status, loggedBy',
      leave_requests:   '++id, employeeId, status, startDate, [employeeId+status]',
      cash_entries:     '++id, sessionId, createdAt, authorizedBy',
      expenses:         '++id, date, category, createdAt',
    })

    this.version(8)
      .stores({
        employees:           '++id, role, isActive',
        products:            '++id, barcode, sku, category, stock, reorderLevel',
        batches:             '++id, productId, expiryDate, batchNo, grnId',
        customers:           '++id, phone, name',
        sales:               '++id, billNo, customerId, cashierId, status, createdAt',
        sale_items:          '++id, saleId, productId, batchId',
        payments:            '++id, saleId, method, createdAt',
        credit_ledger:       '++id, customerId, saleId, entryType, createdAt',
        day_sessions:        '++id, openedBy, status, openedAt',
        outbox:              '++id, action, createdAt',
        audit_log:           '++id, action, entityType, createdAt, userId',
        vendors:             '++id, name, isActive',
        grns:                '++id, createdAt, createdBy',
        rtvs:                '++id, createdAt, createdBy',
        rtv_items:           '++id, rtvId, productId, batchId',
        staff_external:      '++id, name, isActive',
        attendance_logs:     '++id, staffId, date, [staffType+date], status, loggedBy',
        leave_requests:      '++id, employeeId, status, startDate, [employeeId+status]',
        cash_entries:        '++id, sessionId, createdAt, authorizedBy',
        expenses:            '++id, &syncId, date, category, createdAt, updatedAt',
        performance_targets: '&key, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx.table('expenses').toCollection().modify((expense: Expense) => {
          if (!expense.syncId) {
            expense.syncId = expense.id ? `legacy-expense-${expense.id}` : createSyncId('expense')
          }
          if (!expense.updatedAt) {
            expense.updatedAt = expense.createdAt ?? expense.date
          }
        })
      })

    this.version(9)
      .stores({
        employees:           '++id, role, isActive',
        products:            '++id, barcode, sku, category, stock, reorderLevel',
        batches:             '++id, productId, expiryDate, batchNo, grnId',
        customers:           '++id, phone, name',
        sales:               '++id, billNo, customerId, cashierId, status, createdAt',
        sale_returns:        '++id, &syncId, saleId, billNo, createdAt',
        sale_items:          '++id, saleId, productId, batchId',
        payments:            '++id, saleId, method, createdAt',
        credit_ledger:       '++id, &syncId, customerId, saleId, entryType, createdAt',
        day_sessions:        '++id, &syncId, openedBy, status, openedAt',
        outbox:              '++id, status, action, entityType, createdAt, updatedAt',
        audit_log:           '++id, action, entityType, createdAt, userId',
        vendors:             '++id, name, isActive',
        grns:                '++id, createdAt, createdBy',
        rtvs:                '++id, createdAt, createdBy',
        rtv_items:           '++id, rtvId, productId, batchId',
        staff_external:      '++id, name, isActive',
        attendance_logs:     '++id, staffId, date, [staffType+date], status, loggedBy',
        leave_requests:      '++id, employeeId, status, startDate, [employeeId+status]',
        cash_entries:        '++id, &syncId, sessionId, createdAt, authorizedBy',
        expenses:            '++id, &syncId, date, category, createdAt, updatedAt',
        performance_targets: '&key, updatedAt',
      })
      .upgrade(async (tx) => {
        const now = new Date()

        await tx.table('outbox').toCollection().modify((entry: OutboxEntry) => {
          if (!entry.entityType) entry.entityType = 'unknown'
          if (!entry.status) entry.status = 'pending'
          if (entry.retryCount === undefined) entry.retryCount = 0
          if (!entry.updatedAt) entry.updatedAt = entry.createdAt ?? now
        })

        await tx.table('credit_ledger').toCollection().modify((entry: CreditLedgerEntry) => {
          if (!entry.syncId) {
            entry.syncId = entry.id ? `legacy-credit-${entry.id}` : createSyncId('credit')
          }
        })

        await tx.table('cash_entries').toCollection().modify((entry: CashEntry) => {
          if (!entry.syncId) {
            entry.syncId = entry.id ? `legacy-cash-${entry.id}` : createSyncId('cash')
          }
        })

        await tx.table('day_sessions').toCollection().modify((session: DaySession) => {
          if (!session.syncId) {
            session.syncId = session.id ? `legacy-session-${session.id}` : createSyncId('session')
          }
        })
      })

    this.version(10).stores({
      employees:           '++id, role, isActive',
      products:            '++id, barcode, sku, category, stock, reorderLevel',
      batches:             '++id, productId, expiryDate, batchNo, grnId',
      customers:           '++id, phone, name',
      sales:               '++id, billNo, customerId, cashierId, status, createdAt',
      sale_returns:        '++id, &syncId, saleId, billNo, createdAt',
      sale_items:          '++id, saleId, productId, batchId',
      payments:            '++id, saleId, method, createdAt',
      credit_ledger:       '++id, &syncId, customerId, saleId, entryType, createdAt',
      day_sessions:        '++id, &syncId, openedBy, status, openedAt',
      outbox:              '++id, status, action, entityType, createdAt, updatedAt',
      audit_log:           '++id, action, entityType, createdAt, userId',
      vendors:             '++id, name, isActive',
      grns:                '++id, createdAt, createdBy',
      rtvs:                '++id, createdAt, createdBy',
      rtv_items:           '++id, rtvId, productId, batchId',
      staff_external:      '++id, name, isActive',
      attendance_logs:     '++id, staffId, date, [staffType+date], status, loggedBy',
      leave_requests:      '++id, employeeId, status, startDate, [employeeId+status]',
      cash_entries:        '++id, &syncId, sessionId, createdAt, authorizedBy',
      expenses:            '++id, &syncId, date, category, createdAt, updatedAt',
      performance_targets: '&key, updatedAt',
    })

    this.version(11)
      .stores({
        employees:           '++id, role, isActive',
        products:            '++id, barcode, sku, category, stock, reorderLevel',
        batches:             '++id, productId, expiryDate, batchNo, grnId',
        customers:           '++id, phone, name',
        sales:               '++id, billNo, customerId, cashierId, status, createdAt',
        sale_returns:        '++id, &syncId, saleId, billNo, createdAt',
        sale_items:          '++id, saleId, productId, batchId',
        payments:            '++id, saleId, method, createdAt',
        credit_ledger:       '++id, &syncId, customerId, saleId, entryType, createdAt',
        day_sessions:        '++id, &syncId, openedBy, status, openedAt',
        outbox:              '++id, status, action, entityType, createdAt, updatedAt',
        audit_log:           '++id, action, entityType, createdAt, userId',
        vendors:             '++id, &syncId, name, isActive',
        grns:                '++id, &syncId, createdAt, createdBy',
        rtvs:                '++id, createdAt, createdBy',
        rtv_items:           '++id, rtvId, productId, batchId',
        staff_external:      '++id, name, isActive',
        attendance_logs:     '++id, staffId, date, [staffType+date], status, loggedBy',
        leave_requests:      '++id, employeeId, status, startDate, [employeeId+status]',
        cash_entries:        '++id, &syncId, sessionId, createdAt, authorizedBy',
        expenses:            '++id, &syncId, date, category, createdAt, updatedAt',
        performance_targets: '&key, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx.table('vendors').toCollection().modify((vendor: Vendor) => {
          if (!vendor.syncId) {
            vendor.syncId = vendor.id ? `legacy-vendor-${vendor.id}` : createSyncId('vendor')
          }
        })

        await tx.table('grns').toCollection().modify((grn: Grn) => {
          if (!grn.syncId) {
            grn.syncId = grn.id ? `legacy-grn-${grn.id}` : createSyncId('grn')
          }
        })
      })

    this.version(12)
      .stores({
        employees:           '++id, role, isActive',
        products:            '++id, barcode, sku, category, stock, reorderLevel',
        batches:             '++id, productId, expiryDate, batchNo, grnId',
        customers:           '++id, phone, name',
        sales:               '++id, billNo, customerId, cashierId, status, createdAt',
        sale_returns:        '++id, &syncId, saleId, billNo, createdAt',
        sale_items:          '++id, saleId, productId, batchId',
        payments:            '++id, saleId, method, createdAt',
        credit_ledger:       '++id, &syncId, customerId, saleId, entryType, createdAt',
        day_sessions:        '++id, &syncId, openedBy, status, openedAt',
        outbox:              '++id, status, action, entityType, createdAt, updatedAt',
        audit_log:           '++id, action, entityType, createdAt, userId',
        vendors:             '++id, &syncId, name, isActive',
        grns:                '++id, &syncId, createdAt, createdBy',
        rtvs:                '++id, &syncId, createdAt, createdBy',
        rtv_items:           '++id, rtvId, productId, batchId',
        staff_external:      '++id, name, isActive',
        attendance_logs:     '++id, staffId, date, [staffType+date], status, loggedBy',
        leave_requests:      '++id, employeeId, status, startDate, [employeeId+status]',
        cash_entries:        '++id, &syncId, sessionId, createdAt, authorizedBy',
        expenses:            '++id, &syncId, date, category, createdAt, updatedAt',
        performance_targets: '&key, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx.table('rtvs').toCollection().modify((rtv: RtvSession) => {
          if (!rtv.syncId) {
            rtv.syncId = rtv.id ? `legacy-rtv-${rtv.id}` : createSyncId('rtv')
          }
        })
      })
  }
}
