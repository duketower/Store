# POS Multi-Device Roadmap

## Goal

Make every operational module in `POS/` behave as a shared store system across devices.

Target operating model:
- While online, all business-critical state is shared across devices in near real time.
- If the internet drops, one billing device may continue working locally.
- When connectivity returns, queued updates replay exactly once and all devices converge.
- Non-billing devices must not silently diverge from the live store state.

Current rollout status:
- Phases 1 through 7 are now complete in code: shared entities, retryable outbox replay, listeners, migration paths, store settings, attendance, vendor/GRN/RTV flows, and employee provisioning all use the shared sync architecture.
- Phase 8 is now complete in code: report screens, attendance, customers, users, settings, dashboard alerts, shift/cash-out screens, receive-stock vendor selection, and the login employee list all re-read the mirrored shared state when cross-device updates land.
- The old static `Local Mode` badge has been replaced in code with a live sync-status indicator driven by connectivity plus the outbox state.
- The follow-up financial correctness pass is now complete in code: checkout uses a locked cart snapshot, credit balances are guarded against `NaN`, GST is calculated after bill discounts, legacy sale outbox entries rebuild instead of being silently dropped, and sale/return batch allocations are preserved for traceability.
- Phase 9A is now complete: the full entity coverage audit found two gaps (loyalty points not synced to Firestore from sales; legacy session close not queuing outbox entry). Both are now fixed and the complete audit matrix, write-path verification, and live-drill checklist are documented in `PHASE9A_AUDIT.md`.
- Phase 9B is the next gate: live two-device validation drills. See `PHASE9A_AUDIT.md` for the full drill checklist.

## Definition Of Done

The POS is only considered fully multi-device when all of the following are true:

- Every shared business entity has a Firestore source of truth plus a Dexie mirror.
- Every write path uses either an idempotent Firestore transaction or the retryable outbox.
- Every read-heavy page can see cross-device data through listeners or Firestore-backed queries.
- No stock, credit, cash, or shift mutation can be lost when the internet drops temporarily.
- Local-only settings are either intentionally device-local or explicitly migrated to shared settings.
- Initial migration can backfill all shared modules already used in the store.
- A second live device can stay open during store operations without showing stale values or requiring manual reopen/refresh.
- A fresh or previously stale device can rejoin the store safely and converge without operator guesswork.

## Coverage Audit

| Module | Current State | Main Gaps |
| --- | --- | --- |
| Billing / Sales / Payments | Shared in code | Needs live two-device validation and outage drills. |
| Products / Stock | Shared in code | Needs real-world validation around concurrent operational use. |
| Batches / FEFO | Shared in code | Needs multi-device validation against GRN, sale, return, and RTV combinations. |
| Customers / Credit | Shared in code | Needs live secondary-device verification for approvals, collections, and ledger parity. |
| Cash Out / Day Session | Shared in code | Shared Firestore-backed shift report now shipped; needs final operational validation during an actual shift. |
| Expenses / Dashboard Targets | Shared | Keep as baseline. |
| Vendors | Shared in code | Needs secondary-device validation. |
| GRNs / Receive Stock | Shared in code | Needs secondary-device validation. |
| RTVs | Shared in code | Needs secondary-device validation. |
| Attendance Logs | Shared in code | Needs live validation. |
| Leave Requests | Shared in code | Needs live validation. |
| External Staff | Shared in code | Needs live validation. |
| Users / Employees / Auth | Shared in code | Employee metadata is shared; PIN verifiers now use on-demand credential fetch + device cache; needs live device validation around provisioning and PIN rotation. |
| Store / Receipt Settings | Shared in code | Needs admin-side validation while multiple devices stay open. |
| Reports | Shared in code | Needs cross-device spot checks on every tab. |
| Migration / Backfill | Shared in code | Needs execution on an older local-history device to validate field migration end to end. |

## Missed Items Found In Audit

- Open report tabs only remounted when table counts changed, so stock-only or settings-only edits could stay stale on another device.
- Attendance screens used count-only refresh cues, so status changes without count changes could stay stale on an open page.
- Customers, users, login, settings, dashboard inventory alerts, cash-out, shift-close, and receive-stock vendor lists still had one-time loads instead of live mirrored reloads.
- The header still showed a static `Local Mode` label even though the app now uses shared sync and queued recovery.

All four of the above are now closed in code in this pass.

## Final Validation Plan

