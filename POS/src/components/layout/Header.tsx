import { useEffect, useState } from 'react'
import { LogOut, Printer, Wifi, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS, ROLE_COLORS } from '@/constants/roles'
import { cn } from '@/utils/cn'

interface HeaderProps {
  printerConnected?: boolean
  onConnectPrinter?: () => void
  onMenuToggle?: () => void
}

export function Header({ printerConnected, onConnectPrinter, onMenuToggle }: HeaderProps) {
  const { name, role, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: hamburger (mobile) + connectivity indicator */}
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="flex items-center gap-1">
          <Wifi size={14} className={cn(isOnline ? 'text-green-500' : 'text-amber-600')} />
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </span>
      </div>

      {/* Right: printer + user */}
      <div className="flex items-center gap-3">
        {onConnectPrinter && (
          <button
            onClick={onConnectPrinter}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
              printerConnected
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
            title={printerConnected ? 'Printer connected' : 'Connect printer'}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">{printerConnected ? 'Printer OK' : 'Connect Printer'}</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            {role && (
              <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', ROLE_COLORS[role])}>
                {ROLE_LABELS[role]}
              </span>
            )}
          </div>

          <button
            onClick={logout}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
