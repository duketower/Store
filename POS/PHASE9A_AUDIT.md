# Phase 9A: Technical Validation Audit

Completed: 2026-03-29

This document records the code-path audit for every shared entity and mutation path in the POS multi-device system. It is the output of Phase 9A as defined in `MULTI_DEVICE_ROADMAP.md`.

---

## Audit Methodology

For each shared entity, the following were verified:

- **Write path**: Is every mutation queued to the outbox AND fire-and-forget synced?
- **Idempotency**: Does the Firestore write use a transaction or `syncId`-keyed `setDoc` to prevent double-apply?
- **Listener**: Is there a `onSnapshot` listener that pushes Firestore changes back into Dexie on all devices?
- **Migration**: Is this entity included in `runMigration()` for backfilling older devices?
- **Page refresh**: Do operational screens that read this entity use `useLiveQuery` or a `key`-based remount so they react to cross-device updates without requiring a manual reopen?

---

## Entity Coverage Matrix

| Entity | Outbox Action | Idempotent Firestore Write | Listener | Migration | Page Refresh |
|--------|--------------|---------------------------|----------|-----------|--------------|
| Sales | `create_sale` | ✅ Transaction — skips if doc exists | ✅ `startSalesListener` | ✅ | ✅ Reports `syncKey` remount |
| Sale Returns | `create_sale_return` | ✅ Transaction — skips if doc exists; throws if sale not yet synced (correct: retries) | ✅ `startSaleReturnListener` | ✅ | ✅ Reports `syncKey` remount |
| Products | `upsert_product`, `update_product_stock` | ✅ `setDoc` keyed by product id | ✅ `startProductListener` | ✅ | ✅ StockTab remounted via `key` |
| Batches | Via GRN / sale / return Firestore transactions | ✅ GRN: `setDoc` per batch; sale/return: `increment` in transaction | ✅ `startBatchListener` | ✅ | ✅ Reports `syncKey` remount |
| Customers | `upsert_customer`, `update_customer_balance` | ✅ `setDoc` keyed by customer id | ✅ `startCustomerListener` | ✅ | ✅ `useLiveQuery(syncKey)` |
| Credit Ledger | `upsert_credit_ledger` | ✅ `setDoc` keyed by `syncId` | ✅ `startCreditLedgerListener` | ✅ | ✅ Reports CreditTab remount |
| Cash Entries | `upsert_cash_entry` | ✅ `setDoc` keyed by `syncId` | ✅ `startCashEntryListener` | ✅ | ✅ CashOutPage `useLiveQuery` |
| Day Sessions | `upsert_day_session` | ✅ `setDoc` keyed by `syncId` | ✅ `startDaySessionListener` → also updates `sessionStore` | ✅ | ✅ ShiftClosePage `useLiveQuery` |
| Expenses | `upsert_expense`, `delete_expense` | ✅ `setDoc` / `deleteDoc` keyed by `syncId` | ✅ `startExpenseListener` | ✅ | ✅ Reports ExpenseTab remount |
| Performance Targets | `set_performance_targets` | ✅ `setDoc` on `app_settings/performance_targets` | ✅ `startPerformanceTargetsListener` | ✅ | ✅ Dashboard `useLiveQuery` |
| Vendors | `upsert_vendor` | ✅ `setDoc` keyed by `syncId` | ✅ `startVendorListener` (handles delete) | ✅ | ✅ ReceiveStockPage `useLiveQuery` |
| GRNs | `create_grn` | ✅ `setDoc` keyed by `syncId`; batch writes in same transaction | ✅ `startGrnListener` | ✅ | ✅ Reports GrnTab remount |
| RTVs | `create_rtv` | ✅ `setDoc` keyed by `syncId`; items embedded | ✅ `startRtvListener` (transactional item rebuild) | ✅ | ✅ Reports RtvTab remount |
| Employees | `upsert_employee` | ✅ `setDoc` keyed by employee id | ✅ `startEmployeeListener` | ✅ | ✅ UsersPage `useLiveQuery` |
| External Staff | `upsert_external_staff` | ✅ `setDoc` keyed by `syncId` | ✅ `startExternalStaffListener` | ✅ | ✅ AttendancePage `useLiveQuery(syncKey)` |
| Attendance Logs | `upsert_attendance_log` | ✅ `setDoc` keyed by `syncId` | ✅ `startAttendanceLogListener` | ✅ | ✅ AttendancePage `useLiveQuery(syncKey)` |
| Leave Requests | `upsert_leave_request` | ✅ `setDoc` keyed by `syncId` | ✅ `startLeaveRequestListener` | ✅ | ✅ AttendancePage `useLiveQuery(syncKey)` |
| Store Settings | `set_store_settings` | ✅ `setDoc` on `app_settings/store_details` | ✅ `startStoreSettingsListener` → also updates in-memory cache | ✅ | ✅ SettingsPage `useLiveQuery` |

