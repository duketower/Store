# Grocery Store POS System — Complete Blueprint

> **Purpose:** Reference document for building a web-based Grocery Store Management & POS Application targeting kirana stores, mini supermarkets, convenience stores, and local grocery retailers in India.
>
> **Tech Stack:** To be decided. Recommended: React (Vite + TypeScript) + FastAPI (Python) + PostgreSQL. Offline-first via IndexedDB + Service Worker.

---

## Table of Contents

1. [Daily Operational Workflow](#1-daily-operational-workflow)
2. [Core Modules](#2-core-modules)
3. [POS Billing Flow](#3-pos-billing-flow)
4. [Inventory Management Logic](#4-inventory-management-logic)
5. [Payment Handling](#5-payment-handling)
6. [Reporting System](#6-reporting-system)
7. [Hardware Integration](#7-hardware-integration)
8. [Competitor Analysis](#8-competitor-analysis)
9. [Modern Features](#9-modern-features)
10. [System Architecture](#10-system-architecture)
11. [Database Design](#11-database-design)
12. [Development Roadmap](#12-development-roadmap)

---

## 1. Daily Operational Workflow

### Morning Opening
1. **Cash drawer setup** — cashier counts opening float, records in system
2. **System login** — role-based access (owner, cashier, stockist)
3. **Inventory check** — review low-stock alerts from previous day
4. **Vendor delivery check** — expected deliveries for the day

### Vendor Purchasing & Purchase Orders
1. Owner/manager identifies reorder needs (via reorder alerts or manual review)
2. **Purchase Order (PO) created** in system: vendor, items, quantities, expected price
3. PO sent to vendor (WhatsApp/phone/email)
4. Vendor confirms and schedules delivery

### Goods Receipt Note (GRN)
1. Vendor arrives with delivery + invoice
2. Stockist scans/counts every item against PO
3. **GRN created**: records actual quantities received vs. ordered
4. Discrepancies flagged (short deliveries, damage)
5. Invoice verified against GRN — price differences noted
6. GRN approved → inventory automatically updated
7. Vendor payment scheduled (immediate or credit terms)

### Barcode Generation
1. National brand products: EAN/UPC barcode already exists → scan to import
2. Local/loose items (e.g. house brand pulses): generate internal barcode/label
3. Barcode labels printed and attached to shelf + product
4. Product added to system with price, tax rate, category

### Shelf Stocking
1. Received stock moved from back-room to shop floor
2. Items placed with FIFO (First In, First Out) — older stock in front
3. Expiry dates verified during stocking
4. Shelf labels updated if price changed

### POS Checkout
- Scan items → calculate total → accept payment → print receipt → update inventory
- *(See full flow in Section 3)*

### Credit Sales (Udhaar)
1. Customer identified by name/phone
2. Bill created normally but marked as "Credit"
3. Amount added to customer's ledger
4. Customer receives WhatsApp/SMS of outstanding balance
5. Collection tracked and recorded when customer pays

### Inventory Restocking Triggers
- **Automatic**: system alerts when stock < reorder level
- **Manual**: stockist physical count triggers restock request
- **Damage/Wastage**: expired or damaged goods written off, inventory adjusted

### Daily Closing
1. Cashier closes POS session
2. **Cash count**: physical cash vs. system expected cash — variance noted
3. **Z-report** generated: total sales by category, payment method breakdown
4. **Day-end reconciliation**: cash, UPI, card settlements verified
5. End-of-day summary sent to owner (WhatsApp/email)
6. System closes business day; opens new date for tomorrow

### Payment Reconciliation
| Method | How to Reconcile |
|--------|-----------------|
| Cash | Physical count vs. system total |
| UPI | Bank app/dashboard vs. system UPI total |
| Card | POS machine settlement report vs. system card total |

Any variance → investigated and noted before closing.

---

## 2. Core Modules

### Module 1: POS Billing
**Features:** Barcode scan, manual product search, quantity input, discount per item/bill, GST calculation, multiple payment methods, invoice generation, receipt print/WhatsApp/SMS, daily shift reports

**Edge cases:**
- Partial barcode scan failure → fallback to manual search
- Price override requires manager PIN above configurable threshold
- Negative stock situations (allow or block — configurable)
- Zero-price items (samples, replacements)

---

### Module 2: Product & SKU Management
**Features:** Product CRUD, category hierarchy, unit of measure (kg, pcs, litre, pack), multiple barcodes per product (brand + internal), tax rate assignment, MRP vs. selling price, product images

**Edge cases:**
- Same product from multiple vendors at different costs → maintain cost history
- Combo packs (6-pack of water = 6 × individual SKU)
- Loose items sold by weight → weight-based pricing

---

### Module 3: Inventory & Stock Control
**Features:** Real-time stock levels, batch tracking, expiry date management, damage/wastage entry, reorder level alerts, physical stock count (stocktake), variance reports, opening stock import

**Edge cases:**
- Items with multiple active batches at different purchase prices
- Near-expiry alerts (configurable threshold, e.g. 30 days)
- Stock adjustment with mandatory reason codes (Damaged/Expired/Stolen/Miscounted)

---

### Module 4: Purchase & Vendor Management
**Features:** Vendor profiles, Purchase Orders, GRN entry, vendor invoice matching, purchase returns, vendor payment tracking, vendor ledger, purchase reports by vendor/category

**Edge cases:**
- Partial deliveries → GRN records actual vs. ordered
- Price variations from PO → flag for approval
- Debit notes for returns

---

### Module 5: Customer Credit (Udhaar)
**Features:** Customer profiles with contact info, credit limit, running balance, credit sale entry, payment collection, credit ledger, WhatsApp reminder integration, credit ageing report

**Edge cases:**
- Multiple customers with same name → disambiguate by phone
- Bad debt write-off with reason
- Credit limit breach → allow/block (configurable per customer)

---

### Module 6: Payment Processing
**Features:** Cash, UPI (QR code display), card (manual confirmation), wallet, split payments, payment collection for credit customers, void/refund

**Edge cases:**
- Partial payments → remainder goes to credit or held open
- Payment reversal within same day
- UPI failure retry (scan again / re-confirm)

---

### Module 7: Reporting & Analytics
**Features:** Daily sales, product/category/hourly breakdown, top 10 / dead stock, inventory status, purchase reports, profit margin, customer credit ageing, payment settlement, monthly P&L

**Edge cases:**
- Reports spanning month boundaries
- Impact of voided/deleted transactions on report totals

---

### Module 8: Employee & User Management
**Features:** Employee profiles, role-based access (Owner / Manager / Cashier / Stockist), PIN-based POS login, shift management, cashier-wise sales report, full audit trail

**Edge cases:**
- Employee termination mid-shift → handover procedure
- Shared terminal usage → enforce PIN per transaction

---

### Module 9: Discounts & Offers
**Features:** Product-level discount, bill-level discount, % or flat, time-limited offers, combo pricing, minimum purchase discounts, loyalty point redemption

**Edge cases:**
- Stacking multiple discount types → define priority/rules
- Offer expiry at midnight → handle in-progress transactions

---

### Module 10: GST & Tax
**Features:** GST rate per product (0/5/12/18/28%), GSTIN recording, GST-compliant invoice (CGST + SGST), GSTR-1 export, HSN code per product, tax-exempt items

**Edge cases:**
- GST rate changes mid-billing period → use rate at time of sale
- Composition scheme retailers (flat % instead of slab)

---

## 3. POS Billing Flow

### Standard Checkout

```
1. OPEN NEW BILL
   └─ Auto-assign bill number (e.g. INV-2026-00142)
   └─ Record timestamp + cashier ID

2. ADD ITEMS
   ├─ Barcode scan → instant product lookup
   ├─ Manual search by name or product code
   └─ Weight-based items → enter weight → auto-calculate price

3. PER ITEM
   ├─ Display: Name | MRP | Selling Price | Qty | Line Total
   ├─ Tap/click to change quantity
   └─ Item discount (requires manager PIN if above threshold)

4. BILL LEVEL
   ├─ Apply bill discount (% or flat)
   ├─ Add misc charge (packaging, delivery fee)
   └─ Attach customer (for credit or loyalty points)

5. CALCULATE TOTALS
   ├─ Subtotal
   ├─ Total discount
   ├─ GST breakdown: CGST + SGST per slab
   └─ Grand Total (rounded to nearest ₹1)

6. PAYMENT
   ├─ CASH    → enter amount tendered → show change due
   ├─ UPI     → display QR → cashier confirms receipt
   ├─ CARD    → enter reference/approval number (manual Phase 1)
   ├─ SPLIT   → enter amount per method until total covered
   └─ CREDIT  → attach to customer ledger (requires customer selection)

7. COMPLETE SALE
   ├─ Deduct stock for each item (real-time, FIFO batch)
   ├─ Record payment in settlement register
   ├─ Generate GST-compliant invoice (PDF or thermal)
   └─ Print receipt OR WhatsApp to customer

8. READY FOR NEXT BILL
```

### Returns & Refunds

```
1. Retrieve original bill (by bill number or customer name)
2. Select items to return (partial or full)
3. Record reason: Damaged / Wrong Item / Customer Preference / Other
4. Decide stock disposition: Return to shelf OR Write off
5. Issue refund:
   ├─ Cash      → from drawer (record cash-out)
   ├─ Credit    → add to customer's credit account
   └─ UPI/Card  → note for manual reversal; record in system
6. Generate return invoice linked to original bill number
```

### Exchanges

```
1. Process return (as above, no refund issued)
2. Open new bill for replacement items
3. Apply return credit against new bill
4. Collect/refund net difference
```

### Split Payments

```
Example: ₹850 bill
  ├─ Cash: ₹500 entered
  ├─ UPI: ₹350 confirmed
  └─ Total collected = ₹850 ✓ → complete sale
```

---

## 4. Inventory Management Logic

### Stock Ledger (per Product)

```
Opening Stock (initial entry or stocktake)
+ GRN receipts (each batch adds qty at purchase price)
- Sales deductions (FIFO — oldest batch depleted first)
- Damage / wastage write-offs
± Stock adjustments (physical count corrections)
= Current Stock
```

### Batch Tracking

Each GRN line creates a batch record:

| Field | Example |
|-------|---------|
| batch_id | B-2026-0045 |
| product_id | PRD-112 |
| grn_date | 2026-03-01 |
| expiry_date | 2026-09-01 |
| purchase_price | ₹42.00 |
| qty_remaining | 24 |

- Sales deplete the **oldest batch first (FIFO)**
- Enables exact **COGS calculation per batch** for profit reports
- Supports **lot traceability** if product recall needed

### Expiry Tracking

- Alert threshold configurable per category (e.g. Dairy = 3 days, Packaged = 30 days)
- Near-expiry dashboard widget shows items approaching threshold
- Expired stock must be written off via damage entry → reduces inventory + records shrinkage value

### Reorder Logic

```
After every sale:
  IF current_stock(product) <= reorder_level(product):
    → Create alert: "Reorder: Amul Butter 500g — 4 units left (reorder level: 10)"
    → Optional: auto-draft Purchase Order with configured vendor + reorder_qty
```

### Stock Adjustment (Shrinkage/Damage)

1. Select product + batch (optional)
2. Enter qty change (negative for loss, positive for found/correction)
3. Select reason: Damaged / Expired / Stolen / Physical Count Correction / Supplier Error
4. Optionally attach photo/note
5. Approver sign-off (Owner/Manager role)
6. Impact reflected in inventory immediately; logged in shrinkage report

---

## 5. Payment Handling

### Payment Method Details

| Method | How It Works | Settlement Timing | Notes |
|--------|-------------|-------------------|-------|
| **Cash** | Manual entry; cash drawer opens | Same day (physical count) | Track opening float + closing count |
| **UPI** | Static QR displayed on screen | D+1 in bank account | Confirm via PhonePe/GPay sound/notification |
| **Card** | Manual approval code entry (Phase 1) | D+1 or D+2 | Card machine settlement PDF for reconciliation |
| **Wallet** | Manual confirmation | Varies by provider | |
| **Credit** | Customer ledger debit | When customer pays | Enforce credit limit |

### Split Payment Rules

- Any combination of methods allowed
- Total of all splits must equal Grand Total before completing sale
- Each split recorded separately in `payments` table
- Refunds process per original payment method split

### End-of-Day Settlement Process

```
1. Cashier presses "Close Shift"
2. System shows:
   ├─ Expected Cash: ₹12,450  (sum of cash sales)
   ├─ Expected UPI:  ₹8,200
   └─ Expected Card: ₹3,100

3. Cashier counts physical cash → enters actual: ₹12,380
   └─ Variance: -₹70 (SHORT) → noted with explanation

4. UPI: Owner checks bank app → confirms ₹8,200 received ✓

5. Card: Terminal settlement report shows ₹3,100 ✓

6. Z-REPORT generated:
   ├─ Total Bills: 87
   ├─ Total Sales: ₹23,750
   ├─ Discounts Given: ₹1,200
   ├─ Net Sales: ₹22,550
   ├─ GST Collected: ₹1,827
   ├─ Payment breakdown: Cash / UPI / Card / Credit
   └─ Cash variance: -₹70

7. Day closed. New business day opens.
```

### GST Compliance

- Every invoice must show CGST + SGST (or IGST for inter-state)
- GSTIN of store printed on invoice
- HSN/SAC code per line item for invoices above ₹50,000 (B2B)
- Monthly GSTR-1 export (JSON format for GST portal upload)

---

## 6. Reporting System

### Reports Catalog

| Report | Key Metrics | Used By | Frequency |
|--------|-------------|---------|-----------|
| **Daily Sales Summary** | Total sales, bill count, avg bill value, returns | Owner/Manager | Daily |
| **Sales by Category** | Revenue contribution per category | Owner | Daily/Weekly |
| **Hourly Sales Pattern** | Transactions and revenue by hour | Manager | Weekly |
| **Payment Method Report** | Cash/UPI/Card/Credit split; variances | Owner | Daily |
| **Top 10 Products** | Best sellers by qty + by revenue | Owner/Buyer | Weekly |
| **Dead Stock Report** | Zero sales in last 30/60/90 days; value locked | Owner | Monthly |
| **Inventory Status** | Current levels, low stock, near-expiry | Manager/Stockist | Daily |
| **Stock Movement Report** | Purchases, sales, adjustments per product | Manager | Weekly |
| **Purchase Report** | GRNs by vendor; price trend per item | Owner | Monthly |
| **Profit Margin Report** | Selling price vs. purchase cost; margin % | Owner | Weekly/Monthly |
| **Customer Credit Report** | Balances, ageing buckets (0-30, 31-60, 60+ days) | Owner | Weekly |
| **Monthly P&L Summary** | Revenue - COGS - wastage = gross profit | Owner | Monthly |
| **GST Report** | GSTR-1 format; tax collected by slab | Accountant | Monthly |
| **Cashier Performance** | Sales per cashier; voids; discounts given | Manager | Daily |
| **Shrinkage/Wastage Report** | Damage write-offs by reason + product | Owner | Monthly |

### How Store Owners Use Reports

- **Morning**: check dead stock + low stock alerts → plan restocking
- **Evening**: review daily sales + payment settlement → spot discrepancies
- **Weekly**: top sellers → inform purchase orders; credit report → follow up udhaar
- **Monthly**: P&L + GST report → share with accountant; margins → adjust pricing

---

## 7. Hardware Integration

### Barcode Scanner
- **Type**: USB HID (Human Interface Device) — the OS sees it as a keyboard
- **Browser Integration**: Web app captures rapid keystrokes (< 50ms between chars) ending in `Enter` as a barcode scan — no special driver needed
- **Fallback**: Manual product name/code search if scan fails
- **Supported codes**: EAN-13, EAN-8, UPC-A, Code128, QR code

### Receipt Printer
- **Type**: Thermal printer (80mm roll) — no ink required
- **Phase 1**: Browser `window.print()` with CSS `@media print` receipt layout
- **Phase 2**: Web USB API (Chrome/Edge) for direct ESC/POS command printing — enables logo, QR receipt, auto-cut
- **Connection**: USB (primary), Ethernet/LAN (networked stores), Bluetooth (mobile)

### Cash Drawer
- **Connection**: RJ11 cable to receipt printer (piggybacks on print signal)
- **Trigger**: ESC/POS drawer-kick command sent at end of every cash transaction
- **Phase 1**: Manual open button in UI; auto-open when receipt printed in Phase 2

### Weighing Scale
- **Use case**: Produce, vegetables, fruits, loose grains — price by weight
- **Phase 1**: Cashier reads scale, manually enters weight in POS
- **Phase 2**: USB/serial scale → local bridge agent (small Python/Electron app) → WebSocket to POS → weight auto-populates
- **Integration**: Item flagged as `sold_by_weight = true` → POS prompts for weight input

### POS Terminal
- Any modern tablet/laptop with Chrome/Edge browser
- Recommended: 15" touchscreen all-in-one POS terminal or iPad with keyboard
- Offline-capable: full POS works without internet

---

## 8. Competitor Analysis

### Global POS Systems

| System | Pricing | Strengths | Weaknesses | Best For |
|--------|---------|-----------|------------|---------|
| **Square POS** | Free + ~2.6% per transaction | Simple UI, free to start, good payments | No GST, poor inventory for large SKUs, no Indian payments | Tiny stores, cafes |
| **Lightspeed Retail** | $109–339/month | Best-in-class inventory (10/10), analytics, multi-store | Most expensive, steep learning curve | Large retail chains |
| **Shopify POS** | $5–89/month | Seamless online+offline, strong ecommerce | Needs Shopify store, not standalone POS | Omnichannel brands |
| **Loyverse POS** | Free (premium add-ons) | 1M+ users, excellent ease of use, mobile-first | No GST, no UPI/Indian payments, PC-only not supported | Small shops globally |
| **Vend POS** | ~$99/month | Good usability, competitive features | Less known in India, limited local support | Small retailers |
| **Clover POS** | Hardware bundle | Integrated smart devices, loyalty, NFC | Hardware lock-in, US-focused, support rated low | Restaurants, US retail |

### Indian Retail Software

| System | Pricing (approx.) | Strengths | Weaknesses | Best For |
|--------|------------------|-----------|------------|---------|
| **Marg ERP** | ₹8,000–25,000/yr | GST compliance, batch/expiry tracking, pharma expertise | Dated Windows UI, complex setup | Pharma, wholesale |
| **GoFrugal RetailEasy** | ₹15,000+/yr | Fast POS, good inventory, barcode, loyalty | Expensive, complex onboarding, not web-native | Supermarkets, clothing |
| **RetailGraph (Swil)** | ₹10,000+/yr | Comprehensive for grocery (batch, expiry, schemes), e-commerce links | Desktop-first, not a modern web app | Grocery chains |
| **Vyapar** | ₹3,500/yr | Budget-friendly, GST billing, WhatsApp invoices, mobile-first | Billing tool not true POS; no advanced inventory | Small shops, freelancers |
| **Ginesys ERP** | ₹50,000+/yr | Offline+online POS, real-time multi-store, 40% faster checkout, omnichannel | Enterprise pricing, overkill for small stores | Retail chains (50+ stores) |
| **Tally POS** | Tally license + setup | Strong accounting heritage, familiar to accountants | Not a real POS; requires Tally + integrations | Businesses already on Tally |

### Competitive Gaps — Where to Win

1. **No affordable GST-compliant grocery POS** — Vyapar is billing-only; everything else costs ₹10,000+/yr with complex setup
2. **Modern web UI** — every Indian option has a dated 2010-era Windows desktop interface
3. **WhatsApp-first** — receipts, credit reminders, restock alerts via WhatsApp (not SMS)
4. **Udhaar built-in as a core feature** — kirana stores live on credit, but most POS treats it as afterthought
5. **Works fully offline** — rural and semi-urban stores have unreliable internet; current web solutions fail
6. **Mobile-friendly for owners** — owner wants to check sales from phone at home, not only from the store PC
7. **10-minute onboarding** — kirana owners will not spend 2 weeks learning software; must be walk-up-and-use

---

## 9. Modern Features

### Phase 2 (Months 4–6)

**Loyalty Program**
- Points earned per ₹ spent (configurable rate)
- Points redeemable at checkout for discount
- Points balance shown on receipt
- Birthday/anniversary bonus points

**WhatsApp Integration (via WhatsApp Business API / Twilio)**
- Digital receipt sent to customer's WhatsApp on checkout
- Weekly credit reminder to customers with outstanding balance
- Low-stock alert to owner's WhatsApp when reorder threshold hit
- Daily sales summary to owner at store closing time

**Auto Reorder Suggestions**
- Analyze last 30/60/90 days sales velocity per product
- Suggest reorder quantity = (avg daily sales × lead time days) + safety stock
- One-click draft Purchase Order from suggestion

### Phase 3 (Months 7–12)

**AI Demand Prediction**
- ML model (ARIMA or Facebook Prophet) on historical sales data
- Seasonal adjustments (festival season, monsoon, etc.)
- Output: recommended stock levels per product per week
- Reduces overstock and stockouts

**Customer Analytics**
- Purchase history per customer
- Frequency, recency, monetary value (RFM segmentation)
- Top customers by lifetime value
- Category preferences → targeted offers

**Omnichannel / Online Ordering**
- WhatsApp catalogue sync → customers browse and order on WhatsApp
- Simple order management screen in POS
- Inventory deducted on order confirmation
- Delivery tracking optional

**Self-Checkout (Kiosk Mode)**
- Customer scans their own items using tablet/phone camera
- Generates bill and UPI QR
- Customer pays directly → cashier verifies and approves
- Reduces queue at checkout during peak hours

---

## 10. System Architecture

### Recommended Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React (Vite) + TypeScript | Rich POS UI, component ecosystem, PWA support |
| UI Library | shadcn/ui + Tailwind CSS | Modern, accessible components; dark mode ready |
| State | Zustand (cart) + React Query (server data) | Lightweight; React Query handles caching + sync |
| Offline | IndexedDB via Dexie.js + Service Worker | Native browser offline storage; no plugins |
| Backend | FastAPI (Python) | Consistent with bot codebase; async, fast, typed |
| Auth | JWT + role-based middleware | Stateless; works offline + online |
| Database | PostgreSQL (prod) + SQLite (local sync) | Relational; ACID transactions for billing |
| Realtime | WebSocket (FastAPI) | Live stock level updates across terminals |
| Hosting | Vercel (frontend) + Railway/Render (backend) | Free tier available; auto-deploy from GitHub |

### Offline-First Architecture

```
Browser
├── Service Worker
│   ├── Intercepts all API calls
│   ├── Serves cached responses when offline
│   └── Queues failed writes to Outbox
│
├── IndexedDB (via Dexie.js)
│   ├── products        (synced on startup + periodic refresh)
│   ├── customers       (synced on startup)
│   ├── pending_sales   (local sales awaiting sync)
│   └── outbox          (mutations to replay on reconnect)
│
└── Sync Engine (background service)
    ├── Detects network restoration
    ├── Flushes outbox to server in order
    ├── Resolves conflicts (server wins for product data; client wins for sales)
    └── Updates local cache with server state
```

**Offline guarantees:**
- Full POS checkout works with zero connectivity
- Products, prices, and customer data available from local cache
- Sales recorded locally with sequential bill numbers (device-prefixed to avoid conflicts)
- Stock levels updated locally; reconciled with server on sync
- Receipts printed from local data

### API Design (Key Endpoints)

```
POST   /api/sales              Create sale + deduct inventory
GET    /api/products           List products (filterable, paginated)
GET    /api/products/{id}      Product detail + stock level
POST   /api/grn                Create Goods Receipt Note
GET    /api/inventory          Stock levels + low-stock alerts
GET    /api/reports/daily      Daily sales summary
GET    /api/reports/z-report   End-of-day Z-report
POST   /api/sync               Batch sync endpoint for offline outbox
WS     /ws/inventory           Real-time stock update stream
```

---

## 11. Database Design

```sql
-- ─────────────────────────────────────────
-- PRODUCT CATALOG
-- ─────────────────────────────────────────

CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  parent_id  INT REFERENCES categories(id),  -- for subcategories
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(200) NOT NULL,
  barcode        VARCHAR(50)  UNIQUE,         -- EAN/UPC or internal
  sku            VARCHAR(50)  UNIQUE,
  category_id    INT REFERENCES categories(id),
  unit           VARCHAR(20)  NOT NULL,       -- pcs, kg, litre, pack
  sold_by_weight BOOLEAN DEFAULT FALSE,
  purchase_price DECIMAL(10,2),
  selling_price  DECIMAL(10,2) NOT NULL,
  mrp            DECIMAL(10,2),
  tax_rate       DECIMAL(5,2) DEFAULT 0,      -- GST %
  hsn_code       VARCHAR(20),
  reorder_level  INT DEFAULT 0,
  reorder_qty    INT DEFAULT 0,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INVENTORY
-- ─────────────────────────────────────────

CREATE TABLE inventory_batches (
  id             SERIAL PRIMARY KEY,
  product_id     INT REFERENCES products(id) NOT NULL,
  grn_id         INT,                         -- FK to grn table
  batch_no       VARCHAR(50),
  expiry_date    DATE,
  purchase_price DECIMAL(10,2) NOT NULL,
  qty_initial    INT NOT NULL,
  qty_remaining  INT NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock_adjustments (
  id          SERIAL PRIMARY KEY,
  product_id  INT REFERENCES products(id) NOT NULL,
  batch_id    INT REFERENCES inventory_batches(id),
  qty_change  INT NOT NULL,                   -- negative = loss
  reason      VARCHAR(50) NOT NULL,           -- damaged/expired/stolen/miscounted
  notes       TEXT,
  approved_by INT,                            -- employee_id
  created_by  INT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- VENDORS & PURCHASING
-- ─────────────────────────────────────────

CREATE TABLE vendors (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  phone       VARCHAR(20),
  gstin       VARCHAR(20),
  address     TEXT,
  credit_days INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE purchase_orders (
  id            SERIAL PRIMARY KEY,
  vendor_id     INT REFERENCES vendors(id),
  status        VARCHAR(20) DEFAULT 'draft', -- draft/sent/received/cancelled
  expected_date DATE,
  notes         TEXT,
  created_by    INT,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id          SERIAL PRIMARY KEY,
  po_id       INT REFERENCES purchase_orders(id) NOT NULL,
  product_id  INT REFERENCES products(id) NOT NULL,
  qty_ordered INT NOT NULL,
  unit_price  DECIMAL(10,2)
);

CREATE TABLE grn (
  id                SERIAL PRIMARY KEY,
  po_id             INT REFERENCES purchase_orders(id),
  vendor_id         INT REFERENCES vendors(id) NOT NULL,
  vendor_invoice_no VARCHAR(50),
  received_at       TIMESTAMP DEFAULT NOW(),
  created_by        INT
);

CREATE TABLE grn_items (
  id             SERIAL PRIMARY KEY,
  grn_id         INT REFERENCES grn(id) NOT NULL,
  product_id     INT REFERENCES products(id) NOT NULL,
  qty_received   INT NOT NULL,
  unit_price     DECIMAL(10,2) NOT NULL,
  batch_no       VARCHAR(50),
  expiry_date    DATE
);

-- ─────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────

CREATE TABLE customers (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  phone           VARCHAR(20) UNIQUE,
  address         TEXT,
  credit_limit    DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,   -- negative = owes store
  loyalty_points  INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE credit_ledger (
  id          SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) NOT NULL,
  sale_id     INT,                            -- FK to sales
  entry_type  VARCHAR(10) NOT NULL,           -- debit / credit
  amount      DECIMAL(10,2) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SALES
-- ─────────────────────────────────────────

CREATE TABLE sales (
  id          SERIAL PRIMARY KEY,
  bill_no     VARCHAR(20) UNIQUE NOT NULL,    -- e.g. INV-2026-00142
  customer_id INT REFERENCES customers(id),
  cashier_id  INT,
  subtotal    DECIMAL(10,2) NOT NULL,
  discount    DECIMAL(10,2) DEFAULT 0,
  tax_total   DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  status      VARCHAR(20) DEFAULT 'completed', -- completed/returned/void
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sale_items (
  id          SERIAL PRIMARY KEY,
  sale_id     INT REFERENCES sales(id) NOT NULL,
  product_id  INT REFERENCES products(id) NOT NULL,
  batch_id    INT REFERENCES inventory_batches(id),
  qty         DECIMAL(10,3) NOT NULL,         -- decimal for weight-based
  unit_price  DECIMAL(10,2) NOT NULL,
  discount    DECIMAL(10,2) DEFAULT 0,
  tax_rate    DECIMAL(5,2)  DEFAULT 0,
  line_total  DECIMAL(10,2) NOT NULL
);

CREATE TABLE payments (
  id           SERIAL PRIMARY KEY,
  sale_id      INT REFERENCES sales(id) NOT NULL,
  method       VARCHAR(20) NOT NULL,          -- cash/upi/card/wallet/credit
  amount       DECIMAL(10,2) NOT NULL,
  reference_no VARCHAR(100),                  -- UPI txn ID, card approval code
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- EMPLOYEES
-- ─────────────────────────────────────────

CREATE TABLE employees (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  phone      VARCHAR(20),
  role       VARCHAR(20) NOT NULL,            -- owner/manager/cashier/stockist
  pin_hash   VARCHAR(200),
  is_active  BOOLEAN DEFAULT TRUE
);

-- ─────────────────────────────────────────
-- KEY INDEXES
-- ─────────────────────────────────────────

CREATE INDEX idx_products_barcode    ON products(barcode);
CREATE INDEX idx_products_sku        ON products(sku);
CREATE INDEX idx_sales_created_at    ON sales(created_at);
CREATE INDEX idx_sale_items_sale_id  ON sale_items(sale_id);
CREATE INDEX idx_payments_sale_id    ON payments(sale_id);
CREATE INDEX idx_inventory_product   ON inventory_batches(product_id);
CREATE INDEX idx_credit_customer     ON credit_ledger(customer_id);
```

---

## 12. Development Roadmap

### Phase 1 — MVP (Months 1–3)
**Goal:** Fully working POS for a single store, enough to replace pen-and-paper billing.

| # | Feature | Notes |
|---|---------|-------|
| 1 | Project scaffold (React + FastAPI + PostgreSQL) | Monorepo: `/POS/frontend` + `/POS/backend` |
| 2 | Product & category management (CRUD + barcode) | Import by barcode scan |
| 3 | Opening stock entry | Bulk import via CSV |
| 4 | POS billing screen | Scan → cart → checkout |
| 5 | Payment: Cash + UPI (QR display) + Credit | Split payment support |
| 6 | Real-time stock deduction on sale | FIFO batch logic |
| 7 | Customer profiles + udhaar ledger | Credit limit enforcement |
| 8 | Receipt printing (browser print) | CSS print-optimized layout |
| 9 | User login + Owner/Cashier roles | PIN-based POS login |
| 10 | Offline mode | IndexedDB + outbox sync |
| 11 | Basic reports: daily sales, stock levels | |
| 12 | GST-compliant invoice format | CGST/SGST breakdown |

**Exit criteria:** A kirana store cashier can complete an entire day of billing using only this system, with no connectivity for 4 hours.

---

### Phase 2 — Full Retail Operations (Months 4–6)
**Goal:** Complete grocery store operations — purchasing, inventory, all reports.

| # | Feature |
|---|---------|
| 1 | Vendor management (profiles, ledger) |
| 2 | Purchase Orders + GRN entry |
| 3 | Inventory auto-update from GRN |
| 4 | Batch tracking + expiry date management |
| 5 | Near-expiry + reorder alerts |
| 6 | Returns, exchanges, refunds |
| 7 | Discount schemes and time-limited offers |
| 8 | Full reporting suite (all 15 reports) |
| 9 | WhatsApp integration (receipts + credit reminders) |
| 10 | Barcode label printing |
| 11 | Employee management + shift reports + audit trail |
| 12 | Day-end closing + Z-report |
| 13 | GST reports (GSTR-1 JSON export) |

**Exit criteria:** Store owner can run complete operations (purchasing → GRN → billing → closing) and file monthly GST without manual spreadsheets.

---

### Phase 3 — Multi-Store / Enterprise (Months 7–12)
**Goal:** Scale to chains; add intelligence and integrations.

| # | Feature |
|---|---------|
| 1 | Multi-store support (shared catalog, store-wise inventory + reports) |
| 2 | Hardware: ESC/POS receipt printer, cash drawer auto-open, scale integration |
| 3 | Loyalty program (points earn + redeem) |
| 4 | AI demand forecasting (Facebook Prophet) |
| 5 | Customer analytics (RFM segmentation, purchase history) |
| 6 | Online ordering (WhatsApp catalogue sync) |
| 7 | Tally / accounting software integration |
| 8 | Mobile PWA for owner (sales dashboard from phone) |
| 9 | Self-checkout kiosk mode |
| 10 | Public API for third-party integrations |

**Exit criteria:** A 5-store chain can operate from a single system with centralized reporting and store-level autonomy.

---

*Blueprint version: 1.0 | Created: March 2026*
