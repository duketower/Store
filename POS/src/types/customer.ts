export interface Customer {
  id?: number
  name: string
  phone?: string
  creditLimit: number
  currentBalance: number  // positive = they owe us
  loyaltyPoints: number
  creditApproved: boolean   // admin/manager must enable before credit sales allowed
  creditRequested: boolean  // cashier can flag a request; admin/manager approves
  createdAt: Date
  updatedAt: Date
}

export type CreditEntryType = 'debit' | 'credit'

export interface CreditLedgerEntry {
  id?: number
  syncId?: string
  customerId: number
  saleId?: number
  entryType: CreditEntryType  // debit = charge, credit = payment received
  amount: number
  notes?: string
  createdAt: Date
}
