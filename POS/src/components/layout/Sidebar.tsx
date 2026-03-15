import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ShoppingCart, PackagePlus, Users, Package, Boxes, BarChart3, UserCog, Settings, LayoutDashboard, Truck, CalendarDays,
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
  ShoppingCart, PackagePlus, Users, Package, Boxes, BarChart3, UserCog, Settings, LayoutDashboard, Truck, CalendarDays,
}

export function Sidebar() {
  const { role } = useAuth()
  const lowStockCount = useUiStore((s) => s.lowStockCount)
  const creditRequestCount = useUiStore((s) => s.creditRequestCount)
  const setCreditRequestCount = useUiStore((s) => s.setCreditRequestCount)

  useEffect(() => {
    getPendingCreditRequestCount().then(setCreditRequestCount)
  }, [])

  // Filter by role AND plan feature (two independent gates).
  // A cashier on a pro plan sees fewer items than an admin on a pro plan.
  // An admin on a free plan sees fewer items than an admin on a pro plan.
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!role || !item.roles.includes(role)) return false
    if (item.feature && !hasFeature(CLIENT_CONFIG.plan, item.feature)) return false
    return true
  })

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo — uses per-client brand app name */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <ShoppingCart className="mr-2 text-blue-600" size={20} />
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
              className={({ isActive }) =>
                cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {Icon && <Icon size={18} />}
              <span className="flex-1">{item.label}</span>
              {item.label === 'Products' && lowStockCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {lowStockCount}
                </span>
              )}
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
