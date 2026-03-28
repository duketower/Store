import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { InventoryAlertsPanel } from '@/components/common/InventoryAlertsPanel'
import { PageContainer } from '@/components/layout/PageContainer'
import { useSessionStore } from '@/stores/sessionStore'
import { useAuth } from '@/hooks/useAuth'
import { subscribeDashboardMetrics, type DashboardMetrics } from '@/services/firebase/queries'
import { getLowStockProducts } from '@/db/queries/products'
import { getNearExpiryBatches } from '@/db/queries/batches'
import { formatCurrency } from '@/utils/currency'
import { NEAR_EXPIRY_DAYS } from '@/constants/app'
import { ROUTES as APP_ROUTES } from '@/constants/routes'

export function DashboardPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { currentSession } = useSessionStore()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => formatMonthInputValue(new Date()))
  const inventoryData = useLiveQuery(async () => {
    const [lowStock, nearExpiry] = await Promise.all([
      getLowStockProducts(),
      getNearExpiryBatches(NEAR_EXPIRY_DAYS),
    ])
    return { lowStock, nearExpiry }
  }, []) ?? null

  useEffect(() => {
    const unsubscribe = subscribeDashboardMetrics(parseMonthInput(selectedMonth), (nextMetrics) => {
      setMetrics(nextMetrics)
    })

    return unsubscribe
  }, [selectedMonth])

  const loading = !metrics || !inventoryData
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const currentMonthValue = formatMonthInputValue(new Date())
  const selectedMonthDate = parseMonthInput(selectedMonth)
  const isCurrentMonthSelected = selectedMonth === currentMonthValue
  const selectedMonthLabel = selectedMonthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const monthSectionTitle = isCurrentMonthSelected ? 'This Month' : selectedMonthLabel
  const monthSectionSubtitle = isCurrentMonthSelected
    ? 'Month-to-date sales progress and break-even tracking'
    : `Sales progress and break-even tracking for ${selectedMonthLabel}`
  const monthSalesLabel = isCurrentMonthSelected ? 'MTD Sales' : 'Month Sales'
  const monthSalesHint = `${metrics?.month.totalBills ?? 0} bills in ${selectedMonthLabel}`
  const monthProfitLabel = isCurrentMonthSelected ? 'MTD Net Profit' : 'Month Net Profit'
  const monthSalesHelper = isCurrentMonthSelected
    ? `Remaining this month: ${formatCurrency(metrics?.month.salesRemaining ?? 0)}`
    : `Remaining for ${selectedMonthLabel}: ${formatCurrency(metrics?.month.salesRemaining ?? 0)}`

  return (
    <PageContainer title={`Good ${getGreeting()}, ${session?.name ?? 'there'}`} subtitle={today}>
      {loading || !metrics ? (
        <p className="text-sm text-gray-400">Loading dashboard…</p>
      ) : (
        <div className="space-y-5">
          <div
            className={`rounded-lg border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
              currentSession ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
            }`}
          >
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

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="Today"
              subtitle="Live sales, target progress, and profit for the current day"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Today's Sales"
                  value={formatCurrency(metrics.today.totalSales)}
                  icon={<ShoppingCart size={18} className="text-brand-500" />}
                  tone="brand"
                  hint={`${metrics.today.totalBills} bills`}
                />
                <TargetProgressCard
                  label="Daily Sales Target"
                  current={metrics.today.totalSales}
                  target={metrics.today.salesTarget}
                  achieved={metrics.today.salesAchieved}
                  remaining={metrics.today.salesRemaining}
                  overBy={metrics.today.salesOverBy}
                  helper={`Target for today: ${formatCurrency(metrics.today.salesTarget)}`}
                />
                <MetricCard
                  label="Gross Profit"
                  value={formatCurrency(metrics.today.grossProfitTotal)}
                  icon={<TrendingUp size={18} className="text-green-600" />}
                  tone="green"
                  hint={`COGS: ${formatCurrency(metrics.today.cogsTotal)}`}
                />
                <MetricCard
                  label="Net Profit"
                  value={formatCurrency(metrics.today.netProfitTotal)}
                  icon={<Wallet size={18} className={metrics.today.netProfitTotal >= 0 ? 'text-emerald-600' : 'text-red-500'} />}
                  tone={metrics.today.netProfitTotal >= 0 ? 'emerald' : 'red'}
                  hint={`Expenses: ${formatCurrency(metrics.today.expensesTotal)}`}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment Mix</p>
                    <p className="text-sm text-gray-500">Across all synced devices today</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniMetric label="Cash" value={formatCurrency(metrics.today.cashTotal)} />
                  <MiniMetric label="UPI" value={formatCurrency(metrics.today.upiTotal)} />
                  <MiniMetric label="Credit" value={formatCurrency(metrics.today.creditTotal)} />
                </div>
              </div>

              {metrics.today.estimatedProfit && (
                <p className="text-xs text-amber-600">
                  Profit includes best-effort estimates for older sales without saved cost snapshots.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title={monthSectionTitle}
              subtitle={monthSectionSubtitle}
              headerAction={
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Month
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    max={currentMonthValue}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none sm:min-w-[160px]"
                  />
                </div>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label={monthSalesLabel}
                  value={formatCurrency(metrics.month.totalSales)}
                  icon={<ShoppingCart size={18} className="text-brand-500" />}
                  tone="brand"
                  hint={monthSalesHint}
                />
                <TargetProgressCard
                  label="Monthly Sales Target"
                  current={metrics.month.totalSales}
                  target={metrics.month.salesTarget}
                  achieved={metrics.month.salesAchieved}
                  remaining={metrics.month.salesRemaining}
                  overBy={metrics.month.salesOverBy}
                  helper={monthSalesHelper}
                />
                <MetricCard
                  label={monthProfitLabel}
                  value={formatCurrency(metrics.month.netProfitTotal)}
                  icon={<Wallet size={18} className={metrics.month.netProfitTotal >= 0 ? 'text-emerald-600' : 'text-red-500'} />}
                  tone={metrics.month.netProfitTotal >= 0 ? 'emerald' : 'red'}
                  hint={`Expenses deducted: ${formatCurrency(metrics.month.expensesTotal)}`}
                />
                <TargetProgressCard
                  label="Break-even Progress"
                  current={metrics.month.netProfitTotal}
                  target={metrics.month.breakEvenTarget}
                  achieved={metrics.month.breakEvenAchieved}
                  remaining={metrics.month.breakEvenRemaining}
                  overBy={metrics.month.breakEvenOverBy}
                  helper={`Break-even target: ${formatCurrency(metrics.month.breakEvenTarget)}`}
                  targetKind="breakEven"
                />
              </div>

              {metrics.month.estimatedProfit && (
                <p className="text-xs text-amber-600">
                  Month-to-date profit includes best-effort estimates for older sales without saved cost snapshots.
                </p>
              )}
            </SectionCard>
          </div>

          <InventoryAlertsPanel lowStock={inventoryData.lowStock} nearExpiry={inventoryData.nearExpiry} />

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
      )}
    </PageContainer>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function SectionCard({
  title,
  subtitle,
  headerAction,
  children,
}: {
  title: string
  subtitle: string
  headerAction?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{subtitle}</h3>
        </div>
        {headerAction}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  icon,
  tone = 'default',
  hint,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: 'default' | 'brand' | 'green' | 'emerald' | 'red'
  hint?: string
}) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    default: 'border-gray-200 bg-white',
    brand: 'border-brand-100 bg-brand-50',
    green: 'border-green-100 bg-green-50',
    emerald: 'border-emerald-100 bg-emerald-50',
    red: 'border-red-100 bg-red-50',
  }

  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function TargetProgressCard({
  label,
  current,
  target,
  achieved,
  remaining,
  overBy,
  helper,
  targetKind = 'sales',
}: {
  label: string
  current: number
  target: number
  achieved: boolean
  remaining: number
  overBy: number
  helper: string
  targetKind?: 'sales' | 'breakEven'
}) {
  const ratio = target <= 0 ? 1 : Math.min(current / target, 1)
  const statusText = achieved
    ? overBy > 0
      ? `Achieved and ahead by ${formatCurrency(overBy)}`
      : 'Target achieved'
    : targetKind === 'breakEven'
      ? `Remaining ${formatCurrency(remaining)} to break even`
      : `Behind by ${formatCurrency(remaining)}`

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(current)}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            achieved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {achieved ? 'On Track' : 'Pending'}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-medium text-gray-700">{statusText}</p>
        <p className="text-xs text-gray-500">{helper}</p>
        <p className="text-xs text-gray-400">Current vs target: {formatCurrency(current)} / {formatCurrency(target)}</p>
      </div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-800">{value}</p>
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

function formatMonthInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseMonthInput(value: string) {
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  return new Date(year, month - 1, 1)
}
