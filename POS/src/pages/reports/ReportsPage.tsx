import { useState } from 'react'
import { BarChart3, Package, Receipt, Truck, CreditCard, RotateCcw, Activity, TrendingUp, CalendarDays, ShoppingBag, Users, Wallet, Building2 } from 'lucide-react'
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

type ReportTab = 'sales' | 'stock' | 'bills' | 'grn' | 'rtv' | 'credit' | 'inventory' | 'margin' | 'monthly' | 'top-products' | 'cashier' | 'expenses' | 'vendors'

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('sales')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))

  return (
    <PageContainer title="Reports">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
        {([
          { id: 'sales', label: 'Daily Sales', icon: <BarChart3 size={15} /> },
          { id: 'stock', label: 'Stock Levels', icon: <Package size={15} /> },
          { id: 'inventory', label: 'Inventory', icon: <Activity size={15} /> },
          { id: 'bills', label: 'All Bills', icon: <Receipt size={15} /> },
          { id: 'grn', label: 'GRN History', icon: <Truck size={15} /> },
          { id: 'rtv', label: 'RTV', icon: <RotateCcw size={15} /> },
          { id: 'credit', label: 'Credit', icon: <CreditCard size={15} /> },
          { id: 'margin', label: 'Profit Margin', icon: <TrendingUp size={15} /> },
          { id: 'monthly', label: 'Monthly Summary', icon: <CalendarDays size={15} /> },
          { id: 'top-products', label: 'Top Products', icon: <ShoppingBag size={15} /> },
          { id: 'cashier', label: 'Cashier Report', icon: <Users size={15} /> },
          { id: 'expenses', label: 'Expenses', icon: <Wallet size={15} /> },
          { id: 'vendors', label: 'Vendors', icon: <Building2 size={15} /> },
        ] as { id: ReportTab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <span className="flex items-center gap-2">{t.icon}{t.label}</span>
          </button>
        ))}
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
    </PageContainer>
  )
}
