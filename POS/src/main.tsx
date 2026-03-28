import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { seedDatabase } from './db/seed'
import { flushOutbox } from './services/sync/outbox'
import { initErrorMonitoring } from './services/firebase/errorLogger'
import { ensureFirebaseAuth } from './services/firebase/auth'
import { startFirestoreListeners } from './services/sync/firestoreListener'
import { ExpiredLicenseScreen } from './components/common/ExpiredLicenseScreen'
import { AppLoadingScreen } from './components/common/AppLoadingScreen'
import { CLIENT_CONFIG } from './constants/clientConfig'
import { isLicenseExpired, hasFeature } from './constants/features'
import './styles/globals.css'

// Catch uncaught errors and unhandled rejections → Firestore errors collection
initErrorMonitoring()

// Inject per-client brand CSS variables before first render.
// Any field not set by the client config falls back to the blue defaults in globals.css.
const { brand } = CLIENT_CONFIG
if (brand.primaryColor) {
  const r = document.documentElement.style
  r.setProperty('--brand-primary',       brand.primaryColor)
  r.setProperty('--brand-primary-hover', brand.primaryHoverColor ?? brand.primaryColor)
  r.setProperty('--brand-primary-tint',  brand.primaryTintColor  ?? '#eff6ff')
  r.setProperty('--brand-bg',            brand.bgColor           ?? '#f9fafb')
  r.setProperty('--brand-text',          brand.textColor         ?? '#111827')
}

const root = createRoot(document.getElementById('root')!)
const MIN_LOADING_SCREEN_MS = 2200

function renderAppLoadingScreen(message?: string) {
  root.render(
    <StrictMode>
      <AppLoadingScreen message={message} />
    </StrictMode>
  )
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

async function bootApp() {
  try {
    // Await seed before mounting so fresh-device IndexedDB is ready
    await seedDatabase()
  } catch (error) {
    console.error(error)
    renderAppLoadingScreen('Recovering local data and continuing startup.')
  }

  try {
    // Firebase sync is a Pro+ feature — only establish auth and start listeners when the plan
    // includes firebase_sync. Free-plan builds run fully offline with no Firebase calls.
    if (hasFeature(CLIENT_CONFIG.plan, 'firebase_sync')) {
      // Establish anonymous Firebase Auth session so Firestore rules (request.auth != null) pass.
      // Best-effort: never blocks mount if offline or Auth is unavailable.
      await ensureFirebaseAuth().catch((err) =>
        console.warn('[Auth] Firebase sign-in failed (offline?):', err)
      )

      // Real-time Firestore → Dexie sync: keep local stock/customer data current across devices.
      // Must start after auth so the onSnapshot subscriptions pass security rules.
      startFirestoreListeners()

      // Flush any sales that failed to sync while offline, and re-flush whenever connectivity returns
      flushOutbox()
      window.addEventListener('online', flushOutbox)
    }
  } catch (error) {
    console.error('[App Boot] Failed to start sync services:', error)
  }
}

// License gate: if subscription has expired, show locked screen instead of mounting the app.
// This prevents access to all data and functionality on expired builds.
if (isLicenseExpired(CLIENT_CONFIG.licenseExpiresAt)) {
  root.render(
    <StrictMode>
      <ExpiredLicenseScreen />
    </StrictMode>
  )
} else {
  renderAppLoadingScreen()

  void (async () => {
    await waitForNextPaint()
    await Promise.all([
      bootApp(),
      new Promise((resolve) => window.setTimeout(resolve, MIN_LOADING_SCREEN_MS)),
    ])

    root.render(
      <StrictMode>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StrictMode>
    )
  })()
}
