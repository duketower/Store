import bcrypt from 'bcryptjs'
import { db } from './index'

// Idempotent seed — each section has its own guard
export async function seedDatabase(): Promise<void> {
  const employeeCount = await db.employees.count()
  if (employeeCount > 0) {
    // Employees already seeded — only run the newer sections below
    await seedGrnsAndRtvs()
    return
  }

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

  await seedGrnsAndRtvs()
}

async function seedGrnsAndRtvs(): Promise<void> {
  if (await db.grns.count() > 0) return  // already seeded

  const now = new Date()
  const admin = await db.employees.where('role').equals('admin').first()
  const createdBy = admin?.id ?? 1

  const butter = await db.products.where('sku').equals('DAIRY-001').first()
  const milk   = await db.products.where('sku').equals('DAIRY-002').first()
  const salt   = await db.products.where('sku').equals('GROCERY-001').first()
  const oil    = await db.products.where('sku').equals('OIL-001').first()
  const rice   = await db.products.where('sku').equals('RICE-001').first()
  const biscuit = await db.products.where('sku').equals('BISCUIT-001').first()

  // ── GRN 1: Amul Distributor, 7 days ago ──────────────────────────────
  const grn1Value = 230 * 20 + 58 * 48
  const grn1Id = await db.grns.add({
    vendorName: 'Amul Distributor',
    invoiceNo: 'INV-2024-0142',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    createdBy,
    totalValue: grn1Value,
    lineCount: 2,
  })

  const grn1Batch1Id = butter?.id ? await db.batches.add({
    productId: butter.id,
    batchNo: 'BTR-2403',
    mfgDate: new Date('2024-08-01'),
    expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    purchasePrice: 230,
    qtyRemaining: 20,
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    vendor: 'Amul Distributor',
    invoiceNo: 'INV-2024-0142',
    grnId: grn1Id,
  }) : null

  const grn1Batch2Id = milk?.id ? await db.batches.add({
    productId: milk.id,
    batchNo: 'MLK-2401',
    mfgDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    purchasePrice: 58,
    qtyRemaining: 48,
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    vendor: 'Amul Distributor',
    invoiceNo: 'INV-2024-0142',
    grnId: grn1Id,
  }) : null

  // ── GRN 2: Hindustan Distributors, 3 days ago ─────────────────────────
  const grn2Value = 18 * 100 + 118 * 24
  const grn2Id = await db.grns.add({
    vendorName: 'Hindustan Distributors',
    invoiceNo: 'HD/2024/558',
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    createdBy,
    totalValue: grn2Value,
    lineCount: 2,
  })

  const grn2Batch1Id = salt?.id ? await db.batches.add({
    productId: salt.id,
    batchNo: 'SALT-2401',
    expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    purchasePrice: 18,
    qtyRemaining: 100,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    vendor: 'Hindustan Distributors',
    invoiceNo: 'HD/2024/558',
    grnId: grn2Id,
  }) : null

  const grn2Batch2Id = oil?.id ? await db.batches.add({
    productId: oil.id,
    batchNo: 'OIL-2401',
    expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
    purchasePrice: 118,
    qtyRemaining: 24,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    vendor: 'Hindustan Distributors',
    invoiceNo: 'HD/2024/558',
    grnId: grn2Id,
  }) : null

  // ── RTV 1: 5 pcs Amul Butter returned (damaged packaging), 5 days ago ──
  if (grn1Batch1Id && butter?.id) {
    const rtv1Id = await db.rtvs.add({
      vendorName: 'Amul Distributor',
      invoiceNo: 'INV-2024-0142',
      reason: 'Damaged packaging — 5 pcs crushed on delivery',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      createdBy,
      totalValue: 230 * 5,
      lineCount: 1,
    })
    await db.rtv_items.add({
      rtvId: rtv1Id,
      productId: butter.id,
      batchId: grn1Batch1Id,
      batchNo: 'BTR-2403',
      qty: 5,
      purchasePrice: 230,
    })
  }

  // ── RTV 2: 10 kg Basmati Rice + 12 pcs biscuit (wrong batch), 2 days ago ──
  const riceB = rice?.id ? await db.batches.where('productId').equals(rice.id).first() : null
  if (riceB?.id && rice?.id) {
    const rtv2Id = await db.rtvs.add({
      vendorName: 'Agro Fresh Suppliers',
      reason: 'Wrong batch supplied — expiry date mismatch on invoice',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      createdBy,
      totalValue: 72 * 10 + (biscuit?.id ? 20 * 12 : 0),
      lineCount: biscuit?.id ? 2 : 1,
    })
    await db.rtv_items.add({
      rtvId: rtv2Id,
      productId: rice.id,
      batchId: riceB.id,
      batchNo: riceB.batchNo,
      qty: 10,
      purchasePrice: 72,
    })
    if (biscuit?.id) {
      const biscuitB = await db.batches.where('productId').equals(biscuit.id).first()
      if (biscuitB?.id) {
        await db.rtv_items.add({
          rtvId: rtv2Id,
          productId: biscuit.id,
          batchId: biscuitB.id,
          batchNo: biscuitB.batchNo,
          qty: 12,
          purchasePrice: 20,
        })
      }
    }
  }

  // suppress unused-var warnings for batch IDs we only needed for RTV linking
  void grn1Batch2Id; void grn2Batch1Id; void grn2Batch2Id
}
