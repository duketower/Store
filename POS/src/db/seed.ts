import bcrypt from 'bcryptjs'
import { db } from './index'

// Idempotent seed — checks before inserting
export async function seedDatabase(): Promise<void> {
  const employeeCount = await db.employees.count()
  if (employeeCount > 0) return  // already seeded

  const SALT_ROUNDS = 10

  // Seed employees
  const pin1234 = await bcrypt.hash('1234', SALT_ROUNDS)

  await db.employees.bulkAdd([
    {
      name: 'Anurag',
      role: 'admin',
      passwordHash: await bcrypt.hash('admin123', SALT_ROUNDS),
      pinHash: pin1234,
      isActive: true,
      createdAt: new Date(),
    },
    {
      name: 'Vaibhav',
      role: 'manager',
      passwordHash: await bcrypt.hash('manager123', SALT_ROUNDS),
      pinHash: pin1234,
      isActive: true,
      createdAt: new Date(),
    },
    {
      name: 'Samad',
      role: 'cashier',
      pinHash: pin1234,
      isActive: true,
      createdAt: new Date(),
    },
  ])

  const now = new Date()

  // Seed products (varied GST slabs, barcodes, stock)
  await db.products.bulkAdd([
    {
      name: 'Amul Butter 500g',
      barcode: '8901063011034',
      sku: 'DAIRY-001',
      category: 'Dairy',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 260,
      mrp: 275,
      taxRate: 12,
      hsnCode: '0405',
      stock: 45,
      reorderLevel: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Amul Milk 1L',
      barcode: '8901063015001',
      sku: 'DAIRY-002',
      category: 'Dairy',
      unit: 'litre',
      soldByWeight: false,
      sellingPrice: 66,
      mrp: 68,
      taxRate: 0,
      hsnCode: '0401',
      stock: 120,
      reorderLevel: 30,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Tata Salt 1kg',
      barcode: '8901139001234',
      sku: 'GROCERY-001',
      category: 'Grocery',
      unit: 'kg',
      soldByWeight: false,
      sellingPrice: 21,
      mrp: 22,
      taxRate: 0,
      hsnCode: '2501',
      stock: 200,
      reorderLevel: 50,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Fortune Sunflower Oil 1L',
      barcode: '8901725131416',
      sku: 'OIL-001',
      category: 'Oil',
      unit: 'litre',
      soldByWeight: false,
      sellingPrice: 135,
      mrp: 140,
      taxRate: 5,
      hsnCode: '1512',
      stock: 60,
      reorderLevel: 15,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Britannia Bourbon 100g',
      barcode: '8901063109507',
      sku: 'BISCUIT-001',
      category: 'Snacks',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 25,
      mrp: 25,
      taxRate: 18,
      hsnCode: '1905',
      stock: 80,
      reorderLevel: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Basmati Rice (loose)',
      barcode: '9999001',
      sku: 'RICE-001',
      category: 'Grains',
      unit: 'kg',
      soldByWeight: true,
      sellingPrice: 95,
      mrp: 100,
      taxRate: 5,
      hsnCode: '1006',
      stock: 150,
      reorderLevel: 25,
      baseUnit: '50kg sack',
      baseQty: 50,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Onions (loose)',
      barcode: '9999002',
      sku: 'VEG-001',
      category: 'Vegetables',
      unit: 'kg',
      soldByWeight: true,
      sellingPrice: 35,
      mrp: 40,
      taxRate: 0,
      hsnCode: '0703',
      stock: 80,
      reorderLevel: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Surf Excel 1kg',
      barcode: '8901030734802',
      sku: 'HOUSEHOLD-001',
      category: 'Household',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 195,
      mrp: 205,
      taxRate: 18,
      hsnCode: '3402',
      stock: 12,  // low stock to trigger alert in demo
      reorderLevel: 15,
      createdAt: now,
      updatedAt: now,
    },
  ])

  // Seed batches for the butter (near-expiry demo) and rice
  const butter = await db.products.where('sku').equals('DAIRY-001').first()
  const rice = await db.products.where('sku').equals('RICE-001').first()

  if (butter?.id) {
    await db.batches.bulkAdd([
      {
        productId: butter.id,
        batchNo: 'BTR-2401',
        mfgDate: new Date('2024-01-01'),
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        purchasePrice: 230,
        qtyRemaining: 20,
        createdAt: now,
      },
      {
        productId: butter.id,
        batchNo: 'BTR-2402',
        mfgDate: new Date('2024-03-01'),
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        purchasePrice: 235,
        qtyRemaining: 25,
        createdAt: now,
      },
    ])
  }

  if (rice?.id) {
    await db.batches.add({
      productId: rice.id,
      batchNo: 'RICE-2401',
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      purchasePrice: 72,
      qtyRemaining: 150,
      createdAt: now,
    })
  }

  // Seed customers with credit balances (bulkPut = upsert so stale data gets corrected)
  await db.customers.bulkPut([
    {
      name: 'Ramesh Kumar',
      phone: '9876543210',
      creditLimit: 2000,
      currentBalance: 850,  // owes ₹850
      loyaltyPoints: 120,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Sunita Devi',
      phone: '9123456789',
      creditLimit: 1000,
      currentBalance: 0,
      loyaltyPoints: 45,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
  ])
}
