# POS Architecture

## Product Summary

`POS/` contains the browser-based grocery store POS application.

## Main Layers

### UI Layer

- React pages and components under `src/pages/` and `src/components/`
- Authenticated shell handled by `components/layout/AppShell.tsx`

### State Layer

- Zustand stores under `src/stores/`
- Session state is runtime-only, not persisted as login state in IndexedDB

### Data Layer

- IndexedDB via Dexie under `src/db/`
- Query logic split into domain-specific modules under `src/db/queries/`
- Sales now persist profit snapshot fields for new sales so dashboard profit does not depend only on reconstructed inventory state
- Performance targets and synced expenses are mirrored locally for multi-device dashboard accuracy
- Core live-store sync now uses an outbox of business events plus Firestore listeners that rehydrate shared sales, batches, credit ledger, cash entries, and day sessions back into Dexie
- Shared store settings now mirror Firestore into Dexie plus a local synchronous cache so receipt/print code can read the latest store details
- Attendance, leave requests, external staff, and employee provisioning now follow the same outbox + listener pattern as the core store modules
- Employee PIN verifiers are no longer mirrored in the shared employee doc; they are fetched from a separate Firestore credential document and cached locally per device when needed
- Full-store multi-device completion is tracked module-by-module in `MULTI_DEVICE_ROADMAP.md`

### Service Layer

- Firebase integration under `src/services/firebase/`
- Printer integration under `src/services/printer/`
- Scale integration under `src/services/scale/`
- Sync/export helpers under `src/services/sync/`
- Dashboard metrics combine shared Firestore sales, shared expenses, and shared targets with local fallback estimation for older sales
- Shift close now prefers a shared Firestore-backed shift report rather than a Dexie-only device-local reconciliation view
- Sync is now online-first for shared store data, with queued replay when the internet returns rather than treating every feature as permanently local-first
- Shared entity creation is moving away from device-local auto-increment assumptions toward explicit IDs carried across sync boundaries

## Build Model

- Local dev build runs from `POS/`
- Per-client config and deployment scripts live in `POS/platform/`
- `vite.config.ts` reads client config at build time from `POS/platform/clients/`

## Key Constraints

- Billing must continue during outages on one active billing device, then replay pending sync safely when the connection returns
- Single-store operation within the app itself
- Multi-client distribution handled at build time, not runtime tenancy
- Hardware support must stay isolated in services
- Live client changes should be deployed through `POS/platform` after implementation, not left local-only by default
- “Fully multi-device” means every operational module must either be shared live or intentionally remain device-local with explicit documentation
