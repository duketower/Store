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

### Service Layer

- Firebase integration under `src/services/firebase/`
- Printer integration under `src/services/printer/`
- Scale integration under `src/services/scale/`
- Sync/export helpers under `src/services/sync/`

## Build Model

- Local dev build runs from `POS/`
- Per-client config and deployment scripts live in `POS/platform/`
- `vite.config.ts` reads client config at build time from `POS/platform/clients/`

## Key Constraints

- Offline-first after first load
- Single-store operation within the app itself
- Multi-client distribution handled at build time, not runtime tenancy
- Hardware support must stay isolated in services
