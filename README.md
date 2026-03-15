# Store POS

An offline-first Grocery Store Point of Sale system, built to run in the browser with no internet required. Designed to be sold as a white-label SaaS — each grocery store client gets their own branded, isolated deployment from a single shared codebase.

---

## What's in this repo

```
Store/
├── POS/          → The web app (React + TypeScript + Vite)
├── Bot/          → Telegram bot for expense tracking → Google Sheets
├── clients/      → One folder per paying client (config + credentials)
├── scripts/      → TypeScript build & deployment scripts
└── deployments/  → Gitignored build outputs
```

---

## POS Web App

### Tech stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript + Tailwind CSS |
| State | Zustand |
| Local DB | Dexie.js (IndexedDB) |
| Routing | React Router v6 |
| Build | Vite + vite-plugin-pwa |
| Cloud sync | Firebase Firestore (real-time, multi-device) |
| Auth | Firebase anonymous auth + role-based PIN/password |
| Hardware | WebUSB (thermal printer), WebSerial (weighing scale), USB HID (barcode scanner) |

### Features

- **Billing** — barcode scanner support, GST-inclusive pricing, UPI/cash/card/credit payments
- **Inventory** — FEFO batch management, low-stock alerts, near-expiry alerts, GRN entry
- **Vendors** — vendor master, return-to-vendor (RTV)
- **Customers** — customer ledger, credit management
- **Reports** — sales, inventory, financial summaries
- **Users** — role-based access (Admin / Manager / Cashier)
- **Offline-first** — full PWA with service worker; works 100% without internet after first load
- **Receipt printer** — ESC/POS thermal printing via WebUSB
- **Weighing scale** — RS232 weight auto-fill via WebSerial

### Subscription tiers

| Plan | Price | What's included |
|------|-------|-----------------|
| **Free** | ₹0 | Billing, receipt printer, basic inventory, 1 user, no cloud sync |
| **Pro** | ₹799/mo | Everything in Free + cloud backup, multi-device, reports, customer ledger, vendor management, Sheets export, weighing scale |
| **Enterprise** | ₹1,499/mo | Everything in Pro + API webhooks, custom branding, priority support |

Plan and license expiry are baked into each client's build. Expired builds show a locked screen.

---

## Running locally (development)

```bash
cd POS
npm install
npm run dev
```

Dev mode uses the default store config (`src/constants/app.ts`). All features are unlocked. No `CLIENT` env var needed.

---

## Multi-client distribution

Every paying client gets their own independent deployment — same codebase, different config baked in at build time. Clients receive only the minified bundle; no source code is shared.

### How it works

```
One codebase (POS/src/)
    +
Per-client config (clients/client-<id>/)
    ↓  build time injection
Personalised bundle (deployments/client-<id>/dist/)
    ↓  firebase deploy
Client's hosted URL
```

Each client has their own:
- Firebase project (data isolation, their Firestore, their Hosting URL)
- Dedicated Gmail account managed by the developer
- Store branding (name, logo, theme color)
- Plan tier and license expiry date

### Onboarding a new client

**Step 1 — Set up infrastructure**
1. Create a dedicated Gmail: `clientname.pos@gmail.com`
2. Log in as that Gmail → create a Firebase project
3. Enable Firestore + Firebase Hosting in the project
4. Copy the Firebase credentials

**Step 2 — Scaffold the client folder**
```bash
npm run client:new -- krishna-mart
```

**Step 3 — Fill in the config files**

`clients/client-krishna-mart/.env`
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`clients/client-krishna-mart/client.config.json`
```json
{
  "store": {
    "name": "Krishna Mart",
    "address": "12 Gandhi Road",
    "city": "Mumbai, Maharashtra",
    "phone": "+91 98100 12345",
    "gstin": "27ABCDE1234F1Z5",
    "upiVpa": "krishnamart@upi",
    "sheetsWebAppUrl": ""
  },
  "brand": {
    "themeColor": "#16a34a",
    "appName": "Krishna POS",
    "shortName": "KrishnaPOS"
  },
  "plan": "pro",
  "clientId": "krishna-mart",
  "licenseExpiresAt": "2027-03-15"
}
```

