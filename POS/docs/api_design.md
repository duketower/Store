# POS Integration Design

## Internal Boundaries

- UI consumes domain logic through stores, hooks, queries, and services
- Database access is routed through Dexie modules in `src/db/`
- Hardware access is routed through dedicated service modules

## External Integrations

### Firebase

- Used for selected auth and sync flows
- Client-specific credentials are injected at build time

### Printer

- ESC/POS over WebUSB with browser fallback printing

### Scale

- Weight reading over WebSerial

## Client Build Inputs

- `POS/platform/clients/client-<id>/.env`
- `POS/platform/clients/client-<id>/client.config.json`
- `POS/platform/clients/client-<id>/deploy.config.json`

## Deployment Output

- Built assets written to `POS/platform/deployments/client-<id>/dist/`
