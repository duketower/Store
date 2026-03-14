/**
 * Global error monitoring — writes uncaught errors to Firestore `errors` collection.
 * Never throws. Call initErrorMonitoring() once in main.tsx before mounting.
 */
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { firestore, auth } from './firebase'

async function logToFirestore(type: string, message: string, stack?: string): Promise<void> {
  try {
    // Skip noisy non-actionable errors
    if (message === 'Script error.' || message === '') return
    if (message.includes('NetworkError') || message.includes('Failed to fetch')) return
    // Skip if anonymous auth isn't established yet — Firestore rules require auth
    if (!auth.currentUser) return

    await addDoc(collection(firestore, 'errors'), {
      type,
      message,
      stack: stack ?? null,
      url: window.location.href,
      userAgent: navigator.userAgent,
      createdAt: Timestamp.now(),
    })
  } catch {
    // Never throw from error logger
  }
}

export function initErrorMonitoring(): void {
  window.addEventListener('error', (e) => {
    logToFirestore('uncaught_error', e.message, e.error?.stack)
  })

  window.addEventListener('unhandledrejection', (e) => {
    const message = e.reason?.message ?? String(e.reason ?? 'Unknown rejection')
    logToFirestore('unhandled_rejection', message, e.reason?.stack)
  })
}
