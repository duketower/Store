import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginScreen } from '@/auth/LoginScreen'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { BillingPage } from '@/pages/billing/BillingPage'
import { ProductsPage } from '@/pages/inventory/ProductsPage'
import { ReceiveStockPage } from '@/pages/inventory/ReceiveStockPage'
import { ShiftClosePage } from '@/pages/inventory/ShiftClosePage'
import { VendorsPage } from '@/pages/inventory/VendorsPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { MigrationPage } from '@/pages/settings/MigrationPage'
import { ErrorLogPage } from '@/pages/settings/ErrorLogPage'
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
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />

        <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute requiredRoles={['admin', 'manager']}><DashboardPage /></ProtectedRoute>} />

        <Route path={ROUTES.BILLING} element={<BillingPage />} />

        <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />

        <Route path={ROUTES.RECEIVE_STOCK} element={<ReceiveStockPage />} />

        <Route
          path={ROUTES.VENDORS}
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager']}>
              <VendorsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.SHIFT_CLOSE}
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager', 'cashier']}>
              <ShiftClosePage />
            </ProtectedRoute>
          }
        />

        <Route path={ROUTES.CUSTOMERS} element={<CustomersPage />} />

        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager']}>
              <ReportsPage />
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
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.BILLING} replace />} />
    </Routes>
  )
}
