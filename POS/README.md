# Grocery Store POS

Offline-first grocery store point-of-sale application built for browser-based operation and white-label client deployments.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Dexie.js
- Zustand
- React Router
- Firebase for selected sync/auth flows

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

## Key Docs

- `CLAUDE.md`
- `ARCHITECTURE.md`
- `PROJECT_PLAN.md`
- `TASK_QUEUE.md`
- `DECISIONS.md`
- `docs/POS_BLUEPRINT.md`
- `docs/product_spec.md`
- `docs/api_design.md`
- `docs/workflows.md`