The remaining work is no longer "find missing sync code." It is now "prove the shared-store design holds under real use."

Phase 9 is split into three parts so the finish line is explicit:

### Phase 9A: Technical Validation I Can Complete Myself

- Build a scenario matrix for every shared entity and every write path:
  - sales
  - returns
  - products
  - batches
  - customers
  - credit ledger
  - cash entries
  - day sessions
  - expenses
  - performance targets
  - vendors
  - GRNs
  - RTVs
  - employees
  - attendance logs
  - leave requests
  - external staff
  - store settings
- Verify each write path is covered by either:
  - idempotent Firestore replay
  - or a retryable outbox entry with listener hydration
- Verify mirrored read coverage for the operational screens that stay open during the day:
  - dashboard
  - billing-adjacent admin flows
  - reports
  - attendance
  - settings
  - users
  - customers
  - receive stock
  - cash-out
  - shift close
- Add or tighten diagnostic notes for:
  - pending queue visibility
  - failed queue visibility
  - stale queue visibility
  - migration execution order
- Output:
  - a completed code-path audit
  - a scenario checklist for live drills
  - explicit pass/fail notes for anything still risky

### Phase 9B: Live Two-Device Validation

These are the drills that actually prove store safety:

- Online sync drill:
  - device A creates a bill
  - device B sees sales, stock, reports, dashboard, and customer balance update without reopen
- Offline billing recovery drill:
  - device A goes offline
  - device A creates bills locally
  - device A reconnects
  - queued updates replay exactly once
  - device B converges to the same totals, stock, and bill history
- Inventory drill:
  - device A receives stock through GRN
  - device B sees batch inventory, stock totals, and GRN history update
- Return drill:
  - device A creates a sale return
  - device B sees stock restoration, bill return state, and customer balance update
- Cash and shift drill:
  - cash-out and shift-close are performed while another device is open
  - dashboard, reports, and session totals stay aligned
- Credit drill:
  - request / approve / collect / revoke flows are performed on one device
  - the second device shows the same customer state and ledger parity
- Staff/admin drill:
  - employee changes, attendance, leave, and shared store settings are changed on one device
  - the second device reflects them while the relevant page is still open
- Fresh-device bootstrap drill:
  - a fresh browser profile or newly opened device joins the store
  - it hydrates into the current shared state without manual cleanup

### Phase 9C: Release Gate Before "Picture Perfect"

The app is only allowed to be called fully multi-device when all of the following are true:

- No mismatch appears between device A and device B for:
  - bill history
  - stock totals
  - batch availability
  - customer balances
  - credit ledger
  - cash totals
  - shift totals
  - attendance and leave state
  - report totals for the same date range
- No replay creates duplicate stock movement, duplicate customer balance movement, or duplicate bill-side effects.
- The outbox returns to a clean or expected state after recovery.
- The visible sync badge matches the real queue/connectivity state.
- No critical screen requires a manual page reopen to reflect a shared update.
- Migration/backfill completes safely on at least one older-history device snapshot.

If any one of these fails, the app is not yet "picture perfect."

## Task List

### Phase 1: Return Flow

- Add a shared return event model with stable sync IDs.
- Replay returns through the outbox with idempotent Firestore transactions.
- Restore original batch stock on return using the original sold batch when available.
- Mirror return events back into Dexie on all devices.
- Persist sale-level return totals / metadata so Bills and reports can show return state consistently.
- Acceptance:
  - A return created on device A updates stock, customer balance, and bill state on device B.
  - Replaying the same queued return twice does not double-credit stock or customer balance.

### Phase 2: Product And Customer Mutation Reliability

- Move product upsert and stock adjustment flows onto the retryable outbox.
- Move customer create/edit and credit approval/request state changes onto the retryable outbox.
- Sync audit events or replace local-only audit usage with shared business events where needed.
- Acceptance:
  - Product edits, stock adjustments, customer edits, and credit approval state changes survive offline retry and appear on all devices.

### Phase 3: Vendors + GRN / Receive Stock

- Add shared sync IDs for vendors, GRNs, and received batches.
- Queue vendor CRUD through the outbox.
- Replace Receive Stock fire-and-forget sync with a single idempotent GRN event replay.
- Ensure GRN replay updates:
  - `grns`
  - `batches`
  - product stock totals
  - vendor linkage / invoice metadata
- Add Firestore listeners for vendors and GRNs.
- Extend migration to backfill existing vendors and GRNs.
- Acceptance:
  - Stock received on one device appears on another device with matching GRN history and batch inventory.

