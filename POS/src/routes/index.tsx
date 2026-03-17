import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { ProtectedFeatureRoute } from '@/components/common/ProtectedFeatureRoute'
import { LoginScreen } from '@/auth/LoginScreen'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { BillingPage } from '@/pages/billing/BillingPage'
import { ProductsPage } from '@/pages/inventory/ProductsPage'
import { ReceiveStockPage } from '@/pages/inventory/ReceiveStockPage'
import { ShiftClosePage } from '@/pages/inventory/ShiftClosePage'
import { CashOutPage } from '@/pages/inventory/CashOutPage'
import { VendorsPage } from '@/pages/inventory/VendorsPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { MigrationPage } from '@/pages/settings/MigrationPage'
import { ErrorLogPage } from '@/pages/settings/ErrorLogPage'
import { AttendancePage } from '@/pages/attendance/AttendancePage'
import { ROUTES } from '@/constants/routes'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginScreen />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.BILLING} replace />} />

        {/* Plan-gated: dashboard requires 'dashboard' feature (pro+) */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager']}>
              <ProtectedFeatureRoute feature="dashboard">
                <DashboardPage />
              </ProtectedFeatureRoute>
            </ProtectedRoute>
          }
        />

        {/* Always available (free tier) */}
        <Route path={ROUTES.BILLING} element={<BillingPage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
        <Route path={ROUTES.RECEIVE_STOCK} element={<ReceiveStockPage />} />
        <Route path={ROUTES.SHIFT_CLOSE} element={
          <ProtectedRoute requiredRoles={['admin', 'manager', 'cashier']}>
            <ShiftClosePage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.CASH_OUT} element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <CashOutPage />
          </ProtectedRoute>
        } />

        {/* Plan-gated: vendors requires 'rtv' feature (pro+) */}
        <Route
          path={ROUTES.VENDORS}
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager']}>
              <ProtectedFeatureRoute feature="rtv">
                <VendorsPage />
              </ProtectedFeatureRoute>
            </ProtectedRoute>
          }
        />

        {/* Plan-gated: customers requires 'credit_ledger' feature (pro+) */}
        <Route
          path={ROUTES.CUSTOMERS}
          element={
            <ProtectedFeatureRoute feature="credit_ledger">
              <CustomersPage />
            </ProtectedFeatureRoute>
          }
        />

        {/* Plan-gated: reports requires 'reports' feature (pro+) */}
        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager']}>
              <ProtectedFeatureRoute feature="reports">
                <ReportsPage />
              </ProtectedFeatureRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.USERS}
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.MIGRATION}
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <MigrationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.ERROR_LOG}
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <ErrorLogPage />
            </ProtectedRoute>
          }
        />

        {/* Plan-gated: attendance requires 'attendance' feature (pro+) */}
        <Route
          path={ROUTES.ATTENDANCE}
          element={
            <ProtectedFeatureRoute feature="attendance">
              <AttendancePage />
            </ProtectedFeatureRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.BILLING} replace />} />
    </Routes>
  )
}
