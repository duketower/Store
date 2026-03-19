import { useState } from 'react'
import { BarChart3, Package, Receipt, Truck, CreditCard, RotateCcw, Activity, TrendingUp, CalendarDays, ShoppingBag, Users, Wallet, Building2, Bug } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { SalesTab } from './tabs/SalesTab'
import { StockTab } from './tabs/StockTab'
import { InventoryTab } from './tabs/InventoryTab'
import { BillsTab } from './tabs/BillsTab'
import { GrnTab } from './tabs/GrnTab'
import { RtvTab } from './tabs/RtvTab'
import { CreditTab } from './tabs/CreditTab'
import { ProfitMarginTab } from './tabs/ProfitMarginTab'
import { MonthlySummaryTab } from './tabs/MonthlySummaryTab'
import { TopProductsTab } from './tabs/TopProductsTab'
import { CashierReportTab } from './tabs/CashierReportTab'
import { ExpenseTab } from './tabs/ExpenseTab'
import { VendorSummaryTab } from './tabs/VendorSummaryTab'
import { ErrorLogTab } from './tabs/ErrorLogTab'
import { useAuth } from '@/hooks/useAuth'

type ReportTab = 'sales' | 'stock' | 'bills' | 'grn' | 'rtv' | 'credit' | 'inventory' | 'margin' | 'monthly' | 'top-products' | 'cashier' | 'expenses' | 'vendors' | 'errors'

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('sales')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const { role } = useAuth()

  type TabDef = { id: ReportTab; label: string; icon: React.ReactNode; adminOnly?: boolean }
  const TAB_GROUPS: { label: string; tabs: TabDef[] }[] = [
    {
      label: 'Sales',
      tabs: [
        { id: 'sales',        label: 'Daily Sales',      icon: <BarChart3 size={13} /> },
        { id: 'bills',        label: 'All Bills',        icon: <Receipt size={13} /> },
        { id: 'monthly',      label: 'Monthly Summary',  icon: <CalendarDays size={13} /> },
        { id: 'top-products', label: 'Top Products',     icon: <ShoppingBag size={13} /> },
        { id: 'cashier',      label: 'Cashier Report',   icon: <Users size={13} /> },
      ],
    },
    {
      label: 'Finance',
      tabs: [
        { id: 'margin',   label: 'Profit Margin', icon: <TrendingUp size={13} /> },
        { id: 'credit',   label: 'Credit',        icon: <CreditCard size={13} /> },
        { id: 'expenses', label: 'Expenses',       icon: <Wallet size={13} /> },
      ],
    },
    {
      label: 'Inventory',
      tabs: [
        { id: 'stock',     label: 'Stock Levels', icon: <Package size={13} /> },
        { id: 'inventory', label: 'Inventory',    icon: <Activity size={13} /> },
        { id: 'grn',       label: 'GRN History',  icon: <Truck size={13} /> },
        { id: 'rtv',       label: 'RTV',          icon: <RotateCcw size={13} /> },
        { id: 'vendors',   label: 'Vendors',      icon: <Building2 size={13} /> },
      ],
    },
    {
      label: 'System',
      tabs: [
        { id: 'errors', label: 'Error Log', icon: <Bug size={13} />, adminOnly: true },
      ],
    },
  ]

  return (
    <PageContainer title="Reports">
      {/* Report selector — grouped pill buttons with dividers */}
      <div className="flex divide-x divide-gray-200 mb-5 -mx-4">
        {TAB_GROUPS.map((group) => {
          const visibleTabs = group.tabs.filter((t) => !t.adminOnly || role === 'admin')
          if (visibleTabs.length === 0) return null
          return (
            <div key={group.label} className="flex flex-col gap-2 px-4 min-w-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {visibleTabs.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      tab === t.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {tab === 'sales' && <SalesTab reportDate={reportDate} onDateChange={setReportDate} />}
      {tab === 'stock' && <StockTab />}
      {tab === 'inventory' && <InventoryTab />}
      {tab === 'bills' && <BillsTab />}
      {tab === 'grn' && <GrnTab />}
      {tab === 'rtv' && <RtvTab />}
      {tab === 'credit' && <CreditTab />}
      {tab === 'margin' && <ProfitMarginTab />}
      {tab === 'monthly' && <MonthlySummaryTab />}
      {tab === 'top-products' && <TopProductsTab />}
      {tab === 'cashier' && <CashierReportTab />}
      {tab === 'expenses' && <ExpenseTab />}
      {tab === 'vendors' && <VendorSummaryTab />}
      {tab === 'errors' && <ErrorLogTab />}
    </PageContainer>
  )
}
