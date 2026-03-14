import { LogOut, Printer, Wifi } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS, ROLE_COLORS } from '@/constants/roles'
import { cn } from '@/utils/cn'

interface HeaderProps {
  printerConnected?: boolean
  onConnectPrinter?: () => void
}

export function Header({ printerConnected, onConnectPrinter }: HeaderProps) {
  const { name, role, logout } = useAuth()

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: offline indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Wifi size={14} className="text-green-500" />
          <span className="hidden sm:inline">Local Mode</span>
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
            {printerConnected ? 'Printer OK' : 'Connect Printer'}
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
