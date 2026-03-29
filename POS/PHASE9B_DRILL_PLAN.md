# Phase 9B — Two-Device Validation Drill Plan

**Reference commits:** `c2fe6d6`, `3c58eb0`
**Live target:** `https://pos.binaryventures.in`
**Created:** 2026-03-29

---

## Purpose

This document is the final gate before calling the POS a production-safe multi-device store system.

Every scenario below must be run and a pass/fail recorded. No scenario may be skipped or marked "assume pass."

The app's operating model being tested:
- Devices share state in near-real-time when online
- One billing device continues offline during outages
- Queued updates replay exactly once when internet returns
- All devices converge to the same operational truth without manual intervention

---

## One-Machine vs Two-Device Split

### Can be verified from one machine (code-proven)

These were confirmed in the Phase 9A audit and subsequent fix passes. No re-testing needed unless a regression is suspected:

| Item | Status |
|------|--------|
| Dexie transaction atomicity (sale + items + payments + stock + outbox) | Code-verified |
| Cart snapshot locked before async at checkout | Code-verified |
| `syncSaleToFirestore` guard prevents duplicate sale write | Code-verified |
| Outbox `flushInFlight` lock prevents concurrent double-flush | Code-verified |
| Outbox max retry (10) + exponential backoff | Code-verified |
| UUID offline bill number — no device-local counter | Code-verified |
| Credit limit re-read from Dexie at checkout completion | Code-verified |
| Return sync uses `increment(-totalRefund)` not stale absolute set | Code-verified |
| `processReturn` allows negative customer balance (refund > balance) | Code-verified |
| Sale status updated to `completed` after outbox flush succeeds | Code-verified |
| Sync badge counts live pending/failed (not dead entries) | Code-verified |
| GST calculated after bill discount | Code-verified |
| FEFO batch selection logic | Code-verified |
| GRN zero-price validation blocks submission | Code-verified |
| Shared employee docs no longer carry `pinHash` / `passwordHash` | Code-verified |
| Employee PIN verifier fetched on demand into a local device cache | Code-verified |
| `createEntityId` uses `crypto.getRandomValues()` — no timestamp collision | Code-verified |
| ShiftClosePage prefers a shared Firestore-backed shift report | Code-verified |

### Requires a real second device (cannot simulate)

Everything below. These are the actual drills.

---

## Drill Matrix

> **Setup for all drills:**
> - Device A = primary billing device (the actual store browser / tablet)
> - Device B = second device (another browser profile, phone, or laptop on the same Firebase project)
> - Both logged in as Admin or Manager
> - Both have `startFirestoreListeners()` running (app fully booted)
> - Both devices online at drill start unless the drill specifies offline

---

### Drill 1 — Live bill sync

| Field | Detail |
|-------|--------|
| **Scenario** | Device A creates a cash sale; Device B sees it live |
| **Preconditions** | Both devices online. Product with known stock on Device B's StockTab. Customer with known loyalty points selected (optional). |
| **Steps on A** | Complete a cash sale of 2+ items. |
| **Checks on B** | Without page reload: (1) Reports → Bills shows the new bill. (2) StockTab shows reduced stock for sold items. (3) Dashboard sales total updated. (4) Customer loyalty points updated if customer was attached. |
| **Expected** | All 4 visible within ~5 seconds. No page reload required. |
| **Failure signal** | B's stock or reports unchanged after 10s. Manual reload required to see update. |
| **Severity if fails** | High — core live-sync promise broken |

---

### Drill 2 — Credit sale balance propagation

| Field | Detail |
|-------|--------|
| **Scenario** | Device A creates a credit sale; Device B sees customer balance increase |
| **Preconditions** | Customer with a credit limit and known `currentBalance`. Both devices online. Customer page open on Device B. |
| **Steps on A** | Complete a credit sale for that customer (partial or full credit payment). |
| **Checks on B** | Customer's `currentBalance` reflects the new amount. Credit ledger entry visible in Reports → Credit tab. |
| **Expected** | Balance and ledger entry updated on B within ~5 seconds. |
| **Failure signal** | B still shows old balance. Ledger entry absent. |
| **Severity if fails** | Critical — credit balance divergence; cashier on B may extend credit beyond limit |

