import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toast } from '@/components/feedback/Toast'
import { usePrinter } from '@/hooks/usePrinter'

export function AppShell() {
  const { connected, connect } = usePrinter()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header printerConnected={connected} onConnectPrinter={connect} />

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <Toast />
    </div>
  )
}
