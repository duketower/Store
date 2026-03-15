export type SaleStatus = 'completed' | 'pending_sync' | 'voided'
export type PaymentMethod = 'cash' | 'upi' | 'credit' | 'card' | 'split'

export interface Sale {
  id?: number
  billNo: string
  customerId?: number
  cashierId: number
  subtotal: number
  discount: number
  taxTotal: number
  grandTotal: number
  status: SaleStatus
  createdAt: Date
}

export interface SaleItem {
  id?: number
  saleId: number
  productId: number
  batchId?: number
  qty: number
  unitPrice: number
  discount: number
  taxRate: number
  lineTotal: number
}

export interface Payment {
  id?: number
  saleId: number
  method: PaymentMethod
  amount: number
  referenceNo?: string
  createdAt: Date
}

export interface CartItem {
  productId: number
  batchId?: number
  name: string
  barcode?: string
  qty: number
  unitPrice: number
  taxRate: number
  discount: number
  lineTotal: number
  soldByWeight: boolean
  unit: string
}
