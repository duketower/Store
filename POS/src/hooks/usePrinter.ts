import { useState } from 'react'
import { connectPrinter, printReceipt, type ReceiptData } from '@/services/printer/printer'

export function usePrinter() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    setConnecting(true)
    setError(null)
    try {
      await connectPrinter()
      setConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect printer')
      setConnected(false)
    } finally {
      setConnecting(false)
    }
  }

  const print = async (data: ReceiptData) => {
    try {
      await printReceipt(data)
    } catch (err) {
      // Fall back to window.print() if WebUSB fails
      window.print()
    }
  }

  return { connected, connecting, error, connect, print }
}
