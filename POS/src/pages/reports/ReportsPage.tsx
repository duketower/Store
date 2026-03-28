import { useState, Fragment } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
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
import { db } from '@/db'
import { textChecksum, toTimeValue } from '@/utils/syncPulse'

type ReportTab = 'sales' | 'stock' | 'bills' | 'grn' | 'rtv' | 'credit' | 'inventory' | 'margin' | 'monthly' | 'top-products' | 'cashier' | 'expenses' | 'vendors' | 'errors'

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('sales')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const { role } = useAuth()
  const syncKey = useLiveQuery(async () => {
    const [
      sales,
      saleReturns,
      products,
      batches,
      customers,
      creditLedger,
      daySessions,
      cashEntries,
      expenses,
      vendors,
      grns,
      rtvs,
      rtvItems,
      employees,
      attendanceLogs,
      leaveRequests,
      staffExternal,
    ] = await Promise.all([
      db.sales.toArray(),
      db.sale_returns.toArray(),
      db.products.toArray(),
      db.batches.toArray(),
      db.customers.toArray(),
      db.credit_ledger.toArray(),
      db.day_sessions.toArray(),
      db.cash_entries.toArray(),
      db.expenses.toArray(),
      db.vendors.toArray(),
      db.grns.toArray(),
      db.rtvs.toArray(),
      db.rtv_items.toArray(),
      db.employees.toArray(),
      db.attendance_logs.toArray(),
      db.leave_requests.toArray(),
      db.staff_external.toArray(),
    ])

    return [
      `sales:${sales.length}:${sales.reduce((sum, sale) => sum + Math.round((sale.grandTotal + (sale.returnTotal ?? 0)) * 100), 0)}:${sales.reduce((sum, sale) => sum + toTimeValue(sale.createdAt) + textChecksum(sale.billNo), 0)}`,
      `sale_returns:${saleReturns.length}:${saleReturns.reduce((sum, entry) => sum + Math.round(entry.totalRefund * 100) + toTimeValue(entry.createdAt), 0)}`,
      `products:${products.length}:${products.reduce((sum, product) => sum + Math.round(product.stock * 100) + Math.round(product.sellingPrice * 100), 0)}:${products.reduce((sum, product) => sum + toTimeValue(product.updatedAt ?? product.createdAt) + textChecksum(product.name), 0)}`,
      `batches:${batches.length}:${batches.reduce((sum, batch) => sum + Math.round(batch.qtyRemaining * 100) + Math.round(batch.purchasePrice * 100), 0)}:${batches.reduce((sum, batch) => sum + toTimeValue(batch.expiryDate) + textChecksum(batch.batchNo), 0)}`,
      `customers:${customers.length}:${customers.reduce((sum, customer) => sum + Math.round(customer.currentBalance * 100) + Math.round(customer.creditLimit * 100) + (customer.creditApproved ? 1 : 0) + (customer.creditRequested ? 1 : 0), 0)}:${customers.reduce((sum, customer) => sum + toTimeValue(customer.updatedAt ?? customer.createdAt) + textChecksum(customer.name), 0)}`,
      `credit_ledger:${creditLedger.length}:${creditLedger.reduce((sum, entry) => sum + Math.round(entry.amount * 100) + toTimeValue(entry.createdAt), 0)}`,
      `day_sessions:${daySessions.length}:${daySessions.reduce((sum, session) => sum + Math.round((session.openingFloat ?? 0) * 100) + Math.round((session.closingCash ?? 0) * 100) + textChecksum(session.status), 0)}:${daySessions.reduce((sum, session) => sum + toTimeValue(session.openedAt) + toTimeValue(session.closedAt), 0)}`,
      `cash_entries:${cashEntries.length}:${cashEntries.reduce((sum, entry) => sum + Math.round(entry.amount * 100) + toTimeValue(entry.createdAt), 0)}`,
      `expenses:${expenses.length}:${expenses.reduce((sum, entry) => sum + Math.round(entry.amount * 100) + toTimeValue(entry.updatedAt ?? entry.createdAt), 0)}`,
      `vendors:${vendors.length}:${vendors.reduce((sum, vendor) => sum + (vendor.isActive ? 1 : 0) + textChecksum(vendor.name), 0)}:${vendors.reduce((sum, vendor) => sum + toTimeValue(vendor.updatedAt ?? vendor.createdAt), 0)}`,
      `grns:${grns.length}:${grns.reduce((sum, grn) => sum + Math.round(grn.totalValue * 100) + toTimeValue(grn.createdAt), 0)}`,
      `rtvs:${rtvs.length}:${rtvs.reduce((sum, rtv) => sum + Math.round(rtv.totalValue * 100) + toTimeValue(rtv.createdAt), 0)}`,
      `rtv_items:${rtvItems.length}:${rtvItems.reduce((sum, item) => sum + Math.round(item.qty * 100) + Math.round(item.purchasePrice * 100), 0)}`,
      `employees:${employees.length}:${employees.reduce((sum, employee) => sum + (employee.isActive ? 1 : 0) + textChecksum(employee.name) + textChecksum(employee.role), 0)}:${employees.reduce((sum, employee) => sum + toTimeValue(employee.updatedAt ?? employee.createdAt), 0)}`,
      `attendance:${attendanceLogs.length}:${attendanceLogs.reduce((sum, log) => sum + textChecksum(log.status) + toTimeValue(log.checkIn) + toTimeValue(log.checkOut), 0)}`,
      `leave:${leaveRequests.length}:${leaveRequests.reduce((sum, request) => sum + textChecksum(request.status) + toTimeValue(request.createdAt) + toTimeValue(request.approvedAt), 0)}`,
      `external:${staffExternal.length}:${staffExternal.reduce((sum, staff) => sum + (staff.isActive ? 1 : 0) + textChecksum(staff.name) + textChecksum(staff.designation), 0)}:${staffExternal.reduce((sum, staff) => sum + toTimeValue(staff.updatedAt ?? staff.createdAt), 0)}`,
    ].join('|')
  }, []) ?? 'boot'

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
      {/* Report selector — inline groups separated by thin dividers */}
      <div className="flex flex-wrap items-center gap-y-2 mb-5">
        {TAB_GROUPS.map((group, gi) => {
          const visibleTabs = group.tabs.filter((t) => !t.adminOnly || role === 'admin')
          if (visibleTabs.length === 0) return null
          return (
            <Fragment key={group.label}>
              {gi > 0 && <span className="self-stretch w-px bg-gray-200 mx-3 my-0.5 flex-shrink-0" />}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-0.5 flex-shrink-0">{group.label}</span>
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
            </Fragment>
          )
        })}
      </div>

      {tab === 'sales' && <SalesTab key={`sales-${reportDate}-${syncKey}`} reportDate={reportDate} onDateChange={setReportDate} />}
      {tab === 'stock' && <StockTab key={`stock-${syncKey}`} />}
      {tab === 'inventory' && <InventoryTab key={`inventory-${syncKey}`} />}
      {tab === 'bills' && <BillsTab key={`bills-${syncKey}`} />}
      {tab === 'grn' && <GrnTab key={`grn-${syncKey}`} />}
      {tab === 'rtv' && <RtvTab key={`rtv-${syncKey}`} />}
      {tab === 'credit' && <CreditTab key={`credit-${syncKey}`} />}
      {tab === 'margin' && <ProfitMarginTab key={`margin-${syncKey}`} />}
      {tab === 'monthly' && <MonthlySummaryTab key={`monthly-${syncKey}`} />}
      {tab === 'top-products' && <TopProductsTab key={`top-products-${syncKey}`} />}
      {tab === 'cashier' && <CashierReportTab key={`cashier-${syncKey}`} />}
      {tab === 'expenses' && <ExpenseTab key={`expenses-${syncKey}`} />}
      {tab === 'vendors' && <VendorSummaryTab key={`vendors-${syncKey}`} />}
      {tab === 'errors' && <ErrorLogTab key={`errors-${syncKey}`} />}
    </PageContainer>
  )
}
