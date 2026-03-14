export type SessionStatus = 'open' | 'closed'

export interface DaySession {
  id?: number
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
  payload: string  // JSON serialized
  createdAt: Date
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
