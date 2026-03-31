export interface Vendor {
  id?: number
  syncId?: string
  name: string
  phone?: string
  gstin?: string
  address?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type SessionStatus = 'open' | 'closed'

export interface DaySession {
  id?: number
  syncId?: string
  openedBy: number      // employeeId
  openingFloat: number
  closedBy?: number
  closingCash?: number
  expectedCash?: number
  variance?: number
  varianceNote?: string
  status: SessionStatus
  openedAt: Date
  closedAt?: Date
}

export interface OutboxEntry {
  id?: number
  action: string
  entityType: string
  entityKey?: string
  payload: string  // JSON serialized
  status: 'pending' | 'syncing' | 'failed'
  retryCount: number
  lastAttemptAt?: Date
  lastError?: string
  syncedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AuditLogEntry {
  id?: number
  action: string       // 'stock_adjust' | 'price_change' | 'return'
  entityType: string   // 'product' | 'sale'
  entityId: number
  detail: string       // JSON: { before, after, reason }
  userId: number
  createdAt: Date
}

export interface Grn {
  id?: number
  syncId?: string
  vendorName?: string
  invoiceNo?: string
  createdAt: Date
  createdBy: number   // employeeId
  totalValue: number
  lineCount: number
}

export interface RtvSession {
  id?: number
  syncId?: string
  vendorName?: string
  invoiceNo?: string  // reference back to vendor's invoice
  reason: string
  createdAt: Date
  createdBy: number
  totalValue: number
  lineCount: number
  // Embedded when read from Firestore
  items?: RtvItem[]
}

export interface RtvItem {
  id?: number
  rtvId: number
  productId: number
  batchId: number
  batchNo: string
  qty: number
  purchasePrice: number
}

export type CashEntryCategory =
  | 'supplies'
  | 'vendor_payment'
  | 'salary_advance'
  | 'utilities'
  | 'transport'
  | 'other'

export interface CashEntry {
  id?: number
  syncId?: string
  sessionId?: number       // day_session id at time of entry
  amount: number
  category: CashEntryCategory
  note?: string
  authorizedBy: number     // employeeId
  createdAt: Date
}

export interface Expense {
  id?: number
  syncId: string
  category: string       // e.g. "Electricity", "Rent", "Staff", "Maintenance", "Other"
  amount: number
  note?: string
  date: Date
  createdAt: Date
  updatedAt: Date
}
