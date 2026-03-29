# POS Task Queue

## Current

- Keep POS and `POS/platform/` docs in sync
- Keep the dashboard target/profit docs aligned with the live app behavior
- Keep the multi-device hardening work focused on store-critical data before secondary modules
- Use `MULTI_DEVICE_ROADMAP.md` as the source of truth for the remaining full-store sync rollout

## Next

- Run Phase 9B live two-device validation drills — full checklist in `PHASE9A_AUDIT.md`:
  - Online sync: billing, GRN, returns, cash-out, sessions, settings, attendance, users
  - Offline recovery: create bills offline → reconnect → verify convergence and no duplicates
  - Idempotency: verify no double-sync effects after retry
  - Fresh-device bootstrap: new browser profile hydrates without migration
  - Migration drill: run on older-history device, confirm all 19 stages and listener hydration
- Record and close any Phase 9B failures before Phase 9C operational signoff

## Done

- Completed Phase 9A: full code-path audit for all shared entities, fixed loyalty points sync gap and legacy session close syncId gap, produced PHASE9A_AUDIT.md with entity matrix, write-path traces, live-drill checklist, and Phase 9C release gate



- Moved multi-client build tooling into `POS/platform/`
- Added project-level planning and architecture docs
- Fixed the current TypeScript build blockers in billing/report code
- Added a startup loading screen for the POS boot flow
- Switched the main store custom domain target to `pos.binaryventures.in`
- Added shared dashboard targets, shared expense sync, and profit/break-even tracking
- Added month selection to the dashboard month-performance block
- Added a clear default rule to deploy the main-store client after app changes
- Added a visible pending-sync queue and idempotent replay path for core live-store sync events
- Added a dedicated roadmap for full multi-device coverage across every POS module
- Synced RTV creation across devices
- Added shared store settings backed by Firestore + Dexie mirror
- Added retryable multi-device sync for attendance logs, leave requests, external staff, and employee provisioning
- Added migration coverage for sales history, returns, credit ledger, sessions, cash entries, attendance, leave, and shared settings
- Added an admin utility script to reset all live user PINs in Firestore back to a known value
- Replaced stale count-only refresh behavior with live mirrored-state refresh across reports, attendance, customers, users, settings, dashboard alerts, shift/cash-out, login, and receive stock
- Replaced the old static `Local Mode` badge with a live shared-sync status indicator
- Hardened checkout and recovery correctness around bill snapshot locking, safe credit balances, GST-after-discount math, return refund math, legacy sale outbox rebuilds, and batch-allocation traceability
- Hardened final credit-limit checks, outbox concurrency/backoff, negative-stock visibility, GRN batch sync ordering, and employee password-hash stripping
- Removed return refund flooring, made return balance sync incremental, tightened pending-sync counts, replaced shift close with a shared Firestore-backed shift report, and moved employee PIN hashes into a device-cached credential flow
- Hardened `POS/platform/` build and deploy scripts to avoid shell-string execution and reject unsafe Firebase CLI token values in client deploy config
