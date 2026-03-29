# Store POS Platform

This folder contains the multi-client build and deployment tooling for the POS application in [`POS/`](../).

## Workspace Layout

```text
Store/
├── POS/
│   ├── src/                     # POS web app source
│   ├── platform/                # This folder
│   └── docs/                    # Plans and blueprints
├── Websites/
│   └── binaryventures.in/       # Company website
└── Bots/
    └── store-expense-bot/       # Telegram expense bot
```

## What Is Inside `POS/platform/`

```text
POS/platform/
├── clients/                     # Per-client config and assets
├── deployments/                 # Generated client builds
├── scripts/                     # Build and deployment scripts
├── package.json                 # Tooling commands
└── README.md
```

## Commands

Run these from `POS/platform/`:

```bash
npm run client:new -- <client-id>
npm run client:validate -- <client-id>
npm run client:build -- <client-id>
npm run client:build-all
```

The platform scripts now execute `npm` and `firebase` with argument arrays instead of shell-built command strings, and `deploy.config.json` rejects unsafe CLI token characters for `firebaseProjectId` and `hostingTarget`.

## Important Paths

- Client config: `POS/platform/clients/client-<id>/client.config.json`
- Client env: `POS/platform/clients/client-<id>/.env`
- Client deploy config: `POS/platform/clients/client-<id>/deploy.config.json`
- Client logo: `POS/platform/clients/client-<id>/assets/logo.png`
- Build output: `POS/platform/deployments/client-<id>/dist/`

## Typical Workflow

1. Run the app locally from `POS/` with `npm run dev`
2. When ready, go to `POS/platform/`
3. Build one client with `npm run client:build -- <client-id>` or all clients with `npm run client:build-all`