---

### Drill 3 — Return: stock restore + balance + ledger

| Field | Detail |
|-------|--------|
| **Scenario** | Device A processes a return; Device B sees all three effects |
| **Preconditions** | A completed sale exists (created in Drill 1 or 2). Both devices online. |
| **Steps on A** | Process a return for items from the bill. If it was a credit sale, verify the return reduces the customer balance. |
| **Checks on B** | (1) Sold product stock increases back. (2) If credit sale: customer balance decreases. (3) Credit ledger shows the return entry. (4) Bill shows partial/full return state in Reports. |
| **Expected** | All visible within ~5 seconds. |
| **Failure signal** | Stock not restored. Balance not reduced. Ledger entry missing. |
| **Severity if fails** | Critical — stock and credit records diverge |

---

### Drill 4 — GRN / receive stock propagation

| Field | Detail |
|-------|--------|
| **Scenario** | Device A receives stock via GRN; Device B sees updated inventory |
| **Preconditions** | A product with known stock and batch list. Both devices online. |
| **Steps on A** | Receive stock for the product with a specific expiry date and purchase price. |
| **Checks on B** | (1) Product stock total updated in StockTab. (2) New batch visible in batch list. (3) Reports → GRN history shows the receipt. |
| **Expected** | Visible within ~5 seconds. |
| **Failure signal** | B's stock unchanged. New batch absent. |
| **Severity if fails** | High — inventory divergence across devices |

---

### Drill 5 — Cash-out propagation

| Field | Detail |
|-------|--------|
| **Scenario** | Device A performs a cash-out entry; Device B sees updated cash totals |
| **Preconditions** | Open day session on both devices. Both online. |
| **Steps on A** | Create a cash-out entry (e.g., ₹500 removed for supplier payment). |
| **Checks on B** | CashOut page shows the new entry. ShiftClose page updates expected cash figure. |
| **Expected** | Entry visible on B without reload. |
| **Failure signal** | B's cash-out page unchanged. |
| **Severity if fails** | Medium — cash reconciliation wrong |

---

### Drill 6 — Shift close shared report

| Field | Detail |
|-------|--------|
| **Scenario** | Device A closes shift; Device B sees the same shared shift totals and closed-session state |
| **Preconditions** | Both devices have been billing during the same session. Both online. |
| **Steps on A** | Close the shift on Device A. |
| **Checks on B** | (1) ShiftClose page shows the same shift totals as A before closure. (2) After A closes the shift, B shows the session as closed. (3) No local-only warning is shown while shared sync is healthy. |
| **Expected** | Shared shift totals match on both devices and the closed state propagates. |
| **Failure signal** | Session still shows open on B after A closes it. Or B shows different cash/sales totals from A while both were online and synced. |
| **Severity if fails** | High — cash reconciliation truth diverges across devices |

---

### Drill 7 — Employee create + PIN login on Device B

| Field | Detail |
|-------|--------|
| **Scenario** | Device A creates a new employee; Device B can log in with their PIN |
| **Preconditions** | Both devices online. |
| **Steps on A** | Admin creates a new cashier with PIN "7890". |
| **Checks on B** | (1) Login screen shows the new employee card within ~10 seconds. (2) Entering PIN "7890" on B successfully logs in while online. (3) After that first successful login, the same PIN still works on B offline. |
| **Expected** | Login works on B without any admin-side reprovisioning. The first successful online login caches the verifier for offline reuse on B. |
| **Failure signal** | Employee card absent on B. PIN rejected while online. PIN works online but fails offline immediately afterward. |
| **Note** | There is a propagation window (listener latency + credential fetch). If it takes >30 seconds, investigate listener health or employee credential sync. |
| **Severity if fails** | High — staff provisioning across devices broken |

