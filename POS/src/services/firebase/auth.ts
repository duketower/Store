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
