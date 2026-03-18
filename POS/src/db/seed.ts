import bcrypt from 'bcryptjs'
import { db } from './index'
import { CLIENT_CONFIG } from '@/constants/clientConfig'

// Default credentials communicated to each client on handover.
// Admin/Manager are asked to change their password on first login via Users page.
const DEFAULT_ADMIN_PASSWORD   = 'Admin@1234'
const DEFAULT_MANAGER_PASSWORD = 'Manager@1234'
const DEFAULT_CASHIER_PIN      = '1234'

// Idempotent seed — each section has its own guard
export async function seedDatabase(): Promise<void> {
  const employeeCount = await db.employees.count()
  if (employeeCount > 0) {
    // Employees already seeded — only run the newer sections below
    await seedGrnsAndRtvs()
    await seedMoreProducts()
    await seedMoreCustomers()
    await seedSalesHistory()
    await seedExpenses()
    return
  }

  const SALT_ROUNDS = 10
  const now = new Date()

  // Use staff from CLIENT_CONFIG when provided (client builds from requirement form).
  // Falls back to hardcoded dev names when CLIENT_CONFIG.staff is absent (dev mode only).
  if (CLIENT_CONFIG.staff && CLIENT_CONFIG.staff.length > 0) {
    const defaultPin = await bcrypt.hash(DEFAULT_CASHIER_PIN, SALT_ROUNDS)

    const employees = await Promise.all(
      CLIENT_CONFIG.staff.map(async ({ name, role }) => {
        const base = { name, role, pinHash: defaultPin, isActive: true, createdAt: now }
        if (role === 'admin') {
          return { ...base, passwordHash: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS) }
        }
        if (role === 'manager') {
          return { ...base, passwordHash: await bcrypt.hash(DEFAULT_MANAGER_PASSWORD, SALT_ROUNDS) }
        }
        return base  // cashier — PIN only, no password needed
      })
    )

    await db.employees.bulkAdd(employees)
  } else {
    // Dev fallback — personal dev credentials, never shipped to clients
    const pin1234 = await bcrypt.hash('1234', SALT_ROUNDS)
    await db.employees.bulkAdd([
      {
        name: 'Anurag',
        role: 'admin',
        passwordHash: await bcrypt.hash('admin123', SALT_ROUNDS),
        pinHash: pin1234,
        isActive: true,
        createdAt: now,
      },
      {
        name: 'Vaibhav',
        role: 'manager',
        passwordHash: await bcrypt.hash('manager123', SALT_ROUNDS),
        pinHash: pin1234,
        isActive: true,
        createdAt: now,
      },
      {
        name: 'Samad',
        role: 'cashier',
        pinHash: pin1234,
        isActive: true,
        createdAt: now,
      },
    ])
  }

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
  await seedMoreProducts()
  await seedMoreCustomers()
  await seedSalesHistory()
  await seedExpenses()
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
    await db.batches.where('id').equals(grn1Batch1Id).modify((b) => {
      b.qtyRemaining = Math.max(0, b.qtyRemaining - 5)
    })
    if (butter?.id) {
      await db.products.where('id').equals(butter.id).modify((p) => {
        p.stock = Math.max(0, p.stock - 5)
        p.updatedAt = new Date()
      })
    }
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
    await db.batches.where('id').equals(riceB.id).modify((b) => {
      b.qtyRemaining = Math.max(0, b.qtyRemaining - 10)
    })
    if (rice?.id) {
      await db.products.where('id').equals(rice.id).modify((p) => {
        p.stock = Math.max(0, p.stock - 10)
        p.updatedAt = new Date()
      })
    }
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
        await db.batches.where('id').equals(biscuitB.id).modify((b) => {
          b.qtyRemaining = Math.max(0, b.qtyRemaining - 12)
        })
        await db.products.where('id').equals(biscuit.id).modify((p) => {
          p.stock = Math.max(0, p.stock - 12)
          p.updatedAt = new Date()
        })
      }
    }
  }

  // suppress unused-var warnings for batch IDs we only needed for RTV linking
  void grn1Batch2Id; void grn2Batch1Id; void grn2Batch2Id
}

