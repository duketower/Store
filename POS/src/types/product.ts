export interface Product {
  id?: number
  name: string
  barcode?: string
  sku?: string
  category: string
  unit: string           // display unit: 'kg', 'g', 'pcs', 'litre', 'ml'
  soldByWeight: boolean  // if true, billing page reads from scale
  sellingPrice: number   // tax-inclusive MRP for retail
  mrp: number
  taxRate: number        // total GST %: 0, 5, 12, 18, 28
  hsnCode: string
  stock: number          // in retail units
  reorderLevel: number
  baseUnit?: string      // e.g. '50kg sack' for loose items
  baseQty?: number       // conversion factor: 1 baseUnit = baseQty retail units
  isActive?: boolean     // default true; false = archived
  createdAt: Date
  updatedAt: Date
}

export interface Batch {
  id?: number
  productId: number
  batchNo: string
  mfgDate?: Date
  expiryDate: Date
  purchasePrice: number
  qtyRemaining: number
  createdAt: Date
}
