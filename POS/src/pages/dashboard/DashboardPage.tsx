import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { InventoryAlertsPanel } from '@/components/common/InventoryAlertsPanel'
import { PageContainer } from '@/components/layout/PageContainer'
import { useSessionStore } from '@/stores/sessionStore'
import { useAuth } from '@/hooks/useAuth'
import { subscribeTodaySalesSummary } from '@/services/firebase/queries'
import { getLowStockProducts } from '@/db/queries/products'
import { getNearExpiryBatches } from '@/db/queries/batches'
import { formatCurrency } from '@/utils/currency'
import { NEAR_EXPIRY_DAYS } from '@/constants/app'
import { ROUTES as APP_ROUTES } from '@/constants/routes'
import type { Product } from '@/types'

interface DashboardData {
  totalBills: number
  totalSales: number
  cashTotal: number
  upiTotal: number
  creditTotal: number
  lowStock: Product[]
  nearExpiry: Array<{ id?: number; productName?: string; batchNo: string; expiryDate: Date; qtyRemaining: number }>
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { currentSession } = useSessionStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let latestSummary = { totalBills: 0, totalSales: 0, cashTotal: 0, upiTotal: 0, creditTotal: 0 }
    let localLoaded = false
    let summaryLoaded = false

    function trySetData() {
      if (!localLoaded || !summaryLoaded) return
      setData((prev) => ({
        ...(prev ?? { lowStock: [], nearExpiry: [] }),
        ...latestSummary,
      }))
      setLoading(false)
    }

    // Subscribe to real-time sales totals from Firestore
    const unsubscribe = subscribeTodaySalesSummary((summary) => {
      latestSummary = summary
      summaryLoaded = true
      trySetData()
    })

    // Load local IndexedDB data (low stock + near expiry) once
    Promise.all([getLowStockProducts(), getNearExpiryBatches(NEAR_EXPIRY_DAYS)])
      .then(([lowStock, nearExpiry]) => {
        setData((prev) => ({
          ...(prev ?? latestSummary),
          lowStock,
          nearExpiry,
        }))
        localLoaded = true
        trySetData()
      })
      .catch(() => {
        localLoaded = true
        trySetData()
      })

    return unsubscribe
  }, [])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <PageContainer title={`Good ${getGreeting()}, ${session?.name ?? 'there'}`} subtitle={today}>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : data ? (
        <div className="space-y-5">

          {/* Shift status */}
          <div className={`rounded-lg border p-4 flex items-center justify-between ${
            currentSession ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
          }`}>
            <div className="flex items-center gap-3">
              <Clock size={18} className={currentSession ? 'text-green-600' : 'text-amber-600'} />
              <div>
                <p className={`text-sm font-semibold ${currentSession ? 'text-green-800' : 'text-amber-800'}`}>
                  {currentSession ? 'Shift Open' : 'No Shift Open'}
                </p>
                <p className={`text-xs ${currentSession ? 'text-green-600' : 'text-amber-600'}`}>
                  {currentSession
                    ? `Float: ${formatCurrency(currentSession.openingFloat)} · Opened ${formatTime(currentSession.openedAt)}`
                    : 'Open a shift before starting sales'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(APP_ROUTES.SHIFT_CLOSE)}
              className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1"
            >
              {currentSession ? 'Close Shift' : 'Open Shift'} <ArrowRight size={14} />
            </button>
          </div>

          {/* Today's sales stats */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Today's Sales</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total Bills" value={String(data.totalBills)} icon={<ShoppingCart size={18} className="text-brand-500" />} />
              <StatCard label="Total Revenue" value={formatCurrency(data.totalSales)} icon={<TrendingUp size={18} className="text-green-500" />} highlight />
              <StatCard label="Cash" value={formatCurrency(data.cashTotal)} />
              <StatCard label="UPI" value={formatCurrency(data.upiTotal)} />
            </div>
            {data.creditTotal > 0 && (
              <p className="mt-2 text-xs text-amber-600">+ {formatCurrency(data.creditTotal)} on credit (udhaar)</p>
            )}
          </div>

          {/* Inventory Alerts */}
          <InventoryAlertsPanel lowStock={data.lowStock} nearExpiry={data.nearExpiry} />

          {/* Quick actions */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction label="New Bill" icon={<ShoppingCart size={20} />} onClick={() => navigate(APP_ROUTES.BILLING)} color="blue" />
              <QuickAction label="Receive Stock" icon={<ArrowRight size={20} />} onClick={() => navigate(APP_ROUTES.RECEIVE_STOCK)} color="green" />
              <QuickAction label="Customers" icon={<ArrowRight size={20} />} onClick={() => navigate(APP_ROUTES.CUSTOMERS)} color="purple" />
              <QuickAction label="Reports" icon={<TrendingUp size={20} />} onClick={() => navigate(APP_ROUTES.REPORTS)} color="amber" />
            </div>
          </div>

        </div>
      ) : null}
    </PageContainer>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'bg-brand-50 border-brand-100' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className={`text-xs font-medium ${highlight ? 'text-brand-600' : 'text-gray-500'}`}>{label}</p>
      </div>
      <p className={`text-lg font-bold ${highlight ? 'text-brand-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function QuickAction({ label, icon, onClick, color }: { label: string; icon: React.ReactNode; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-brand-50 hover:bg-brand-100 text-brand-700 border-brand-100',
    green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-100',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100',
  }
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-sm font-medium flex flex-col items-center gap-2 transition-colors ${colors[color]}`}
    >
      {icon}
      {label}
    </button>
  )
}
