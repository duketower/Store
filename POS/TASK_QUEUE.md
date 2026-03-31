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

## Migration: Firestore-only architecture

### Phase 0 — Baseline (COMPLETE)
- [x] Repo scanned
- [x] Existing errors recorded: **0 TypeScript errors at baseline**
- [x] Dexie usage mapped: 51 files import from `@/db`; 22 `useLiveQuery` callsites; 17 `db/queries/*` files; schema v14, 23 tables
- [x] Firestore usage mapped: 18 `onSnapshot` listeners (`firestoreListener.ts`); dashboard + shift subscriptions (`queries.ts`); all sync fns (`sync.ts`)
- [x] Sync/outbox usage mapped: `outbox.ts` (549 lines), 20 files reference outbox

### Phase 1 — Impact Audit (COMPLETE)

#### Files to REMOVE
| File | Reason |
|------|--------|
| `src/db/schema.ts` | Dexie schema definition (14 schema versions) |
| `src/db/index.ts` | Dexie singleton export |
| `src/db/seed.ts` | Dexie seed/boot logic |
| `src/db/queries/*.ts` (17 files) | All Dexie query helpers |
| `src/services/sync/outbox.ts` | Outbox flush/retry — no longer needed |
| `src/services/sync/firestoreListener.ts` | Firestore→Dexie replication layer |
| `src/services/sync/migration.ts` | One-time Dexie→Firestore migration tool |

#### Files to REFACTOR
| File | Change |
|------|--------|
| `src/stores/firestoreDataStore.ts` | **NEW** — Zustand store for all live entity state |
| `src/services/sync/firestoreListeners.ts` | **NEW** — replaces `firestoreListener.ts`, writes to dataStore instead of Dexie |
| `src/main.tsx` | Remove `seedDatabase`, old listeners, `flushOutbox`; start new listeners |
| `src/auth/authService.ts` | Remove Dexie credential cache; fetch from Firestore directly |
| `src/auth/LoginScreen.tsx` | Replace `useLiveQuery → getActiveEmployees` with `useDataStore` |
| `src/components/layout/Header.tsx` | Remove outbox sync badge |
| `src/hooks/useShiftSession.ts` | Replace Dexie `getOpenSession` with dataStore read |
| `src/pages/billing/*` | Replace Dexie 8-table transaction with Firestore transaction; remove outbox entry |
| `src/pages/attendance/AttendancePage.tsx` | Remove `useLiveQuery` syncKey; reads from dataStore |
| `src/pages/customers/CustomersPage.tsx` | Remove `useLiveQuery` syncKey; writes go to Firestore |
| `src/pages/dashboard/DashboardPage.tsx` | Replace Dexie inventory alerts with dataStore reads |
| `src/pages/inventory/CashOutPage.tsx` | Replace `useLiveQuery` with dataStore |
| `src/pages/inventory/ReceiveStockPage.tsx` | Replace `useLiveQuery` vendors with dataStore |
| `src/pages/inventory/ShiftClosePage.tsx` | Remove local Dexie fallback; Firestore report only |
| `src/pages/reports/ReportsPage.tsx` | Remove `useLiveQuery` syncKey |
| `src/pages/reports/tabs/*.tsx` (13 tabs) | Replace all `db.*` reads with dataStore / Firestore queries |
| `src/pages/settings/SettingsPage.tsx` | Replace `useLiveQuery` with dataStore; remove outbox panel |
| `src/pages/users/UsersPage.tsx` | Replace `useLiveQuery` employees with dataStore |

#### Behavior changes (explicit)
- **Offline billing removed** — internet required for all writes
- No pending-sync outbox badge in header
- Fresh device loads all data from Firestore subscriptions (no seed needed)
- `EmployeeCredentialUnavailableError` becomes a hard "no internet" error (no local cache)

### Phase 2 — Migration Plan (COMPLETE)

#### Implementation slices (ordered)
1. [x] **S1** Create `src/stores/firestoreDataStore.ts` — Zustand store with typed state for all entities
2. [x] **S2** Create `src/services/sync/firestoreListeners.ts` — writes to dataStore instead of Dexie
3. [x] **S3** Update `src/main.tsx` — swap boot sequence
4. [x] **S4** Migrate auth: `authService.ts` + `LoginScreen.tsx` (remove Dexie, use dataStore)
5. [x] **S5** Migrate `Header.tsx` — remove outbox badge
6. [x] **S6** Migrate `useShiftSession.ts` + `CashOutPage.tsx` — replace Dexie session reads
7. [x] **S7** Migrate billing write path — replace Dexie transaction with Firestore transaction
8. [x] **S8** Migrate inventory pages: `ReceiveStockPage`, `ShiftClosePage`
9. [x] **S9** Migrate customers: reads + writes
10. [x] **S10** Migrate reports: `ReportsPage` + all 13 tabs
11. [x] **S11** Migrate settings reads/writes
12. [x] **S12** Migrate users/employees reads/writes
13. [x] **S13** Migrate attendance reads/writes
14. [x] **S14** Typecheck — fix all errors before next step
15. [x] **S15** Remove `src/db/schema.ts`, `src/db/index.ts`, `src/db/seed.ts`
16. [x] **S16** Remove `src/services/sync/` directory + dead Dexie imports
17. [x] **S17** Final typecheck + build — clean

### Phase 3 — Implementation progress (COMPLETE)

#### Validation
- [x] Typecheck passes (0 errors)
- [x] Build passes
- [x] Deployed to zero-one client

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
- Replaced low-value Sonar hotspot patterns in seeded POS randomness, sync ID fallbacks, external font loading, and git commit lookup without changing store workflows
