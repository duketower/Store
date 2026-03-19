# Firebase Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace anonymous Firebase Auth with email/password auth so only devices with valid credentials can read/write Firestore.

**Architecture:** Each client build gets a dedicated Firebase service account (email + password) baked into `CLIENT_CONFIG`. On app boot, the app signs in with those credentials instead of anonymously. Firebase SDK persists the auth session locally so the app works offline after the first sign-in. Dev mode keeps anonymous auth — no credentials needed. Firestore rules already require `request.auth != null` and need no changes.

**Tech Stack:** Firebase Auth (email/password), `ClientConfig` compile-time constants, `vite.config.ts` client build system.

---

## Context — What Exists Today

- `src/services/firebase/auth.ts` — exports `ensureAnonymousAuth()`, called once in `main.tsx`
- `src/types/clientConfig.ts` — `ClientConfig` interface; client builds bake values at compile time
- `src/constants/clientConfig.ts` — reads `__CLIENT_CONFIG__`, falls back to dev defaults
- `firestore.rules` — all collections require `request.auth != null` ✅ already correct, no changes needed
- `main.tsx` — calls `ensureAnonymousAuth()` inside `hasFeature(CLIENT_CONFIG.plan, 'firebase_sync')` guard

**The problem:** `signInAnonymously()` lets *any* device authenticate — no credentials needed. Switching to email/password means only devices with the baked-in credentials can access Firestore.

---

## Task 1: Enable Email/Password Auth in Firebase Console (manual)

**This is done once in the browser — no code changes.**

**Step 1: Enable the provider**