---

## Write Path Verification

### Sale write path

```
handlePaymentComplete (BillingPage.tsx:74)
  → cart snapshot locked before async (line 77-78) ✅ race condition fixed
  → generateBillNumber()
  → createSaleTransaction (db/queries/sales.ts)
      → Dexie transaction: sale + items + payments + stock deduct + credit ledger + loyalty points + outbox entry
      → Returns saleId
  → syncSaleToFirestore() [fire-and-forget]
      → Firestore runTransaction: creates sale doc + product stock increments + batch qty decrements + credit ledger + loyalty points increment
      → Idempotent: returns early if sale doc already exists
  → On failure: outbox entry replays via flushOutbox() on next online event
```

### Return write path

```
processReturn (db/queries/sales.ts)
  → Dexie transaction: return record + stock restore + credit ledger credit + customer balance reduction + outbox entry
  → syncReturnToFirestore() [fire-and-forget]
      → Firestore runTransaction: creates return doc + product stock increment + batch qty increment + sale returnTotal update + credit ledger + customer balance
      → Idempotent: returns early if return doc exists
      → Throws if sale not yet synced → outbox retries until sale is present
  → Ordering safe: outbox processes by createdAt ASC, sale always queued before return
```

### Session open/close path

```
openSession()
  → Always assigns createSyncId('session') ✅
  → Dexie transaction: session record + outbox entry
  → syncSessionToFirestore() [fire-and-forget]

closeSession()
  → Idempotency guard: returns early if session.status === 'closed' ✅
  → Legacy syncId fix: generates syncId if missing, persists it before queuing ✅
  → Dexie transaction: update session + outbox entry
  → syncSessionToFirestore() [fire-and-forget]
```

### Credit request/approve/revoke path

```
requestCreditLine / approveCreditLine / declineCreditRequest / revokeCreditLine
  → All use syncCustomerSnapshot() which:
      → Reads customer from Dexie
      → Applies mutation
      → Dexie transaction: update customer + queue upsert_customer outbox entry
      → syncCustomerToFirestore() [fire-and-forget]
```

---

## Gaps Found and Fixed in This Audit

### Fix 1: Loyalty points not synced to Firestore (CLOSED)

**Root cause:** `createSaleTransaction` incremented `loyaltyPoints` locally via `db.customers.modify()` but did not include this in the Firestore sale transaction. Points diverged between devices until the customer was next edited for another reason.

**Fix applied:**
- Added `loyaltyPointsDelta?: number` to `SaleSyncPayload` in `services/firebase/sync.ts`
- `syncSaleToFirestore` now applies `loyaltyPoints: increment(loyaltyPointsDelta)` with `merge: true` on the customer doc inside the sale Firestore transaction
- `createSaleTransaction` computes `loyaltyPointsDelta = Math.floor(grandTotal / 100)` and includes it in both the outbox JSON payload and the fire-and-forget call
- `flushOutbox()` passes `loyaltyPointsDelta` when deserializing new-style outbox entries
- Legacy outbox entries (from before this fix) do NOT get loyalty points replayed — this is correct because migration syncs the full customer snapshot including accumulated historical points

**Files changed:** `services/firebase/sync.ts`, `db/queries/sales.ts`, `services/sync/outbox.ts`

### Fix 2: Legacy session close not queued to outbox (CLOSED)

**Root cause:** `closeSession()` had `if (!nextSession.syncId) return` which silently skipped the outbox entry for sessions opened before the syncId system was introduced. Those sessions would close in Dexie but the close event would never sync to Firestore.

**Fix applied:**
- `closeSession()` now generates `createSyncId('session')` if the session has no syncId, persists it to Dexie, and then proceeds to queue the outbox entry
- All sessions — old and new — will have their close event synced

**Files changed:** `db/queries/daySessions.ts`

---