---

### Drill 8 — Attendance / leave / external staff parity

| Field | Detail |
|-------|--------|
| **Scenario** | Device A updates attendance/leave; Device B attendance board reflects it live |
| **Preconditions** | Both devices online. Attendance page open on Device B. |
| **Steps on A** | (1) Clock in an employee. (2) Submit a leave request. (3) Approve the leave. (4) Add an external staff member. |
| **Checks on B** | For each action: attendance status updates, leave request appears/approves, external staff entry appears — all without reload. |
| **Expected** | All 4 reflect on B within ~5 seconds each. |
| **Failure signal** | Any of the four require a page reload. |
| **Severity if fails** | Medium — staff management divergence |

---

### Drill 9 — Store settings / targets propagation

| Field | Detail |
|-------|--------|
| **Scenario** | Device A updates store settings or monthly targets; Device B reflects them |
| **Preconditions** | Both devices online. Settings page open on Device B. |
| **Steps on A** | Update at least one receipt detail (store name/phone) and one monthly target figure. |
| **Checks on B** | Settings page reflects updated values. Dashboard target bar updates. |
| **Expected** | Both visible within ~5 seconds. |
| **Failure signal** | B shows old settings. |
| **Severity if fails** | Low — settings drift is operational friction but not financial risk |

---

### Drill 10 — Fresh device bootstrap

| Field | Detail |
|-------|--------|
| **Scenario** | A fresh browser profile (zero local state) joins the live store and becomes operational |
| **Preconditions** | Store has existing live Firestore data (products, customers, employees, open session). |
| **Steps** | Open the app in a new Incognito window (or clear IndexedDB and localStorage). Wait for boot. |
| **Checks** | (1) Products are searchable by barcode/name immediately. (2) Customer list is populated. (3) Login employee list shows all employees. (4) An open session is visible (if one exists). (5) A complete sale can be processed end-to-end. |
| **Expected** | Operational within ~15 seconds of boot. No migration required. |
| **Failure signal** | Products empty. Customer list empty. Login shows no employees. |
| **Severity if fails** | Critical — adding a second device to the store is unusable |

---

### Drill 11 — Offline billing → reconnect → convergence

| Field | Detail |
|-------|--------|
| **Scenario** | Device A goes offline, creates bills, reconnects; Device B sees exact replay |
| **Preconditions** | Both devices online initially. Note current stock levels for 2 products. |
| **Steps on A** | Disconnect Device A from internet (WiFi off / network throttle to offline). Create 3 bills against known products. Note the bill numbers (should be `INV-YYYY-OFF-XXXXXXXX`). Reconnect. |
| **Checks on B** | After A reconnects: (1) All 3 offline bills appear in B's Reports → Bills. (2) Stock on B decrements by the correct amounts. (3) Outbox on A shows empty (all flushed). (4) No duplicate bills exist. |
| **Expected** | All 3 bills present on B within ~30 seconds of A reconnecting. Stock exact. Outbox clean. |
| **Failure signal** | Any bill missing on B. Stock wrong. Outbox entries stuck in failed. |
| **Severity if fails** | Critical — offline billing recovery is broken |

---

### Drill 12 — Offline credit sale → reconnect → balance parity

| Field | Detail |
|-------|--------|
| **Scenario** | Device A creates a credit sale offline; reconnects; Device B sees correct customer balance |
| **Preconditions** | Customer with known balance and remaining credit. |
| **Steps on A** | Go offline. Complete a credit sale for the customer. Reconnect. |
| **Checks on B** | Customer balance on B increases by credit amount. Credit ledger entry present. |
| **Expected** | Exact balance visible on B within ~30 seconds of A reconnecting. |
| **Failure signal** | Balance unchanged on B. Ledger entry missing. |
| **Severity if fails** | Critical — credit balance divergence after offline recovery |