1. Go to [Firebase Console](https://console.firebase.google.com) → project `store-pos-44750`
2. Left sidebar → **Authentication** → **Sign-in method** tab
3. Click **Email/Password** → toggle **Enable** → **Save**

**Step 2: Create the service account user**

1. Stay in Authentication → **Users** tab
2. Click **Add user**
3. Email: `pos@binaryventures.in` (or any email you control)
4. Password: generate a strong password (e.g. `StoreSync@2026!`) — save it somewhere safe
5. Click **Add user**

> This one Firebase user represents the entire store's device fleet. All POS devices share these credentials. Do NOT use a personal email here.

**Step 3: Note down the credentials**

```
Email:    pos@binaryventures.in
Password: <your chosen password>
```

You'll need these in Task 3.

---

## Task 2: Add `firebase` field to `ClientConfig` type

**File:** `src/types/clientConfig.ts`

**Step 1: Add the optional `firebase` field to `ClientConfig`**

Find the `ClientConfig` interface and add one field after `licenseExpiresAt`:

```typescript
export interface ClientConfig {
  store: { ... }       // unchanged
  brand: { ... }       // unchanged
  staff?: StaffMember[]
  plan: PlanTier
  clientId: string
  licenseExpiresAt: string
  // Firebase service account for this client build.
  // When present, app signs in with email/password instead of anonymously.
  // Absent in dev mode — dev uses anonymous auth so no credentials are needed locally.
  firebase?: {
    serviceEmail: string
    servicePassword: string
  }
}
```

**Step 2: Verify TypeScript is happy**

```bash
cd POS && npx tsc --noEmit
```

Expected: no errors related to `ClientConfig`.

**Step 3: Commit**

```bash
git add POS/src/types/clientConfig.ts
git commit -m "feat: add optional firebase service account fields to ClientConfig"
```

---

## Task 3: Update `ensureAnonymousAuth` → `ensureFirebaseAuth`

**File:** `src/services/firebase/auth.ts`

This is the core change. Replace the file contents entirely:

**Step 1: Rewrite `auth.ts`**

```typescript
import { signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth } from '.'
import { CLIENT_CONFIG } from '@/constants/clientConfig'

/**
 * Establishes a Firebase Auth session before any Firestore operations.
 *
 * - Client builds (firebase credentials in CLIENT_CONFIG): signs in with
 *   email/password so only devices with valid credentials can access Firestore.
 * - Dev mode (no credentials): falls back to anonymous auth — no setup needed locally.
 *
 * Firebase SDK persists the auth session in IndexedDB, so the app works offline
 * after the first successful sign-in. The session is automatically refreshed
 * when connectivity returns.
 *
 * This is separate from the app's own PIN/password auth (Zustand-based).
 * It exists solely to satisfy Firestore security rules (request.auth != null).
 */
export async function ensureFirebaseAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        if (user) {
          // Already signed in (session persisted from previous load).
          resolve()
          return
        }

        const creds = CLIENT_CONFIG.firebase
        if (creds) {
          // Client build: sign in with the baked-in service account credentials.
          signInWithEmailAndPassword(auth, creds.serviceEmail, creds.servicePassword)
            .then(() => resolve())
            .catch(reject)
        } else {
          // Dev mode: no credentials configured — use anonymous auth.
          signInAnonymously(auth).then(() => resolve()).catch(reject)
        }
      },
      reject
    )
  })
}
```

**Step 2: Update `main.tsx` — rename the import**

In `src/main.tsx`, find:
```typescript
import { ensureAnonymousAuth } from './services/firebase/auth'
```
Replace with:
```typescript
import { ensureFirebaseAuth } from './services/firebase/auth'
```

And find:
```typescript
await ensureAnonymousAuth().catch((err) =>
  console.warn('[Auth] Anonymous sign-in failed (offline?):', err)
)
```
Replace with:
```typescript
await ensureFirebaseAuth().catch((err) =>
  console.warn('[Auth] Firebase sign-in failed (offline?):', err)
)
```

**Step 3: Check for any other imports of `ensureAnonymousAuth`**

```bash
grep -r "ensureAnonymousAuth" POS/src/
```

Expected: no results (we've renamed all usages).

**Step 4: Verify TypeScript**

```bash
cd POS && npx tsc --noEmit
```

Expected: no errors.

**Step 5: Commit**

```bash
git add POS/src/services/firebase/auth.ts POS/src/main.tsx
git commit -m "feat: replace anonymous Firebase auth with email/password for client builds"
```

---

## Task 4: Add credentials to the Zero One client config

**Context:** Client configs live in `clients/` (read only by `vite.config.ts`, never imported in `src/`). Find the Zero One client config file.

**Step 1: Find the client config file**

```bash
ls POS/clients/
```

Open the Zero One client config file and add the `firebase` field:

```typescript
firebase: {
  serviceEmail: 'pos@binaryventures.in',
  servicePassword: '<the password you set in Task 1>',
},
```

> Never commit real passwords to git if the repo is public. Since this repo is private (client builds are never source-exposed), this is acceptable. For extra safety, use a Firebase App Check or Secret Manager in a future phase.

**Step 2: Verify dev mode still works (no credentials)**

```bash
cd POS && npm run dev
```

Open the app → check browser console → should see no Firebase auth errors. DevTools → Application → IndexedDB should show data loading normally.

**Step 3: Commit**

```bash
git add POS/clients/
git commit -m "feat: add Firebase service account credentials to Zero One client config"
```

---

## Task 5: Test client build auth

**Step 1: Build the Zero One client**

```bash
cd POS && CLIENT=zero-one npm run build
```

Expected: builds without errors.

**Step 2: Preview the build**

```bash
cd POS && npx serve dist-zero-one
```

Open in browser → check DevTools console → should see no `[Auth]` warnings → Firebase Auth should silently sign in with email/password.

**Step 3: Verify in Firebase Console**

Go to Firebase Console → Authentication → Users → the `pos@binaryventures.in` user's **Last sign-in** timestamp should have updated.

**Step 4: Test offline behavior**

1. In DevTools → Network tab → set to **Offline**
2. Reload the page
3. App should still load and work (Firebase SDK uses persisted cache)
4. No auth errors should appear

---

## Task 6: Deploy

**Step 1: Deploy to Firebase Hosting**

```bash
cd POS && firebase deploy
```

**Step 2: Verify on live URL**

Open https://store-pos-44750.web.app → check console → no auth errors.

---

## What Changes, What Doesn't

| | Before | After |
|---|---|---|
| Dev mode auth | Anonymous | Anonymous (unchanged) |
| Client build auth | Anonymous | Email/password |
| Firestore rules | `request.auth != null` | `request.auth != null` (unchanged) |
| App's own auth | PIN/password (Zustand) | PIN/password (Zustand, unchanged) |
| Offline support | ✅ | ✅ (Firebase persists session) |

---

## Security Notes

- The Firebase config (`apiKey`, `projectId` etc.) is visible in the browser bundle — this is expected and safe. Firebase API keys are not secrets.
- The service account email + password in `CLIENT_CONFIG` ARE secrets. They're safe as long as the repo/clients folder is private and client bundles are not decompiled.
- Firestore rules enforce `request.auth != null` — someone with the API key alone cannot read data without valid credentials.
- Future hardening: Firebase App Check (attestation) + restrict by email domain in rules.
