import Dexie, { type Table } from 'dexie'
import type { Employee, Product, Batch, Customer, CreditLedgerEntry, Sale, SaleItem, Payment, DaySession, OutboxEntry, AuditLogEntry } from '@/types'
import { DB_NAME } from '@/constants/app'

export class PosDatabase extends Dexie {
  employees!: Table<Employee>
  products!: Table<Product>
  batches!: Table<Batch>
  customers!: Table<Customer>
  sales!: Table<Sale>
  sale_items!: Table<SaleItem>
  payments!: Table<Payment>
  credit_ledger!: Table<CreditLedgerEntry>
  day_sessions!: Table<DaySession>
  outbox!: Table<OutboxEntry>
  audit_log!: Table<AuditLogEntry>

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
  }
}