## Previously Reported Bugs: Current Status

The following issues were identified in a prior code review. All were fixed before this audit:

| Bug | Status | Notes |
|-----|--------|-------|
| Race condition on checkout — cart read after async `generateBillNumber()` | ✅ Fixed | Cart snapshot taken at line 77-78 of BillingPage before any async call |
| Credit balance NaN from undefined `currentBalance` | ✅ Fixed | `toFiniteNumber()` used in `updateCreditBalance` |
| Session close not idempotent | ✅ Fixed | `if (session.status === 'closed') return` guard in `closeSession()` |
| Outbox silently dropping legacy sale entries missing `cashierId` | ✅ Fixed | `rebuildLegacySalePayload()` reads sale+items+payments from Dexie and rebuilds full payload |
| GST calculated before bill discount | ✅ Fixed | Cart store calculates `taxTotal` on post-discount line totals |
| Sale items with undefined `batchId` | ✅ Fixed | `batchAllocations` always populated; `batchId` only included when present |

---

## Page-Level Refresh Coverage

All operational screens that stay open during store operations use live Dexie subscriptions:

| Screen | Refresh Mechanism | Entities Watched |
|--------|------------------|-----------------|
| ReportsPage (all tabs) | `useLiveQuery(syncKey)` → tab remounted via `key` prop | sales, returns, products, batches, customers, credit_ledger, sessions, cash_entries, expenses, vendors, grns, rtvs, employees, attendance, leave, external_staff |
| DashboardPage | `useLiveQuery` for inventory alerts | products, batches |
| AttendancePage | `useLiveQuery(syncKey)` | attendance_logs, leave_requests, employees, staff_external |
| CustomersPage | `useLiveQuery(syncKey)` | customers, credit_ledger |
| UsersPage | `useLiveQuery` | employees |
| SettingsPage | `useLiveQuery` for settings, targets, outbox queue | store_settings, performance_targets, outbox |
| ShiftClosePage | `useLiveQuery` for Z-report | sales, payments, cash_entries, day_sessions |
| CashOutPage | `useLiveQuery` | day_sessions, cash_entries |
| ReceiveStockPage | `useLiveQuery` | vendors |

---

## Sync Queue Visibility

Sync status is visible to operators via:
- **Header badge**: Shows pending outbox count (driven by `useLiveQuery` on outbox table)
- **SettingsPage**: Full outbox listing with entity type, action, status (pending/syncing/failed), and timestamps
- **Outbox summary**: `{ pending, failed, syncing }` counts visible on settings screen

Failed entries stay in the outbox and are retried on every reconnect event. The operator can see them and escalate if entries remain failed for an extended period.

---

## Migration Execution Notes

`runMigration()` in `services/sync/migration.ts` covers all 18 entities in this order:

1. Products
2. Batches
3. Customers
4. Employees
5. Expenses
6. Vendors
7. GRNs
8. RTVs (with items)
9. Sales (with items and payments)
10. Sale Returns
11. Credit Ledger
12. Day Sessions
13. Cash Entries
14. External Staff
15. Attendance Logs
16. Leave Requests
17. Performance Targets
18. Store Settings

All writes use `setDoc` (idempotent) — safe to re-run. Re-running migration overwrites Firestore with the current Dexie state. Run it from the Settings → Migration page on any device that has the canonical historical data.

**Warning:** Do not run migration on a device that only has partial data (e.g., a device that was offline for weeks). Always run migration from the device with the most complete history.

---

## Phase 9B Live Drill Checklist

The following drills confirm the code-level guarantees hold under real conditions. These cannot be fully verified from one machine.

### Online sync drills

- [ ] Device A creates a bill → Device B sees updated stock, bill in reports, customer balance (if credit/loyalty), dashboard stats — without reopening pages
- [ ] Device A adds/edits a product → Device B StockTab refreshes showing updated product
- [ ] Device A receives stock (GRN) → Device B sees updated batch inventory, stock totals, GRN history
- [ ] Device A creates a sale return → Device B sees stock restored, bill return status, customer balance updated
- [ ] Device A performs cash-out → Device B CashOut and ShiftClose pages reflect updated totals
- [ ] Device A closes shift → Device B ShiftClose page shows closed session
- [ ] Device A adds expense → Device B dashboard and reports reflect new expense
- [ ] Device A updates store settings → Device B settings page and receipt preview update

