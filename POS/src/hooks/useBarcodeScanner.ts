import { useEffect, useRef } from 'react'

const SCAN_TIMEOUT_MS = 50  // max ms between keystrokes for scanner input
const MIN_BARCODE_LENGTH = 4

interface UseBarcodeScanner {
  onScan: (barcode: string) => void
  enabled?: boolean
}

// Captures rapid keystrokes (USB HID barcode scanner appears as keyboard)
// Fires onScan when a sequence ends with Enter within SCAN_TIMEOUT_MS gaps
export function useBarcodeScanner({ onScan, enabled = true }: UseBarcodeScanner) {
  const bufferRef = useRef<string>('')
  const lastKeyTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const timeSinceLast = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Reset buffer if gap too large (manual typing, not scanner)
      if (timeSinceLast > SCAN_TIMEOUT_MS && bufferRef.current.length > 0) {
        bufferRef.current = ''
      }

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim()
        bufferRef.current = ''
        if (barcode.length >= MIN_BARCODE_LENGTH) {
          onScan(barcode)
        }
        return
      }

      // Only capture printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onScan, enabled])
}
