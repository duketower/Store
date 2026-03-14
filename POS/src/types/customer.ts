export interface Customer {
  id?: number
  name: string
  phone?: string
  creditLimit: number
  currentBalance: number  // positive = they owe us
  loyaltyPoints: number
  createdAt: Date
  updatedAt: Date
}

export type CreditEntryType = 'debit' | 'credit'

export interface CreditLedgerEntry {
  id?: number
  customerId: number
  saleId?: number
  entryType: CreditEntryType  // debit = charge, credit = payment received
  amount: number
  notes?: string
  createdAt: Date
}
