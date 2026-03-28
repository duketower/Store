import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LogOut, Printer, Wifi, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS, ROLE_COLORS } from '@/constants/roles'
import { cn } from '@/utils/cn'
import { getOutboxSummary } from '@/db/queries/outbox'

interface HeaderProps {
  printerConnected?: boolean
  onConnectPrinter?: () => void
  onMenuToggle?: () => void
}

export function Header({ printerConnected, onConnectPrinter, onMenuToggle }: HeaderProps) {
  const { name, role, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine)
  const syncSummary = useLiveQuery(async () => getOutboxSummary(), []) ?? { pending: 0, failed: 0, syncing: 0 }

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

  const syncLabel = !isOnline
    ? 'Offline Queue'
    : syncSummary.failed > 0
      ? 'Sync Issue'
      : syncSummary.syncing > 0
        ? 'Syncing'
        : syncSummary.pending > 0
          ? 'Sync Pending'
          : 'Shared Sync'

  const syncToneClass = !isOnline
    ? 'text-amber-600'
    : syncSummary.failed > 0
      ? 'text-red-500'
      : syncSummary.syncing > 0
        ? 'text-brand-600'
        : syncSummary.pending > 0
          ? 'text-amber-600'
          : 'text-green-500'

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: hamburger (mobile) + offline indicator */}
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="flex items-center gap-1">
          <Wifi size={14} className={cn(syncToneClass, syncSummary.syncing > 0 && 'animate-pulse')} />
          <span className="hidden sm:inline">{syncLabel}</span>
          {(syncSummary.pending > 0 || syncSummary.failed > 0 || syncSummary.syncing > 0) && (
            <span className="hidden rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 sm:inline">
              {syncSummary.pending + syncSummary.failed + syncSummary.syncing}
            </span>
          )}
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
