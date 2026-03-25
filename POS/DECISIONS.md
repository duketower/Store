# POS Decisions

## Decision 001

Use Dexie/IndexedDB for primary local data storage.

Reason:
- Enables browser-native offline workflows
- Fits the offline-first store environment

## Decision 002

Keep session/auth runtime state in Zustand memory rather than persistent storage.

Reason:
- Reduces stale session issues
- Keeps logout/page-close behavior predictable

## Decision 003

Handle multi-client delivery at build time using `POS/platform/`.

Reason:
- One shared codebase can serve many client builds
- Avoids runtime multi-tenant complexity in the app

## Decision 004

Keep hardware logic in service modules, not utilities.

Reason:
- WebUSB and WebSerial integrations are side-effectful and deserve clear boundaries
