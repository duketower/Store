# POS Multi-Device Roadmap

## Goal

Make every operational module in `POS/` behave as a shared store system across devices.

Target operating model:
- While online, all business-critical state is shared across devices in near real time.
- If the internet drops, one billing device may continue working locally.
- When connectivity returns, queued updates replay exactly once and all devices converge.
- Non-billing devices must not silently diverge from the live store state.

Current rollout status:
- Phase 1 is now in progress in code: sale returns have a shared event model, retryable outbox replay, and bill-level remaining-qty protection.
- Phase 2 is now in progress in code: product edits, stock adjustments, customer edits, and credit approval-state changes use the retryable sync path.
- Phase 3 has started in code: vendor sync and GRN replay/listener plumbing are now present, but the wider intake module still needs full validation.
- Phase 4 has started in code: RTV creation now follows the same replay/listener approach, but secondary-device validation is still required.
- Phase 5 is now in progress in code: attendance logs, leave requests, and external staff use sync-backed writes/listeners, but live secondary-device validation is still required.
- Phase 6 is now in progress in code: store settings are shared through `app_settings/store_details` with a Dexie mirror and local cache bridge for receipt code.
- Phase 7 is now in progress in code: employee provisioning now replays through the outbox and migration keeps PIN hashes in sync, but the live auth path still needs multi-device validation.
- The remaining roadmap phases are still required before the whole app can be called fully multi-device.

## Definition Of Done

The POS is only considered fully multi-device when all of the following are true:

- Every shared business entity has a Firestore source of truth plus a Dexie mirror.
- Every write path uses either an idempotent Firestore transaction or the retryable outbox.
- Every read-heavy page can see cross-device data through listeners or Firestore-backed queries.
- No stock, credit, cash, or shift mutation can be lost when the internet drops temporarily.
- Local-only settings are either intentionally device-local or explicitly migrated to shared settings.
- Initial migration can backfill all shared modules already used in the store.

## Coverage Audit

| Module | Current State | Main Gaps |
| --- | --- | --- |
| Billing / Sales / Payments | Partial | Core sale replay exists, but returns are still local-only and bill-level return visibility is incomplete. |
| Products / Stock | Partial | Product edits and stock adjustments still bypass the retry queue in some paths. |
| Batches / FEFO | Partial | Sales now replay stock deductions, but GRN/RTV batch changes are not end-to-end queued and mirrored. |
| Customers / Credit | Partial | Credit ledger is shared, but request/approve/decline/revoke credit flags still mutate locally only. |
| Cash Out / Day Session | Mostly shared | Needs final parity checks around session lifecycle and historical reporting on secondary devices. |
| Expenses / Dashboard Targets | Shared | Keep as baseline. |
| Vendors | Local only | Vendor CRUD is Dexie-only. |
| GRNs / Receive Stock | Local only | GRN docs are local, stock receipt writes are fire-and-forget, no retryable event replay. |
| RTVs | Local only | RTV docs/items are local, stock reductions are local, no shared replay. |
| Attendance Logs | Local only | No sync IDs, no queue, no listeners. |
| Leave Requests | Local only | No sync IDs, no queue, no listeners. |
| External Staff | Local only | No shared sync or listeners. |
| Users / Employees / Auth | Partial and inconsistent | Live employee sync exists, but credential hash policy conflicts with migration and security expectations. |
| Store / Receipt Settings | Local only | `storeConfig` still uses localStorage only. |
| Reports | Partial | Many tabs rely on mirrored Dexie data, so full parity depends on finishing the missing shared entities above. |
| Migration / Backfill | Partial | Migration currently skips GRNs, RTVs, vendors, attendance, leave, cash entries, sessions, sales history hydration, and shared settings. |

## Missed Items Found In Audit

- Customer credit approval/request actions do not currently sync after local mutation.
- Manual product stock adjustment writes local stock and audit logs only.
- Returns restore local stock and customer balance only; they do not replay to Firestore.
- Store details / receipt branding / Sheets URL remain device-local via `localStorage`.
- User sync currently writes credential hashes in some live paths even though migration strips them.
- Vendor, GRN, RTV, attendance, leave, and external staff data have no retryable shared sync path.
- Audit log entries are still local-only.

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

- Decide and implement the final employee credential architecture.
- Options to resolve:
  - keep credential hashes shared and tighten Firestore access strategy
  - or keep credentials local-only and introduce a controlled user provisioning/migration flow
- Make employee CRUD retryable and listener-backed.
- Align migration behavior with the final live write path so hashes are not stripped in one path and written in another.
- Acceptance:
  - User management is consistent across devices and does not rely on contradictory security assumptions.

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
- Acceptance:
  - Reports opened on any device show the same operational truth for the same date range.

### Phase 9: Migration, Recovery, And QA

- Extend migration to all newly shared collections.
- Add queue/backfill diagnostics for pending, failed, and stale sync items by entity type.
- Add repeatable test scripts for:
  - online two-device sync
  - one-device offline billing then recovery
  - idempotent retry after partial failure
  - same-day GRN + sale + return + cash-out interactions
- Acceptance:
  - A fresh device can be brought into sync safely, and outage recovery is testable rather than manual guesswork.

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

This order prioritizes live financial correctness first, then inventory intake, then staff/admin modules.
