import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ShoppingCart, PackagePlus, Users, Boxes, BarChart3, UserCog, Settings, LayoutDashboard, CalendarDays, Banknote,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NAV_ITEMS } from '@/constants/routes'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import { CLIENT_CONFIG } from '@/constants/clientConfig'
import { hasFeature } from '@/constants/features'
import { getPendingCreditRequestCount } from '@/db/queries/customers'

const ICONS: Record<string, LucideIcon> = {
  ShoppingCart, PackagePlus, Users, Boxes, BarChart3, UserCog, Settings, LayoutDashboard, CalendarDays, Banknote,
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role } = useAuth()
  const creditRequestCount = useUiStore((s) => s.creditRequestCount)
  const setCreditRequestCount = useUiStore((s) => s.setCreditRequestCount)

  useEffect(() => {
    getPendingCreditRequestCount().then(setCreditRequestCount)
  }, [])

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!role || !item.roles.includes(role)) return false
    if (item.feature && !hasFeature(CLIENT_CONFIG.plan, item.feature)) return false
    return true
  })

  return (
    <aside
      className={cn(
        // Mobile: fixed overlay drawer
        'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static sidebar, always visible
        'md:relative md:z-auto md:w-56 md:translate-x-0 md:transition-none'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <ShoppingCart className="mr-2" style={{ color: 'var(--brand-primary, #2563eb)' }} size={20} />
        <span className="text-sm font-bold text-gray-900">{CLIENT_CONFIG.brand.appName}</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-2">
        {visibleItems.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'nav-active'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {Icon && <Icon size={18} />}
              <span className="flex-1">{item.label}</span>
              {item.label === 'Customers' && creditRequestCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {creditRequestCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