---

### Drill 13 — Offline return after offline sale → reconnect → final state

| Field | Detail |
|-------|--------|
| **Scenario** | Device A creates a sale and its return while offline; both replay in correct order |
| **Preconditions** | Device A offline. |
| **Steps on A** | Create a sale while offline. Then immediately process a return for that same bill while still offline. Reconnect. |
| **Checks on B** | (1) Sale appears on B. (2) Return appears on B. (3) Stock matches: reduced by sale qty, restored by return qty. (4) Outbox on A empty. |
| **Expected** | Sale syncs before return (outbox processes by `createdAt ASC`). Final stock = original. |
| **Failure signal** | Return appears before sale (outbox ordering broken). Stock wrong. Return stuck in outbox. |
| **Note** | The return's Firestore write will throw if the sale doc doesn't exist yet — this causes the return to retry correctly after the sale syncs. This is the expected safe behavior, not a failure. |
| **Severity if fails** | Critical — return sync ordering broken; stock and billing records wrong |

---

### Drill 14 — Idempotency: double reconnect / double flush

| Field | Detail |
|-------|--------|
| **Scenario** | Force a double-flush and verify no duplicate effects |
| **Preconditions** | Device A has pending outbox entries (go offline, create a bill, come back online). |
| **Steps** | While outbox is flushing, use **Settings → Retry Sync Now** on Device A, or close and reopen the tab immediately after reconnecting (triggering startup flush + online event flush simultaneously). |
| **Checks** | (1) Bill appears exactly once in Firestore. (2) Stock decremented exactly once. (3) Customer balance updated exactly once if credit. (4) Outbox empties cleanly. |
| **Expected** | No duplicates. Idempotency guards (sale doc exists check) absorb the retry. |
| **Failure signal** | Duplicate bill in Firestore. Stock double-decremented. Balance double-charged. |
| **Severity if fails** | Critical — double-billing and double-stock movement are unacceptable |

---

### Drill 15 — RTV listener item reconstruction on fresh device

| Field | Detail |
|-------|--------|
| **Scenario** | A fresh device receives RTV history correctly with all line items |
| **Preconditions** | At least one RTV exists in Firestore. Fresh browser profile (empty Dexie). |
| **Steps** | Boot fresh device. Navigate to Reports → RTV tab. |
| **Checks** | RTV entries appear with correct line items (not just the header). |
| **Expected** | Items embedded in Firestore doc are reconstructed into `rtv_items` Dexie table on listener. |
| **Failure signal** | RTV list shows entries with no items. |
| **Severity if fails** | Low for live billing; medium for audit/reports integrity |

---

## Pass/Fail Gate

The app may only be described as production-safe for multi-device store use when **all** of the following pass:

| Gate | Criterion |
|------|-----------|
| G-1 | Drill 1 passes — live bill visible on B without reload |
| G-2 | Drill 2 passes — credit balance exact on B within 5s |
| G-3 | Drill 3 passes — stock and balance restored after return on B |
| G-4 | Drill 4 passes — GRN stock visible on B |
| G-5 | Drill 10 passes — fresh device fully operational without migration |
| G-6 | Drill 11 passes — all offline bills replay correctly with no duplicates |
| G-7 | Drill 12 passes — offline credit sale balance correct on B after reconnect |
| G-8 | Drill 13 passes — offline return syncs in correct order after offline sale |
| G-9 | Drill 14 passes — double-flush produces no duplicate effects |
| G-10 | Outbox reaches clean state (empty or expected) after all drills |
| G-11 | Sync badge reflects true queue state throughout |
| G-12 | No screen requires manual page reload to reflect a cross-device update (Drills 1–9) |

Drills 5, 6, 7, 8, 9, 15 are **important but not blocking gates** — they can fail without blocking store use if the core billing/stock/credit/recovery chain (G-1 through G-12) passes.

