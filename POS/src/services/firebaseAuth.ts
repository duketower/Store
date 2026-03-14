import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

/**
 * Resolves when a Firebase anonymous session is established (or already exists).
 * If a previous session is persisted, reuses it — no new user created.
 * Rejects if Firebase Auth is unreachable — caller must handle gracefully.
 * This is used only to satisfy Firestore security rules (request.auth != null).
 * The app's own PIN/password auth (Dexie-backed) is separate and unchanged.
 */
export async function ensureAnonymousAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        if (user) {
          resolve()
        } else {
          signInAnonymously(auth).then(() => resolve()).catch(reject)
        }
      },
      reject
    )
  })
}
