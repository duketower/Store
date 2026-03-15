import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ShoppingCart, PackagePlus, Users, Package, Boxes, BarChart3, UserCog, Settings, LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NAV_ITEMS } from '@/constants/routes'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import { APP_NAME } from '@/constants/app'
import { getPendingCreditRequestCount } from '@/db/queries/customers'

const ICONS: Record<string, LucideIcon> = {
  ShoppingCart, PackagePlus, Users, Package, Boxes, BarChart3, UserCog, Settings, LayoutDashboard,
}

export function Sidebar() {
  const { role } = useAuth()
  const lowStockCount = useUiStore((s) => s.lowStockCount)
  const creditRequestCount = useUiStore((s) => s.creditRequestCount)
  const setCreditRequestCount = useUiStore((s) => s.setCreditRequestCount)

  useEffect(() => {
    getPendingCreditRequestCount().then(setCreditRequestCount)
  }, [])

  const visibleItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  )

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <ShoppingCart className="mr-2 text-blue-600" size={20} />
        <span className="text-sm font-bold text-gray-900">{APP_NAME}</span>
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
