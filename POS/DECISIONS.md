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

## Decision 005

Store performance targets as shared Firestore-backed settings and save sale-level profit snapshots for new sales.

Reason:
- Dashboard targets must stay consistent across multiple devices
- New sales need stable cost/profit values at the time of checkout
- Older sales can still fall back to best-effort estimation without breaking the dashboard

## Decision 006

Deploy the affected live client after app changes by default.

Reason:
- Prevents local-only fixes from drifting away from the live store
- Keeps `pos.binaryventures.in` aligned with the latest verified behavior
- Makes task completion status clearer for operational store changes

## Decision 007

Treat shared store data as online-first with queued replay, not pure offline-first local state.

Reason:
- The real store requirement is that billing must continue when the internet drops, but shared state should converge once connectivity returns
- A visible sync queue is safer for store operations than silent per-device divergence
- Core sales, cash, credit, and shift events need idempotent replay semantics to avoid double-sync or missed-sync errors

## Decision 008

Define “fully multi-device” at the module level and finish the rollout in tracked phases.

Reason:
- The app now has mixed sync maturity: some modules are shared, some are partial, and some are still local-only
- Store operations need a precise roadmap, not a vague “multi-device” label
- `MULTI_DEVICE_ROADMAP.md` is the canonical checklist for taking every operational module to shared-state readiness

## Decision 009

Use explicit shared IDs for new cross-device records instead of relying only on local auto-increment keys.

Reason:
- Cross-device joins such as sale ↔ return, GRN ↔ batch, and attendance ↔ staff become fragile when each device invents its own local primary keys
- Carrying an explicit ID in the shared payload makes Dexie mirrors converge on the same business record identity
- This reduces hidden “looks synced but joins wrong locally” failures

## Decision 010

Keep employee PIN hashes in the shared employee record so staff provisioning stays multi-device.

Reason:
- New or edited staff accounts must be usable on every device without per-device manual setup
- The current live app already authenticates devices into Firebase with build-scoped credentials, so shared employee records are part of the trusted store app surface
- Migration and live writes need to follow one consistent employee-auth model instead of stripping hashes in one path and syncing them in another