### Attendance and staff drills

- [ ] Device A clocks in an employee → Device B attendance board updates without reload
- [ ] Device A submits a leave request → Device B shows pending request
- [ ] Device A approves a leave request → Device B shows approved status
- [ ] Device A adds external staff → Device B attendance page shows new staff member

### User and auth drills

- [ ] Device A creates a new employee with PIN → Device B login screen shows new employee card and accepts their PIN
- [ ] Device A resets an employee PIN → Device B accepts the new PIN immediately

### Offline recovery drills

- [ ] Device A goes offline → cashier creates 3+ bills on Device A → Device A reconnects → all 3 bills appear on Device B, stock is correct, no duplicates
- [ ] Device A goes offline mid-shift, closes shift offline → reconnects → session close syncs to Firestore → Device B shift report shows correct Z-report
- [ ] Device A creates a credit sale offline → reconnects → Device B shows updated customer balance and credit ledger entry

### Idempotency drills

- [ ] Manually trigger `flushOutbox()` twice on the same entry (simulate double-flush) → no duplicate records, no double stock movement, no double balance change
- [ ] Force-close a sale outbox entry to pending, restart browser, confirm it retries and syncs exactly once

### Fresh-device bootstrap drill

- [ ] Open a new browser profile (or clear IndexedDB) → app boots → Firestore listeners hydrate products, customers, employees, sessions, cash entries, vendors into local Dexie → billing is fully operational without running migration

### Migration drill

- [ ] Find a device with older local-history data → run migration from Settings → confirm all 18 stages complete → Firestore contains the migrated history → second device's Dexie receives the migrated data via listeners

---

## Phase 9C Release Gate Checklist

The app may only be described as fully multi-device when ALL of the following pass in live drills:

- [ ] Bill history matches between devices for the same date range
- [ ] Stock totals match between devices after a sale and after a GRN
- [ ] Batch availability matches after a sale, return, and GRN
- [ ] Customer balances match between devices after credit sale, return, and collection
- [ ] Credit ledger entries are identical between devices
- [ ] Cash totals match after cash-out
- [ ] Shift totals match in Z-report between devices
- [ ] Attendance and leave state matches between devices without reload
- [ ] Report totals agree for the same date range on both devices
- [ ] Outbox reaches clean or expected state after recovery (no stuck failed entries)
- [ ] Sync badge correctly reflects actual outbox + connectivity state
- [ ] No screen requires manual page reopen to reflect a cross-device update
- [ ] Migration completes without errors on an older-history device
- [ ] No replay creates duplicate effects (stock, balance, session close)

---

## Remaining Risks

The following items are verified in code but unconfirmed without real two-device drills:

1. **Return ordering under offline-then-reconnect**: A return created offline will retry outbox flush after reconnect. The return Firestore write requires the sale to already exist in Firestore. If the sale outbox entry is also pending, the outbox must flush the sale first. The outbox processes entries in `createdAt` ASC order, so sales always precede their returns. This is correct in code but should be verified in a drill where both a sale and its return were created offline.

2. **Concurrent GRN + sale on same product**: If Device A receives stock (GRN adds batches) while Device B is simultaneously processing a sale (FEFO deduction), there is a window where the sale runs FEFO against a pre-GRN batch list. The product stock and batch quantities will converge correctly after both sync, but the FEFO batch selection on Device B may not include the newly received batches. This is expected behavior under the single-billing-device offline model, but should be observed in a real drill.

3. **Loyalty points on credit sales**: For credit sales, `syncSaleToFirestore` applies both `currentBalance: increment(creditAmount)` and `loyaltyPoints: increment(pts)` to the customer. Both use `merge: true`. Firebase should apply both increments atomically in the transaction. This is code-verified but not drilled.

4. **Employee PIN propagation latency**: New employees are synced to Firestore via the outbox. The `startEmployeeListener` pushes the Firestore record into Dexie on all devices. The PIN hash is stored in the shared employee record (Decision 010). In the window between employee creation on Device A and the listener firing on Device B, the new employee cannot log in on Device B. This is expected and acceptable but should be documented to operators.

5. **RTV Firestore read during fresh-device load**: The RTV listener embeds items in the Firestore RTV document. On fresh device, the listener delivers all RTV docs and reconstructs `rtvs` + `rtv_items` in Dexie. Verify item reconstruction is complete before the RTV report tab is opened.