`clients/client-krishna-mart/deploy.config.json`
```json
{
  "firebaseProjectId": "krishna-mart-xxxxx",
  "hostingTarget": "krishna-mart-xxxxx",
  "dedicatedGmail": "krishnamart.pos@gmail.com",
  "customDomain": "",
  "status": "active",
  "notes": "Onboarded 2026-03-15 | Plan: pro | Owner: Ramesh | WhatsApp: +91..."
}
```

**Step 4 — Add their logo**
```
clients/client-krishna-mart/assets/logo.png
```

**Step 5 — Build and deploy**
```bash
npm run client:build -- krishna-mart
```

This validates the config, builds the personalised bundle, and deploys to Firebase Hosting. Send the client their URL — you're done.

---

## Build scripts

| Command | What it does |
|---------|-------------|
| `npm run client:new -- <id>` | Scaffold a new client folder from the template |
| `npm run client:validate -- <id>` | Validate config/env/assets without building |
| `npm run client:build -- <id>` | Validate → build → deploy one client |
| `npm run client:build-all` | Build and deploy all active clients |

`build-all` also warns you about any licenses expiring within 30 days.

---

## Pushing updates to all clients

When you fix a bug or add a feature in `POS/src/`:

```bash
# 1. Test in dev mode as usual
cd POS && npm run dev

# 2. When ready, push to all clients
cd ..
npm run client:build-all
```

All clients receive the update automatically on next app open via PWA service worker.

---

## Cancelling a subscription

1. Edit `clients/client-<id>/client.config.json` — set `licenseExpiresAt` to today's date
2. Run `npm run client:build -- <id>`
3. The app now shows a "License Expired" screen; all data access is blocked
4. Optionally disable the Firebase project to cut off cloud sync permanently

---

## Client requirement form

When a new client enquires, share this form with them:

> **Section 1 — Store Details:** Store name, address, city, state, PIN, phone, GSTIN, UPI ID
>
> **Section 2 — Owner Contact:** Owner name, WhatsApp, personal email
>
> **Section 3 — Plan:** Free / Pro / Enterprise, billing cycle (monthly / yearly)
>
> **Section 4 — Staff Logins:** Name + role (Admin / Manager / Cashier) for each staff member
>
> **Section 5 — Branding:** App name, theme colour preference, logo (send via WhatsApp)
>
> **Section 6 — Google Sheets Sync** *(Pro+)*: Yes/No, Google account email to share the sheet with
>
> **Section 7 — Hardware:** Barcode scanner / Thermal printer / Weighing scale — have it / buying / not needed; Primary device (PC / Laptop / Tablet / Mobile)
>
> **Section 8 — Go-Live:** Target date, any deadline

---

## Project structure (POS app)

```
POS/src/
├── auth/           → LoginScreen, authService, permissions
├── stores/         → Zustand stores (auth, cart, session, ui)
├── db/             → Dexie schema, seed, query files
├── routes/         → Route definitions, ProtectedRoute, ProtectedFeatureRoute
├── pages/          → Page components (billing, inventory, reports, settings, …)
├── components/     → Layout (AppShell, Sidebar, Header) + common UI
├── services/       → Firebase sync, receipt printer, weighing scale
├── hooks/          → useAuth, useBarcodeScanner, usePrinter, useShiftSession
├── constants/      → app.ts, routes.ts, features.ts, clientConfig.ts
├── types/          → TypeScript interfaces + clientConfig types
└── utils/          → Pure helpers (currency, GST, date, FEFO, …)
```

---

## Security notes

- Client `.env` files are gitignored — never commit Firebase credentials
- Each client has an isolated Firebase project — no cross-client data access
- The developer owns all Firebase projects; clients only receive a hosted URL
- Never bake admin secrets or service account keys into client bundles
- License enforcement is build-time (baked expiry date) + optional Firebase project disable