---

## Remaining Known Limits

These are **intentional architectural compromises**, not unresolved bugs. Document them to operators.

| Limit | Detail | Operator guidance |
|-------|--------|-------------------|
| **Offline activity on another device is invisible until sync** | The shared shift report uses synced Firestore data. If another device is still offline, its unsynced billing/cash activity will not appear until it reconnects. | Only one billing device should keep operating during an outage. Reconnect that device before final reconciliation. |
| **Employee PIN cache is device-local after first fetch** | Employee metadata is shared live, but the actual PIN verifier is fetched into a local device cache when that device first needs it. | New devices, or devices after a PIN change, need one online login attempt before that employee can log in there offline. |
| **Concurrent returns on same bill from two devices** | Two devices processing returns on the same bill simultaneously can race on `returnTotal` accumulation in Firestore. | In practice: one device handles returns. If this ever produces a wrong total, re-check the Firestore `returnTotal` field manually. |
| **Sale status `pending_sync` while still offline** | Sale status transitions to `completed` after successful fire-and-forget sync or outbox replay. During offline operation, status stays `pending_sync` until reconnect. | Cosmetic only — does not affect billing or stock. No operator action needed. |
| **Employee PIN latency on new device** | After creating an employee on Device A, there is a listener propagation window (typically 3–10 seconds) before the new PIN works on Device B. | Normal. Tell new staff to wait 15 seconds before trying to log in on a second device. |

---

## Recommended Live Test Order

Run these in the store in this order to minimize risk of disrupting live operations:

1. **Drill 9** (settings sync) — zero financial risk, confirms listener plumbing is alive
2. **Drill 7** (employee + PIN) — low risk, confirms auth sync
3. **Drill 8** (attendance) — low risk, confirms attendance sync
4. **Drill 1** (live bill, cash only) — first real billing drill, online only
5. **Drill 4** (GRN) — receive a small test stock entry
6. **Drill 2** (credit sale) — use a test customer or trusted customer with headroom
7. **Drill 3** (return) — return the items from Drill 2's sale
8. **Drill 5** (cash-out) — record a small test cash-out
9. **Drill 6** (shift close scope) — observe, do not actually close the shift unless intended
10. **Drill 10** (fresh device bootstrap) — use a laptop in incognito mode
11. **Drill 11** (offline bills) — do during a quiet moment; 3 test bills is enough
12. **Drill 12** (offline credit sale) — requires a test customer
13. **Drill 13** (offline sale + return) — most complex; do last
14. **Drill 14** (idempotency) — technical, best done with browser console access
15. **Drill 15** (RTV items) — low risk, do when convenient

---

## Recording Results

For each drill, record:

```
Drill N — [name]
Date: ____
Device A: ____  (browser/device)
Device B: ____  (browser/device)
Result: PASS / FAIL / PARTIAL
Notes: ____
Latency observed: ____s
```

A PARTIAL result means the outcome was correct but took longer than expected, required a page action, or had a visible glitch.

---

## What to Do if a Drill Fails

| Failure type | Action |
|-------------|--------|
| Listener not firing within 10s | Check Firestore project health. Check `startFirestoreListeners()` called on boot. Check anonymous auth. |
| Outbox entry stuck in `failed` | Open Settings → Sync Queue. Inspect the entry. Check Firestore console for the failing document. |
| Duplicate bill or stock movement | Immediately note the `billNo` and Firestore document. This is a critical bug — do not continue drills. |
| Fresh device boots empty | Check `startFirestoreListeners()`. Check if migration needs to run from the primary device first. |
| Offline bills not replaying | Check network connectivity restored. Check outbox in Settings. Try a manual flush by triggering any navigation. |

---

*This checklist replaces the Phase 9B drill section in `PHASE9A_AUDIT.md`. Update `PHASE9A_AUDIT.md` Phase 9B checkboxes as each drill is completed.*
