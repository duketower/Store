# POS — Claude Code Project Instructions

This is a Grocery Store POS web app with queued outage handling for store-critical sync.
Stack: React + TypeScript + Vite + Tailwind + Dexie.js + Zustand + React Router.
Original Phase 1 started as a pure frontend MVP, but the live store target is now:
- online-first shared store state across devices
- billing must continue on one billing device during outages
- pending updates must replay cleanly when internet returns
- staff login, store settings, and attendance must converge across devices too

Reference docs:
- `README.md`
- `ARCHITECTURE.md`
- `PROJECT_PLAN.md`
- `TASK_QUEUE.md`
- `DECISIONS.md`
- `docs/POS_BLUEPRINT.md`
- `docs/product_spec.md`
- `docs/api_design.md`
- `docs/workflows.md`

Repo Git rules:
- The repo pre-commit hook enforces doc sync and small commit batches
- The repo commit-msg hook enforces clear commit messages

Documentation sync rule:
- Before finishing any non-trivial task, update the affected docs in this folder if behavior, setup, structure, workflow, roadmap, or decisions changed
- `README.md` = setup, run, build, layout
- `ARCHITECTURE.md` = structure, boundaries, data flow
- `PROJECT_PLAN.md` = roadmap and priorities
- `TASK_QUEUE.md` = current, next, done
- `DECISIONS.md` = durable technical choices
- `docs/*` = product behavior, integrations, workflows
- If no docs changed, say so explicitly in the final summary

Deployment rule:
- After changing live POS app behavior, deploy the affected client by default unless the user explicitly says not to deploy
- For the main Binary Ventures store, use `cd POS/platform && npm run client:build -- zero-one`
- Include deployment verification in the final summary when a deploy was run

---

## Application Layout

```
main.tsx           → seed DB + mount React app
App.tsx            → providers (router host) — no UI logic here
routes/index.tsx   → all route definitions
auth/LoginScreen   → public, no shell
components/layout/AppShell.tsx → authenticated layout wrapper (Sidebar + Header + Outlet)
pages/**           → page components rendered inside AppShell
```

`AppShell` owns the authenticated shell. Pages never include their own sidebar or header.

---

## Project Structure Rules

```
src/
├── auth/           ← LoginScreen.tsx, authService.ts, permissions.ts (UI + service + permissions)
├── stores/         ← ALL Zustand stores: authStore.ts, cartStore.ts, uiStore.ts, sessionStore.ts
│                      authStore.ts lives HERE ONLY — never duplicate it in auth/
├── db/
│   ├── schema.ts   ← Dexie store definitions ONLY; imports interfaces from src/types/
│   ├── index.ts    ← DB init and export
│   ├── seed.ts     ← Idempotent seed (check before insert)
│   └── queries/    ← products.ts, customers.ts, sales.ts, batches.ts, daySessions.ts
├── routes/         ← index.tsx (all routes), ProtectedRoute.tsx (role guard)
├── pages/
│   ├── billing/    ← BillingPage.tsx + components/
│   ├── inventory/  ← ReceiveStockPage.tsx, ProductsPage.tsx, ShiftClosePage.tsx
│   │                  ShiftClosePage MUST live here — never as a loose page in pages/
│   ├── customers/  ← CustomersPage.tsx + components/
│   ├── reports/    ← ReportsPage.tsx + components/
│   ├── users/      ← UsersPage.tsx + components/ (admin only)
│   └── settings/   ← SettingsPage.tsx + components/ (admin only)
├── components/
│   ├── layout/     ← AppShell.tsx, Sidebar.tsx, Header.tsx, PageContainer.tsx
│   ├── common/     ← Button.tsx, Input.tsx, Modal.tsx, EmptyState.tsx, Loader.tsx
│   └── feedback/   ← ErrorBanner.tsx, Toast.tsx
├── services/       ← Hardware integrations and sync (NOT utils)
│   ├── printer/    ← printer.ts, escpos.ts, printTemplates.ts
│   ├── scale/      ← scale.ts, parsers.ts
│   └── sync/       ← outbox.ts (Phase 2 backend sync flush)
├── utils/          ← Pure helpers ONLY (no hardware, no state, no side effects)
│   └── gst.ts, billNumber.ts, fefo.ts, currency.ts, date.ts, validation.ts, cn.ts
├── hooks/          ← useAuth.ts, useBarcodeScanner.ts, useShiftSession.ts, usePrinter.ts
├── constants/      ← roles.ts, routes.ts, gst.ts, app.ts
├── types/          ← auth.ts, product.ts, customer.ts, sale.ts, inventory.ts, index.ts
│                      ALL shared interfaces live here — schema.ts imports from here
└── styles/         ← globals.css
```

---

## Critical Anti-Patterns — Never Do These

