# Grocery Store POS

Browser-based grocery store point-of-sale application built for online shared-store operation, queued outage recovery, and white-label client deployments.

## Current Main-Store Setup

- Main live store app: `https://pos.binaryventures.in`
- Firebase Hosting target: `zero-one-bv`
- Main-store client id: `zero-one`

## Recent Dashboard Capabilities

- Shared monthly sales target and monthly break-even target
- Responsive dashboard cards for `Today` and selected `Month`
- Gross profit and net profit tracking
- Shared expense sync for multi-device profit visibility
- Pending sync queue in Settings for outage recovery visibility
- Sales, cash-out, credit-ledger, and shift-session data now replay through the sync outbox and hydrate back into local Dexie from Firestore
- Shared store settings now keep receipts, QR details, and Sheets export URLs aligned across devices
- Attendance, leave requests, external staff, and employee PIN provisioning now sync through the same Firestore-backed replay path
- Report and admin screens now reload mirrored shared data even when another device changes existing records without changing table counts
- The header sync badge now reflects real shared-sync health instead of the old static `Local Mode` label

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Dexie.js
- Zustand
- React Router
- Firebase for shared sync/auth flows

## Run Locally

```bash
cd POS
npm install
npm run dev
```

## Multi-Client Platform

Client build and deployment tooling lives in `POS/platform/`.

Useful commands:

```bash
cd POS/platform
npm run client:validate -- <client-id>
npm run client:build -- <client-id>
npm run client:build-all
```

Default main-store deploy after app changes:

```bash
cd POS/platform
npm run client:build -- zero-one
```

## Admin Utility

Reset every current Firestore user PIN back to `1234`:

```bash
cd POS
node scripts/reset-all-user-pins.mjs 1234
```

## Key Docs

- `CLAUDE.md`
- `ARCHITECTURE.md`
- `PROJECT_PLAN.md`
- `TASK_QUEUE.md`
- `MULTI_DEVICE_ROADMAP.md`
- `DECISIONS.md`
- `docs/POS_BLUEPRINT.md`
- `docs/product_spec.md`
- `docs/api_design.md`
- `docs/workflows.md`
