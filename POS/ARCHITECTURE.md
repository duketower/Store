# POS Architecture

## Product Summary

`POS/` contains the browser-based grocery store POS application.

## Main Layers

### UI Layer

- React pages and components under `src/pages/` and `src/components/`
- Authenticated shell handled by `components/layout/AppShell.tsx`

### State Layer

- Zustand stores under `src/stores/`
- Session state is runtime-only, not persisted as login state
- `src/stores/firestoreDataStore.ts` — central in-memory state store holding all live entity arrays, populated by Firestore `onSnapshot` listeners

### Data Layer

- **Firestore is the single source of truth** — Dexie/IndexedDB removed entirely
- `src/db/queries/` — domain-specific query modules (products, sales, customers, etc.) that read from `firestoreDataStore.getState()` and write via `syncXToFirestore()` functions
- Sales embed `items[]` and `payments[]` directly; RTV sessions embed `items[]` — no separate table joins needed
- Employee PIN hashes live in a dedicated Firestore credential document, fetched on login
- Performance targets and store settings are stored and read from Firestore

### Service Layer

- Firebase integration under `src/services/firebase/`
  - `sync.ts` — all write paths (syncSaleToFirestore, syncBatchToFirestore, etc.)
  - `queries.ts` — real-time subscriptions (shift report, dashboard metrics)
  - `errorLogger.ts` — uncaught error reporting
- Printer integration under `src/services/printer/`
- Scale integration under `src/services/scale/`
- `src/services/sheetsExport.ts` — post-shift Google Sheets export (fire-and-forget)
- Outbox/retry pattern removed — writes go directly to Firestore; internet required for all writes

## Build Model

- Local dev build runs from `POS/`
- Per-client config and deployment scripts live in `POS/platform/`
- `vite.config.ts` reads client config at build time from `POS/platform/clients/`

## Key Constraints

- Internet required for all writes — no offline billing fallback
- Single-store operation within the app itself
- Multi-client distribution handled at build time, not runtime tenancy
- Hardware support must stay isolated in services
- Live client changes should be deployed through `POS/platform` after implementation, not left local-only by default