- **DO NOT** put `authStore.ts` in `src/auth/`. It lives in `src/stores/` only.
- **DO NOT** put `ShiftClosePage.tsx` as a loose file in `src/pages/`. It goes in `src/pages/inventory/`.
- **DO NOT** put printer or scale files in `src/utils/`. They are hardware services → `src/services/`.
- **DO NOT** create a monolithic `db.ts`. Split into schema / index / seed / queries/*.
- **DO NOT** define TypeScript interfaces inside `db/schema.ts`. Interfaces live in `src/types/`.
- **DO NOT** define page-local business interfaces if a shared type exists in `src/types/`. If a type is used in more than one file, it belongs in `src/types/`.
- **DO NOT** store auth session in localStorage or IndexedDB. Auth session is Zustand memory only — cleared on page close/logout.
- **DO NOT** use `any` types. Define proper TypeScript interfaces in `src/types/`.
- **DO NOT** include DRAWER_KICK or cash drawer logic — this POS has no electronic cash drawer.
- **DO NOT** add multi-store logic of any kind: no branch sync, no warehouse transfers, no store selector, no multi-tenant config. Phase 1 = single physical store only.
- **DO NOT** put shell logic (sidebar, header, navigation) inside page components.

---

## Naming Conventions

- **Components**: PascalCase (`BillingPage.tsx`, `ProductSearch.tsx`)
- **Hooks**: camelCase with `use` prefix (`useBarcodeScanner.ts`)
- **Stores**: camelCase with `Store` suffix (`cartStore.ts`)
- **Utils**: camelCase, verb-noun (`formatCurrency`, `calcGst`)
- **DB queries**: camelCase, descriptive (`getProductByBarcode`, `createSaleTransaction`)
- **Constants**: UPPER_SNAKE_CASE for values, camelCase for exported objects

---

## Database Rules

### IndexedDB stores (defined in `db/schema.ts`):
```
employees, products, batches, customers,
sales, sale_items, payments, credit_ledger,
day_sessions, outbox, audit_log, vendors,
grns, rtvs, rtv_items, staff_external,
attendance_logs, leave_requests, cash_entries,
expenses, performance_targets, store_settings,
sale_returns, employee_credentials
```
Auth sessions are **not** stored in IndexedDB — they live in Zustand memory only.

- DB initialized once in `db/index.ts` and exported as a singleton
- `seed.ts` MUST be idempotent — check if records exist before inserting
- Employee seed: uses `CLIENT_CONFIG.staff` if present (client builds); falls back to dev defaults (Anurag/Vaibhav/Samad) when absent
- Default client staff PIN: all seeded users start at `1234` unless the live Firestore utility resets them differently
- Products + customers are always seeded with demo data (8 products, 2 customers)
- All sale writes use Dexie transactions (atomic): sale + items + payments + stock deduction + outbox
- `schema.ts` imports type interfaces from `src/types/` — it does not define them

### Query file rules:
- Each query file is focused on one domain (products, customers, sales, etc.)
- Avoid circular imports across query files
- If shared DB logic is needed in multiple query files, extract it into a common helper module
- `daySessions.ts` handles shift open/close — not auth sessions

---

## Auth & RBAC

- All staff roles currently log in through the card grid + 4-digit PIN pad.
- Employee PIN hashes are shared so staff provisioning works across devices.
- Session in Zustand memory only.
- Auto-logout: 8h for cashier, 12h for admin/manager.
- `ProtectedRoute.tsx` guards all routes — unauthenticated → `/login`; wrong role → `/billing`.
- `permissions.ts` exports `canAccess(role: Role, feature: Feature): boolean`.

### Role Access
| Feature | Admin | Manager | Cashier |
|---------|:-----:|:-------:|:-------:|
| Billing, GRN, Customers (lookup), Products (search) | ✅ | ✅ | ✅ |
| Product pricing/edit, Purchase Orders, Reports, Stock adjustments | ✅ | ✅ | ❌ |
| User management, System settings | ✅ | ❌ | ❌ |

---

## GST Rules

- Default: **tax-inclusive** (MRP already includes GST)
- Tax-inclusive formula: `taxAmount = price - (price / (1 + taxRate/100))`
- CGST = SGST = `taxRate / 2` (intra-state)
- Receipt must show CGST + SGST split per item and totals by slab
- HSN code stored per product

---

## Inventory Rules

- **FEFO** (First-Expired-First-Out): sort batches by `expiryDate ASC`, deduct earliest first
- **Multi-unit**: `baseUnit` (e.g. "50kg sack") + `baseQty` conversion factor for retail units
- Low-stock alert: `stock <= reorderLevel` — show badge in sidebar
- Near-expiry alert: batches expiring within 30 days (configurable) — show on dashboard

---

## Hardware Integration

### Barcode Scanner (USB HID)
- Appears as keyboard — rapid keystrokes (< 50ms gap) ending in Enter
- Hidden input always focused on billing page captures scans
- Hook: `useBarcodeScanner.ts`

### Receipt Printer (WebUSB + ESC/POS)
- `printer.ts`: `connectPrinter()` via `navigator.usb.requestDevice()`
- `escpos.ts`: INIT, BOLD_ON/OFF, LINE_FEED, ALIGN, CUT commands
- **NO DRAWER_KICK** — this POS has no electronic cash drawer
- Phase 1 fallback: `window.print()` with `@media print` CSS for 80mm thermal width

### Weighing Scale (WebSerial)
- `scale.ts`: `connectScale()` via `navigator.serial.requestPort()`
- `parsers.ts`: parse RS232 weight string → stable numeric kg value
- When `soldByWeight=true`, billing page auto-reads scale weight into qty field

---

## Sync Rules

- Service Worker registered via `vite-plugin-pwa` (Workbox)
- Every sale: write to IndexedDB first → deduct stock → add outbox entry → UI completes
- Outbox table stores pending business events for replay to Firestore
- Shared settings, attendance, leave, external staff, employees, sessions, cash entries, vendors, GRNs, and RTVs follow the same replay model
- Core multi-device screens must read from Firestore-hydrated Dexie data, not device-only local history
- If the internet is down, only one billing device should continue checkout until connectivity returns
- Sync queue visibility matters: keep pending/failed updates inspectable in the UI for store operators

---

## Edit Discipline — Follow This Before Every Code Change

Before touching any file:

1. **Identify the owner file** — which single file is responsible for the broken behavior?
2. **Read only that file + its direct dependencies** — do not explore the whole codebase
3. **State the root cause in one sentence** before writing any code
4. **Make the smallest fix** that addresses the root cause — do not refactor surrounding code
5. **Verify only the affected flow** — check the one thing you changed works
6. **Stop after success** — do not clean up, rename, or improve adjacent code unless asked

This prevents cascading edits, token waste, and introduces regressions from unrelated changes.

---

## Debugging Protocol

1. Check browser console for errors first
2. Check IndexedDB state: DevTools → Application → IndexedDB → `pos-db`
3. For auth/cart issues: inspect Zustand store via Redux DevTools extension (devtools middleware is configured on `authStore` and `cartStore`)
4. For service worker issues: DevTools → Application → Service Workers → check active status / skip waiting

---

## Commit Style

```
feat: add FEFO batch deduction on sale complete
fix: correct CGST/SGST split for 12% slab
refactor: split db.ts into schema/index/seed/queries
```

---

## Multi-Client Distribution Rules

This POS is sold to multiple clients. Each client gets their own build with their config baked in.
The architecture: one codebase → per-client build → client gets a minified bundle (no source access).

**Config rules:**
- Never hardcode store name, GSTIN, UPI ID, phone, Firebase project ID, logo path, or plan in app code.
- All client-specific values come from `CLIENT_CONFIG` in `@/constants/clientConfig`.
- In dev mode (no `CLIENT` env var), `CLIENT_CONFIG` falls back to `STORE_CONFIG` defaults — dev workflow unchanged.

**Feature gating rules:**
- Never check `CLIENT_CONFIG.plan === 'pro'` directly in UI. Always use `hasFeature(CLIENT_CONFIG.plan, 'feature')`.
- Never add a new plan-gated feature without first updating `PlanFeature` union type in `src/types/clientConfig.ts`
  AND `PLAN_FEATURES` matrix in `src/constants/features.ts`.
- Any route restricted to a plan tier must use `ProtectedFeatureRoute` in `routes/index.tsx` — nav hiding alone is not enough.

**Build rules:**
- Never import from `platform/clients/` inside `src/`. Only `vite.config.ts` may read client build files.
- Never bake admin secrets, service account keys, or private automation credentials into client bundles.
- `__CLIENT_CONFIG__` and `__APP_BUILD__` are compile-time constants — they must be serialisable (JSON-safe).

**Git / secret hygiene — CRITICAL:**
- `platform/clients/*/.env` and `platform/clients/*/client.config.json` are gitignored — NEVER stage or commit them.
- `client.config.json` contains plaintext `servicePassword` and other store secrets — treat as sensitive as `.env`.
- Before any `git add` in the repo root, verify no `platform/clients/` files are being staged.
- If a secret is accidentally committed: remove with `git rm --cached`, update `.gitignore`, rotate the credential immediately.

**Dev mode fallback must always work:**
- Do not break the existing localStorage settings override behaviour in `storeConfig.ts`.
- The app must work identically in dev (no CLIENT) and in client builds.

**File locations for the multi-client system:**
- `src/types/clientConfig.ts` — ClientConfig + AppBuild types, PlanTier, PlanFeature
- `src/constants/clientConfig.ts` — CLIENT_CONFIG reader + dev fallback
- `src/constants/features.ts` — plan feature matrix + hasFeature() + isLicenseExpired()
- `src/components/common/ProtectedFeatureRoute.tsx` — route-level plan guard
- `src/components/common/ExpiredLicenseScreen.tsx` — shown when license is expired
