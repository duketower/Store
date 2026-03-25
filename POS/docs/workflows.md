# POS Workflows

## Local Development

1. Run the app from `POS/`
2. Work against the default dev configuration
3. Validate changed flows before moving to client builds

## Client Build Workflow

1. Enter `POS/platform/`
2. Validate a client with `npm run client:validate -- <client-id>`
3. Build a client with `npm run client:build -- <client-id>`
4. Build all active clients with `npm run client:build-all`

## Store Operations Workflow

1. User signs in according to role
2. Billing and stock actions write locally first
3. Reports and operational views read from local IndexedDB data
4. Optional sync/export layers run through services