// ─────────────────────────────────────────────────────────────────────────────
// seedMoreProducts — expands the catalogue from 8 to 30 realistic SKUs
// ─────────────────────────────────────────────────────────────────────────────
async function seedMoreProducts(): Promise<void> {
  if (await db.products.count() >= 15) return

  const now = new Date()

  await db.products.bulkAdd([
    // ── Dairy ──────────────────────────────────────────────────────────────
    {
      name: 'Amul Paneer 200g',
      barcode: '8901063035108',
      sku: 'DAIRY-003',
      category: 'Dairy',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 80,
      mrp: 85,
      taxRate: 12,
      hsnCode: '0406',
      stock: 40,
      reorderLevel: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Mother Dairy Curd 400g',
      barcode: '8901519110017',
      sku: 'DAIRY-004',
      category: 'Dairy',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 50,
      mrp: 52,
      taxRate: 5,
      hsnCode: '0403',
      stock: 60,
      reorderLevel: 15,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Amul Cheese Slices 200g',
      barcode: '8901063015216',
      sku: 'DAIRY-005',
      category: 'Dairy',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 120,
      mrp: 125,
      taxRate: 12,
      hsnCode: '0406',
      stock: 30,
      reorderLevel: 8,
      createdAt: now,
      updatedAt: now,
    },
    // ── Staples ────────────────────────────────────────────────────────────
    {
      name: 'Aashirvaad Atta 5kg',
      barcode: '8901058003621',
      sku: 'STAPLE-001',
      category: 'Staples',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 230,
      mrp: 245,
      taxRate: 0,
      hsnCode: '1101',
      stock: 55,
      reorderLevel: 12,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Tata Sampann Chana Dal 500g',
      barcode: '8901139009100',
      sku: 'STAPLE-002',
      category: 'Staples',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 65,
      mrp: 70,
      taxRate: 5,
      hsnCode: '0713',
      stock: 80,
      reorderLevel: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Rajdhani Moong Dal 500g',
      barcode: '8906012413018',
      sku: 'STAPLE-003',
      category: 'Staples',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 75,
      mrp: 80,
      taxRate: 5,
      hsnCode: '0713',
      stock: 70,
      reorderLevel: 18,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Sugar 1kg',
      barcode: '8901725100009',
      sku: 'STAPLE-004',
      category: 'Staples',
      unit: 'kg',
      soldByWeight: false,
      sellingPrice: 45,
      mrp: 47,
      taxRate: 0,
      hsnCode: '1701',
      stock: 150,
      reorderLevel: 30,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Poha 500g',
      barcode: '8908002710018',
      sku: 'STAPLE-005',
      category: 'Staples',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 32,
      mrp: 35,
      taxRate: 0,
      hsnCode: '1104',
      stock: 90,
      reorderLevel: 20,
      createdAt: now,
      updatedAt: now,
    },
    // ── Spices ─────────────────────────────────────────────────────────────
    {
      name: 'MDH Garam Masala 100g',
      barcode: '8904016200018',
      sku: 'SPICE-001',
      category: 'Spices',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 75,
      mrp: 80,
      taxRate: 5,
      hsnCode: '0910',
      stock: 50,
      reorderLevel: 12,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Everest Red Chilli Powder 200g',
      barcode: '8904014900010',
      sku: 'SPICE-002',
      category: 'Spices',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 65,
      mrp: 70,
      taxRate: 5,
      hsnCode: '0904',
      stock: 45,
      reorderLevel: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Haldi 200g',
      barcode: '8908002620010',
      sku: 'SPICE-003',
      category: 'Spices',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 55,
      mrp: 60,
      taxRate: 5,
      hsnCode: '0910',
      stock: 60,
      reorderLevel: 15,
      createdAt: now,
      updatedAt: now,
    },
    // ── Beverages ──────────────────────────────────────────────────────────
    {
      name: 'Tata Tea Premium 500g',
      barcode: '8901139011103',
      sku: 'BEV-001',
      category: 'Beverages',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 245,
      mrp: 260,
      taxRate: 5,
      hsnCode: '0902',
      stock: 35,
      reorderLevel: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Bru Coffee 50g',
      barcode: '8901030737100',
      sku: 'BEV-002',
      category: 'Beverages',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 85,
      mrp: 90,
      taxRate: 18,
      hsnCode: '2101',
      stock: 40,
      reorderLevel: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Kissan Mixed Fruit Jam 200g',
      barcode: '8901030800049',
      sku: 'BEV-003',
      category: 'Beverages',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 90,
      mrp: 95,
      taxRate: 12,
      hsnCode: '2007',
      stock: 25,
      reorderLevel: 8,
      createdAt: now,
      updatedAt: now,
    },
    // ── Snacks ─────────────────────────────────────────────────────────────
    {
      name: 'Haldirams Aloo Bhujia 200g',
      barcode: '8906049200017',
      sku: 'SNACK-001',
      category: 'Snacks',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 70,
      mrp: 75,
      taxRate: 12,
      hsnCode: '1905',
      stock: 55,
      reorderLevel: 15,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Lay's Classic 26g",
      barcode: '8901491503115',
      sku: 'SNACK-002',
      category: 'Snacks',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 20,
      mrp: 20,
      taxRate: 12,
      hsnCode: '2005',
      stock: 120,
      reorderLevel: 30,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Parle-G 200g',
      barcode: '8901719100018',
      sku: 'SNACK-003',
      category: 'Snacks',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 15,
      mrp: 15,
      taxRate: 18,
      hsnCode: '1905',
      stock: 200,
      reorderLevel: 50,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Maggi Noodles 70g',
      barcode: '8901058002044',
      sku: 'SNACK-004',
      category: 'Snacks',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 14,
      mrp: 15,
      taxRate: 18,
      hsnCode: '1902',
      stock: 180,
      reorderLevel: 40,
      createdAt: now,
      updatedAt: now,
    },
    // ── Personal Care ──────────────────────────────────────────────────────
    {
      name: 'Colgate Strong Teeth 200g',
      barcode: '8901314003084',
      sku: 'CARE-001',
      category: 'Personal Care',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 99,
      mrp: 105,
      taxRate: 18,
      hsnCode: '3306',
      stock: 45,
      reorderLevel: 12,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Lifebuoy Soap 100g',
      barcode: '8901030051019',
      sku: 'CARE-002',
      category: 'Personal Care',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 38,
      mrp: 40,
      taxRate: 18,
      hsnCode: '3401',
      stock: 80,
      reorderLevel: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Clinic Plus Shampoo 80ml',
      barcode: '8901030862019',
      sku: 'CARE-003',
      category: 'Personal Care',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 55,
      mrp: 58,
      taxRate: 18,
      hsnCode: '3305',
      stock: 35,
      reorderLevel: 10,
      createdAt: now,
      updatedAt: now,
    },
    // ── Household ──────────────────────────────────────────────────────────
    {
      name: 'Vim Bar 200g',
      barcode: '8901030051217',
      sku: 'HH-001',
      category: 'Household',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 25,
      mrp: 27,
      taxRate: 18,
      hsnCode: '3402',
      stock: 100,
      reorderLevel: 25,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Harpic 500ml',
      barcode: '8901030049054',
      sku: 'HH-002',
      category: 'Household',
      unit: 'pcs',
      soldByWeight: false,
      sellingPrice: 75,
      mrp: 80,
      taxRate: 18,
      hsnCode: '3808',
      stock: 30,
      reorderLevel: 8,
      createdAt: now,
      updatedAt: now,
    },
  ])

  // ── Batches for all 22 new products ────────────────────────────────────────
  const newSkuBatches: Array<{
    sku: string
    batchNo: string
    expiryDays: number
    purchasePricePct: number  // as fraction of sellingPrice
  }> = [
    // Dairy — 30 days
    { sku: 'DAIRY-003', batchNo: 'DAIRY-003-2601', expiryDays: 30,  purchasePricePct: 0.80 },
    { sku: 'DAIRY-004', batchNo: 'DAIRY-004-2601', expiryDays: 30,  purchasePricePct: 0.80 },
    { sku: 'DAIRY-005', batchNo: 'DAIRY-005-2601', expiryDays: 30,  purchasePricePct: 0.78 },
    // Staples — 180 days
    { sku: 'STAPLE-001', batchNo: 'STAPLE-001-2601', expiryDays: 180, purchasePricePct: 0.82 },
    { sku: 'STAPLE-002', batchNo: 'STAPLE-002-2601', expiryDays: 180, purchasePricePct: 0.80 },
    { sku: 'STAPLE-003', batchNo: 'STAPLE-003-2601', expiryDays: 180, purchasePricePct: 0.80 },
    { sku: 'STAPLE-004', batchNo: 'STAPLE-004-2601', expiryDays: 180, purchasePricePct: 0.82 },
    { sku: 'STAPLE-005', batchNo: 'STAPLE-005-2601', expiryDays: 180, purchasePricePct: 0.78 },
    // Spices — 365 days
    { sku: 'SPICE-001', batchNo: 'SPICE-001-2601', expiryDays: 365, purchasePricePct: 0.78 },
    { sku: 'SPICE-002', batchNo: 'SPICE-002-2601', expiryDays: 365, purchasePricePct: 0.78 },
    { sku: 'SPICE-003', batchNo: 'SPICE-003-2601', expiryDays: 365, purchasePricePct: 0.78 },
    // Beverages — 180 days
    { sku: 'BEV-001', batchNo: 'BEV-001-2601', expiryDays: 180, purchasePricePct: 0.80 },
    { sku: 'BEV-002', batchNo: 'BEV-002-2601', expiryDays: 180, purchasePricePct: 0.82 },
    { sku: 'BEV-003', batchNo: 'BEV-003-2601', expiryDays: 180, purchasePricePct: 0.80 },
    // Snacks — 90 days
    { sku: 'SNACK-001', batchNo: 'SNACK-001-2601', expiryDays: 90, purchasePricePct: 0.80 },
    { sku: 'SNACK-002', batchNo: 'SNACK-002-2601', expiryDays: 90, purchasePricePct: 0.75 },
    { sku: 'SNACK-003', batchNo: 'SNACK-003-2601', expiryDays: 90, purchasePricePct: 0.75 },
    { sku: 'SNACK-004', batchNo: 'SNACK-004-2601', expiryDays: 90, purchasePricePct: 0.78 },
    // Personal Care — 365 days
    { sku: 'CARE-001', batchNo: 'CARE-001-2601', expiryDays: 365, purchasePricePct: 0.82 },
    { sku: 'CARE-002', batchNo: 'CARE-002-2601', expiryDays: 365, purchasePricePct: 0.80 },
    { sku: 'CARE-003', batchNo: 'CARE-003-2601', expiryDays: 365, purchasePricePct: 0.80 },
    // Household — 365 days
    { sku: 'HH-001', batchNo: 'HH-001-2601', expiryDays: 365, purchasePricePct: 0.80 },
    { sku: 'HH-002', batchNo: 'HH-002-2601', expiryDays: 365, purchasePricePct: 0.80 },
  ]

  for (const entry of newSkuBatches) {
    const prod = await db.products.where('sku').equals(entry.sku).first()
    if (!prod?.id) continue
    const purchasePrice = Math.round(prod.sellingPrice * entry.purchasePricePct)
    await db.batches.add({
      productId: prod.id,
      batchNo: entry.batchNo,
      expiryDate: new Date(now.getTime() + entry.expiryDays * 24 * 60 * 60 * 1000),
      purchasePrice,
      qtyRemaining: prod.stock,
      createdAt: now,
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// seedMoreCustomers — adds 8 realistic UP-region customers (total: 10)
// ─────────────────────────────────────────────────────────────────────────────
async function seedMoreCustomers(): Promise<void> {
  if (await db.customers.count() >= 8) return

  const now = new Date()

  await db.customers.bulkAdd([
    {
      name: 'Mohammad Arif',
      phone: '9988776655',
      creditLimit: 3000,
      currentBalance: 1200,
      loyaltyPoints: 80,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Priya Sharma',
      phone: '8877665544',
      creditLimit: 1500,
      currentBalance: 0,
      loyaltyPoints: 35,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Raju Yadav',
      phone: '7766554433',
      creditLimit: 2500,
      currentBalance: 650,
      loyaltyPoints: 55,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Meena Gupta',
      phone: '6655443322',
      creditLimit: 1000,
      currentBalance: 0,
      loyaltyPoints: 20,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Vijay Singh',
      phone: '9911223344',
      creditLimit: 5000,
      currentBalance: 2800,
      loyaltyPoints: 210,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Fatima Begum',
      phone: '8822334455',
      creditLimit: 1500,
      currentBalance: 300,
      loyaltyPoints: 40,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Santosh Tiwari',
      phone: '7733445566',
      creditLimit: 2000,
      currentBalance: 0,
      loyaltyPoints: 90,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Kavita Verma',
      phone: '9944556677',
      creditLimit: 1000,
      currentBalance: 450,
      loyaltyPoints: 15,
      creditApproved: true,
      creditRequested: false,
      createdAt: now,
      updatedAt: now,
    },
  ])
}

// ─────────────────────────────────────────────────────────────────────────────
// seedSalesHistory — 30 days of realistic sales, 15-35 bills/day
// ─────────────────────────────────────────────────────────────────────────────
async function seedSalesHistory(): Promise<void> {
  if (await db.sales.count() > 0) return

  // Collect IDs to pick from
  const allProducts = await db.products.toArray()
  if (allProducts.length === 0) return

  const allEmployees = await db.employees.toArray()
  const adminEmp = allEmployees.find(e => e.role === 'admin')
  const managerEmp = allEmployees.find(e => e.role === 'manager')
  const cashierEmp = allEmployees.find(e => e.role === 'cashier')

  const cashierIds: number[] = []
  if (cashierEmp?.id) cashierIds.push(...Array(7).fill(cashierEmp.id))
  if (managerEmp?.id) cashierIds.push(...Array(2).fill(managerEmp.id))
  if (adminEmp?.id)   cashierIds.push(adminEmp.id)
  // fallback: at least one employee
  if (cashierIds.length === 0 && allEmployees[0]?.id) {
    cashierIds.push(allEmployees[0].id)
  }

  const allCustomers = await db.customers.toArray()
  const customerIds = allCustomers.filter(c => c.id !== undefined).map(c => c.id as number)

  // Peak-hour buckets: 9-11 AM → hours 9,10; 5-8 PM → hours 17,18,19,20
  const peakHours = [9, 10, 17, 18, 19, 20]
  const offHours  = [8, 11, 12, 13, 14, 15, 16, 21]

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  // Simple seeded-style deterministic "random" to keep numbers consistent
  // (we still use Math.random — the guard ensures this runs only once)
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const randFloat = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10

  const TODAY = new Date()
  TODAY.setHours(0, 0, 0, 0)

  // Track total qty sold per product across all days (Fix 2)
  const totalSoldMap = new Map<number, number>()

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const day = new Date(TODAY.getTime() - dayOffset * 24 * 60 * 60 * 1000)
    const dayOfWeek = day.getDay() // 0=Sun, 6=Sat

    // More bills on weekends / market days (Tue/Sat)
    const isHighDay = dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 6
    const billCount = isHighDay ? randInt(25, 35) : randInt(15, 24)

    // Build hour pool for the day: 60% peak, 40% off
    const hourPool: number[] = []
    for (let i = 0; i < Math.ceil(billCount * 0.6); i++) hourPool.push(pick(peakHours))
    for (let i = 0; i < Math.ceil(billCount * 0.4); i++) hourPool.push(pick(offHours))
    // shuffle
    hourPool.sort(() => Math.random() - 0.5)

    // day_session: opened at 8:30 AM, closed at 10 PM
    const openedAt  = new Date(day); openedAt.setHours(8, 30, 0, 0)
    const closedAt  = new Date(day); closedAt.setHours(22, 0, 0, 0)
    const openedBy  = cashierEmp?.id ?? managerEmp?.id ?? allEmployees[0]?.id ?? 1

    await db.transaction('rw', [
      db.day_sessions, db.sales, db.sale_items, db.payments, db.credit_ledger,
    ], async () => {
      await db.day_sessions.add({
        openedBy,
        openingFloat: 1000,
        closedBy: openedBy,
        closingCash: 1000 + randInt(800, 3500),
        status: 'closed',
        openedAt,
        closedAt,
      })

      for (let billIdx = 0; billIdx < billCount; billIdx++) {
        const billHour = hourPool[billIdx] ?? randInt(9, 20)
        const billTime = new Date(day)
        billTime.setHours(billHour, randInt(0, 59), randInt(0, 59), 0)

        // Bill number: ZO-YYYYMMDD-NNN
        const yyyy = day.getFullYear()
        const mm   = String(day.getMonth() + 1).padStart(2, '0')
        const dd   = String(day.getDate()).padStart(2, '0')
        const billNo = `ZO-${yyyy}${mm}${dd}-${String(billIdx + 1).padStart(3, '0')}`

        // Payment method: 55% cash, 35% UPI, 10% credit
        const methodRoll = Math.random()
        const method: 'cash' | 'upi' | 'credit' =
          methodRoll < 0.55 ? 'cash' : methodRoll < 0.90 ? 'upi' : 'credit'

        // Customer: 30% attach, but credit always needs a customer
        let customerId: number | undefined
        if (method === 'credit' && customerIds.length > 0) {
          customerId = pick(customerIds)
        } else if (Math.random() < 0.30 && customerIds.length > 0) {
          customerId = pick(customerIds)
        }

        const cashierId = pick(cashierIds)

        // 1-4 items per bill
        const itemCount = randInt(1, 4)
        const chosenProducts = [...allProducts].sort(() => Math.random() - 0.5).slice(0, itemCount)

        let subtotal = 0
        let taxTotal = 0
        const saleItemsData: Array<{
          productId: number
          qty: number
          unitPrice: number
          discount: number
          taxRate: number
          lineTotal: number
        }> = []

        for (const prod of chosenProducts) {
          const qty = prod.soldByWeight
            ? randFloat(0.5, 2)
            : randInt(1, 3)
          const unitPrice = prod.sellingPrice
          const lineTotal = Math.round(unitPrice * qty * 100) / 100
          const taxRate   = prod.taxRate
          // tax-inclusive: taxAmount = lineTotal - lineTotal/(1 + taxRate/100)
          const taxAmount = taxRate > 0
            ? Math.round((lineTotal - lineTotal / (1 + taxRate / 100)) * 100) / 100
            : 0

          subtotal += lineTotal
          taxTotal  += taxAmount

          saleItemsData.push({
            productId: prod.id!,
            qty,
            unitPrice,
            discount: 0,
            taxRate,
            lineTotal,
          })

          // Accumulate total sold for stock reduction after all days (Fix 2)
          const pid = prod.id!
          totalSoldMap.set(pid, (totalSoldMap.get(pid) ?? 0) + qty)
        }

        subtotal  = Math.round(subtotal  * 100) / 100
        taxTotal  = Math.round(taxTotal  * 100) / 100
        const grandTotal = subtotal  // tax-inclusive: grandTotal = subtotal

        const saleId = await db.sales.add({
          billNo,
          customerId,
          cashierId,
          subtotal,
          discount: 0,
          taxTotal,
          grandTotal,
          status: 'completed',
          createdAt: billTime,
        })

        await db.sale_items.bulkAdd(
          saleItemsData.map(si => ({ ...si, saleId }))
        )

        await db.payments.add({
          saleId,
          method,
          amount: grandTotal,
          createdAt: billTime,
        })

        // Credit ledger entry when paid on credit
        if (method === 'credit' && customerId !== undefined) {
          await db.credit_ledger.add({
            customerId,
            saleId,
            entryType: 'debit',
            amount: grandTotal,
            notes: `Credit sale — bill ${billNo}`,
            createdAt: billTime,
          })
        }
      }
    })
  }

  // Fix 2: Reduce product stock and batch qtyRemaining based on sales
  for (const [productId, totalSold] of totalSoldMap) {
    await db.products.where('id').equals(productId).modify((p) => {
      p.stock = Math.max(0, p.stock - totalSold)
      p.updatedAt = new Date()
    })

    // FEFO-style batch deduction: deplete earliest-expiry batch first
    const batches = await db.batches.where('productId').equals(productId).sortBy('expiryDate')
    let remaining = totalSold
    for (const batch of batches) {
      if (remaining <= 0) break
      const deduct = Math.min(batch.qtyRemaining, remaining)
      await db.batches.where('id').equals(batch.id!).modify((b) => {
        b.qtyRemaining = Math.max(0, b.qtyRemaining - deduct)
      })
      remaining -= deduct
    }
  }

  // Fix 3: Recompute each customer's credit balance from ledger entries
  const allCustomersForBalance = await db.customers.toArray()
  for (const customer of allCustomersForBalance) {
    if (!customer.id) continue
    const ledgerEntries = await db.credit_ledger.where('customerId').equals(customer.id).toArray()
    const balance = ledgerEntries.reduce((sum, entry) => {
      return entry.entryType === 'debit' ? sum + entry.amount : sum - entry.amount
    }, 0)
    if (balance > 0) {
      await db.customers.where('id').equals(customer.id).modify((c) => {
        c.currentBalance = Math.round(balance * 100) / 100
        c.updatedAt = new Date()
      })
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// seedExpenses — ~25 realistic store expense entries over past 30 days
// ─────────────────────────────────────────────────────────────────────────────
async function seedExpenses(): Promise<void> {
  if (await db.expenses.count() > 0) return

  const now = new Date()
  const daysAgo = (n: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - n)
    d.setHours(11, 0, 0, 0)
    return d
  }

  await db.expenses.bulkAdd([
    // ── Electricity ──────────────────────────────────────────────────────
    {
      category: 'Electricity',
      amount: 4200,
      note: 'UPPCL electricity bill — March',
      date: daysAgo(15),
      createdAt: daysAgo(15),
    },
    // ── Rent ────────────────────────────────────────────────────────────
    {
      category: 'Rent',
      amount: 8000,
      note: 'Monthly shop rent — March',
      date: daysAgo(28),
      createdAt: daysAgo(28),
    },
    // ── Maintenance ─────────────────────────────────────────────────────
    {
      category: 'Maintenance',
      amount: 1500,
      note: 'AC gas refill and service',
      date: daysAgo(20),
      createdAt: daysAgo(20),
    },
    // ── Staff refreshments (8 entries) ──────────────────────────────────
    {
      category: 'Other',
      amount: 180,
      note: 'Staff tea and snacks',
      date: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      category: 'Other',
      amount: 220,
      note: 'Staff refreshments',
      date: daysAgo(5),
      createdAt: daysAgo(5),
    },
    {
      category: 'Other',
      amount: 150,
      note: 'Staff tea',
      date: daysAgo(8),
      createdAt: daysAgo(8),
    },
    {
      category: 'Other',
      amount: 300,
      note: 'Staff lunch — full day shift',
      date: daysAgo(11),
      createdAt: daysAgo(11),
    },
    {
      category: 'Other',
      amount: 175,
      note: 'Staff refreshments',
      date: daysAgo(14),
      createdAt: daysAgo(14),
    },
    {
      category: 'Other',
      amount: 200,
      note: 'Staff tea and snacks',
      date: daysAgo(18),
      createdAt: daysAgo(18),
    },
    {
      category: 'Other',
      amount: 160,
      note: 'Staff tea',
      date: daysAgo(22),
      createdAt: daysAgo(22),
    },
    {
      category: 'Other',
      amount: 250,
      note: 'Staff refreshments and biscuits',
      date: daysAgo(26),
      createdAt: daysAgo(26),
    },
    // ── Purchase — small cash purchases (5 entries) ──────────────────────
    {
      category: 'Purchase',
      amount: 1800,
      note: 'Cash purchase — Agro Fresh vegetables',
      date: daysAgo(3),
      createdAt: daysAgo(3),
    },
    {
      category: 'Purchase',
      amount: 950,
      note: 'Cash purchase — loose grains from local supplier',
      date: daysAgo(9),
      createdAt: daysAgo(9),
    },
    {
      category: 'Purchase',
      amount: 500,
      note: 'Cash purchase — seasonal vegetables',
      date: daysAgo(16),
      createdAt: daysAgo(16),
    },
    {
      category: 'Purchase',
      amount: 1200,
      note: 'Cash purchase — eggs (2 trays)',
      date: daysAgo(21),
      createdAt: daysAgo(21),
    },
    {
      category: 'Purchase',
      amount: 700,
      note: 'Cash purchase — loose onions',
      date: daysAgo(27),
      createdAt: daysAgo(27),
    },
    // ── Other — bags, stationery, misc (5 entries) ───────────────────────
    {
      category: 'Other',
      amount: 350,
      note: 'Carry bags — 2 bundles',
      date: daysAgo(4),
      createdAt: daysAgo(4),
    },
    {
      category: 'Other',
      amount: 120,
      note: 'Bill book and pen refills',
      date: daysAgo(7),
      createdAt: daysAgo(7),
    },
    {
      category: 'Other',
      amount: 480,
      note: 'Printer paper rolls (5 rolls)',
      date: daysAgo(12),
      createdAt: daysAgo(12),
    },
    {
      category: 'Other',
      amount: 200,
      note: 'Cleaning supplies — phenyl and mop',
      date: daysAgo(19),
      createdAt: daysAgo(19),
    },
    {
      category: 'Other',
      amount: 150,
      note: 'Rubber bands and stationery',
      date: daysAgo(25),
      createdAt: daysAgo(25),
    },
  ])
}