### Phase 4: RTV

- Add shared sync IDs for RTV sessions and RTV items.
- Queue RTV creation through the outbox with idempotent batch/product decrements.
- Mirror RTV docs/items back into Dexie on all devices.
- Extend migration to backfill existing RTVs.
- Acceptance:
  - RTV actions update inventory and RTV reports consistently across devices.

### Phase 5: Attendance / Leave / External Staff

- Add sync IDs for attendance logs, leave requests, and external staff.
- Queue attendance clock-in/out and manual attendance edits.
- Queue leave submit / approve / reject and keep derived attendance rows consistent.
- Queue external staff create/edit/toggle actions.
- Add listeners for all attendance collections.
- Extend migration to backfill attendance, leave, and external staff.
- Acceptance:
  - Attendance board, leave requests, and external staff match across devices without manual reload tricks.

### Phase 6: Shared Store Settings

- Replace localStorage-only `storeConfig` with shared app settings mirrored locally.
- Keep safe fallback to client build defaults when shared settings do not exist yet.
- Migrate existing per-device overrides into shared settings with admin-only editing.
- Acceptance:
  - Receipt/store details and sheets export config are consistent across devices.

### Phase 7: Users / Employee Auth

- Keep employee metadata shared, but move PIN verifiers to a separate credential document plus device-local cache.
- Make employee CRUD retryable and listener-backed.
- Align migration behavior with the final live write path so public employee docs no longer carry credential hashes.
- Acceptance:
  - User management is consistent across devices and the routine employee listener payload no longer contains staff PIN verifiers.

### Phase 8: Report Parity And Validation

- Re-test every report tab against secondary-device data:
  - Bills
  - Sales
  - Monthly Summary
  - Top Products
  - Credit
  - GRN
  - RTV
  - Inventory
  - Vendor Summary
  - Cashier Report
  - Attendance-related exports
- Add missing derived fields or listeners needed so each tab reflects shared state.
- Add page-level refresh signals so open report and admin screens react when mirrored Dexie rows change without requiring a manual reopen.
- Acceptance:
  - Reports opened on any device show the same operational truth for the same date range.
  - Open screens update when stock, settings, customer balances, employee lists, or attendance status change on another device.

### Phase 9: Migration, Recovery, And QA

#### Phase 9A: Technical Validation — COMPLETE

- ✅ Full code-path audit for every shared entity and mutation path — see `PHASE9A_AUDIT.md`
- ✅ Two gaps found and fixed: loyalty points sync on sale; legacy session close syncId generation
- ✅ All shared entities confirmed covered: outbox write, idempotent Firestore write, listener, migration, page refresh
- ✅ Write-path trace for sale, return, session open/close, credit flows documented
- ✅ Live-drill checklist produced (Phase 9B) and release gate checklist produced (Phase 9C) in `PHASE9A_AUDIT.md`
- ✅ Remaining risks documented with code-verified vs drill-required distinction

#### Phase 9B: Live Two-Device Drills

- Run repeatable live drills for:
  - online two-device sync
  - one-device offline billing then recovery
  - idempotent retry after partial failure
  - same-day GRN + sale + return + cash-out interactions
  - customer credit approval / collection / revoke parity
  - employee, attendance, leave, and shared settings updates while pages stay open
  - fresh-device bootstrap and backfill safety
- Acceptance:
  - The same operational truth is visible on both devices without reopening pages, and recovery is exact after reconnection.

#### Phase 9C: Operational Signoff

- Record every failed or flaky scenario found during live drills.
- Close any remaining field issues before calling the rollout complete.
- Capture a final production-readiness checklist with pass/fail status by module.
- Acceptance:
  - The app can honestly be called a fully multi-device store system for the agreed operating model: online shared use, and one billing device allowed during outages.

## Execution Order

1. Return flow
2. Product/customer mutation reliability
3. Vendors + GRN
4. RTV
5. Shared store settings
6. Attendance / leave / external staff
7. Users / employee auth
8. Report parity
9. Migration + QA hardening

## Current Remaining Work

What is left now is validation, not an identified missing architecture pass:

- I can complete Phase 9A myself.
- I can drive most of Phase 9B, but it still depends on running real two-device drills against the live app state.
- The app should not be described as "picture perfect" until Phase 9C is passed and documented.

This order prioritizes live financial correctness first, then inventory intake, then staff/admin modules.
