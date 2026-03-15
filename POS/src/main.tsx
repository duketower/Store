import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { seedDatabase } from './db/seed'
import { flushOutbox } from './services/sync/outbox'
import { initErrorMonitoring } from './services/firebase/errorLogger'
import { ensureAnonymousAuth } from './services/firebase/auth'
import { startFirestoreListeners } from './services/sync/firestoreListener'
import './styles/globals.css'

// Catch uncaught errors and unhandled rejections → Firestore errors collection
initErrorMonitoring()

// Await seed before mounting so fresh-device IndexedDB is ready
seedDatabase()
  .catch(console.error)
  .finally(async () => {
    // Establish anonymous Firebase Auth session so Firestore rules (request.auth != null) pass.
    // Best-effort: never blocks mount if offline or Auth is unavailable.
    await ensureAnonymousAuth().catch((err) =>
      console.warn('[Auth] Anonymous sign-in failed (offline?):', err)
    )

    // Real-time Firestore → Dexie sync: keep local stock/customer data current across devices.
    // Must start after auth so the onSnapshot subscriptions pass security rules.
    startFirestoreListeners()

    // Flush any sales that failed to sync while offline, and re-flush whenever connectivity returns
    flushOutbox()
    window.addEventListener('online', flushOutbox)

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StrictMode>
    )
  })
