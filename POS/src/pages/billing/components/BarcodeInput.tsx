import { useEffect, useRef } from 'react'

const SCAN_TIMEOUT_MS = 50
const MIN_LENGTH = 4

interface BarcodeInputProps {
  onScan: (barcode: string) => void
  enabled?: boolean
}

// Invisible input that stays focused and captures barcode scanner keystrokes.
// USB barcode scanners appear as keyboards — they type chars very fast then send Enter.
// We detect scans by: keystroke gap < 50ms + ends with Enter.
export function BarcodeInput({ onScan, enabled = true }: BarcodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef('')
  const lastTimeRef = useRef(0)

  // Keep input focused when billing page is active, but yield to interactive elements
  useEffect(() => {
    if (!enabled) return
    const focus = () => inputRef.current?.focus()
    focus()
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.isContentEditable ||
        target.closest('input, textarea, select, button, [contenteditable]') !== null
      if (!isInteractive) setTimeout(focus, 50)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [enabled])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!enabled) return
    const now = Date.now()
    const gap = now - lastTimeRef.current
    lastTimeRef.current = now

    // Large gap = manual typing, not scanner — reset buffer
    if (gap > SCAN_TIMEOUT_MS * 3 && bufferRef.current.length > 0) {
      // Only reset if gap is very large (human typing pace)
      if (gap > 200) bufferRef.current = ''
    }

    if (e.key === 'Enter') {
      const barcode = bufferRef.current.trim()
      bufferRef.current = ''
      if (barcode.length >= MIN_LENGTH) {
        e.preventDefault()
        onScan(barcode)
      }
      return
    }

    if (e.key.length === 1) {
      bufferRef.current += e.key
    }
  }

  if (!enabled) return null

  return (
    <input
      ref={inputRef}
      type="text"
      value=""
      onChange={() => {/* controlled by keydown */}}
      onKeyDown={handleKeyDown}
      className="absolute opacity-0 pointer-events-none w-0 h-0"
      aria-hidden="true"
      tabIndex={-1}
      readOnly
    />
  )
}
