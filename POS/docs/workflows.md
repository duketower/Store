# POS Workflows

## Local Development

1. Run the app from `POS/`
2. Work against the default dev configuration
3. Validate changed flows before moving to client builds
4. If the task changes live app behavior, deploy the affected client before closing the work

## Client Build Workflow

1. Enter `POS/platform/`
2. Validate a client with `npm run client:validate -- <client-id>`
3. Build and deploy a client with `npm run client:build -- <client-id>`
4. Build and deploy all active clients with `npm run client:build-all`

## Main Store Release Workflow

1. Make and verify the change locally from `POS/`
2. Deploy the main store with `cd POS/platform && npm run client:build -- zero-one`
3. Verify `https://pos.binaryventures.in` returns the new build
4. Mention the deploy result in the task summary

## Store Operations Workflow

1. User signs in according to role
2. Billing and stock actions write locally first
3. When online, shared sales, cash, credit, stock, and shift updates flush through Firestore and hydrate back into Dexie on every device
4. When offline, one active billing device may continue and the pending sync queue in Settings shows what still needs replay
5. Reports and operational views should prefer the Firestore-hydrated Dexie state instead of device-only local history
6. Optional sync/export layers run through services
