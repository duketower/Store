# POS Task Queue

## Current

- Keep POS and `POS/platform/` docs in sync
- Keep the dashboard target/profit docs aligned with the live app behavior
- Keep the multi-device hardening work focused on store-critical data before secondary modules
- Use `MULTI_DEVICE_ROADMAP.md` as the source of truth for the remaining full-store sync rollout

## Next

- Run a full two-device live validation pass against billing, receive stock, returns, cash-out, reports, settings, users, attendance, and dashboard refresh behavior
- Validate migration/backfill on a device with older local-only history before calling the remaining modules production-safe
- Document any field issues found during the live two-device drill and close them before calling the app perfect for store operations

## Done

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
