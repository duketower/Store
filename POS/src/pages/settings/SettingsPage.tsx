import { useEffect, useState } from 'react'
import { Save, RotateCcw, AlertTriangle, Info, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { CLIENT_CONFIG, APP_BUILD } from '@/constants/clientConfig'
import { isLicenseExpired } from '@/constants/features'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { putPerformanceTargets } from '@/db/queries/performanceTargets'
import { putStoreSettings } from '@/db/queries/storeSettings'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { loadStoreConfig } from '@/utils/storeConfig'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/date'
import type { StoreConfig } from '@/types'

export function SettingsPage() {
  const { addToast } = useUiStore()
  const { employeeId, role } = useAuth()
  const [form, setForm] = useState<StoreConfig>(loadStoreConfig)
  const [saved, setSaved] = useState(false)
  const [storeLoading, setStoreLoading] = useState(true)
  const [storeDirty, setStoreDirty] = useState(false)
  const [targetForm, setTargetForm] = useState({
    monthlySalesTarget: '0',
    monthlyBreakEvenTarget: '0',
  })
  const [targetsLoading, setTargetsLoading] = useState(true)
  const [targetsSaving, setTargetsSaving] = useState(false)
  const [targetsSaved, setTargetsSaved] = useState(false)
  const [targetsDirty, setTargetsDirty] = useState(false)
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine)

  const liveStoreSettings = useFirestoreDataStore((s) => s.storeSettings)
  const liveTargets = useFirestoreDataStore((s) => s.performanceTargets)

  useEffect(() => {
    if (!liveStoreSettings) return
    if (!storeDirty) setForm(liveStoreSettings.config)
    setStoreLoading(false)
  }, [liveStoreSettings, storeDirty])

  useEffect(() => {
    if (!liveTargets) return
    if (!targetsDirty) {
      setTargetForm({
        monthlySalesTarget: String(liveTargets.monthlySalesTarget || 0),
        monthlyBreakEvenTarget: String(liveTargets.monthlyBreakEvenTarget || 0),
      })
    }
    setTargetsLoading(false)
  }, [liveTargets, targetsDirty])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const set = (key: keyof StoreConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setSaved(false)
    setStoreDirty(true)
  }

  const setTarget = (key: keyof typeof targetForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetForm((prev) => ({ ...prev, [key]: e.target.value }))
    setTargetsSaved(false)
    setTargetsDirty(true)
  }

  const canEditSharedSettings = role === 'admin'

  const handleSave = async () => {
    await putStoreSettings({
      config: form,
      updatedAt: new Date(),
      updatedBy: employeeId ?? undefined,
    })
    setStoreDirty(false)
    setSaved(true)
    addToast('success', 'Settings saved')
  }

  // Reset reverts to the build-time CLIENT_CONFIG defaults, not hardcoded fallbacks
  const handleReset = async () => {
    const resetConfig = { ...CLIENT_CONFIG.store }
    setForm(resetConfig)
    await putStoreSettings({
      config: resetConfig,
      updatedAt: new Date(),
      updatedBy: employeeId ?? undefined,
    })
    setStoreDirty(false)
    setSaved(false)
    addToast('success', 'Reset to defaults')
  }

  const handleSaveTargets = async () => {
    setTargetsSaving(true)
    try {
      await putPerformanceTargets({
        monthlySalesTarget: Math.max(0, Number(targetForm.monthlySalesTarget || 0)),
        monthlyBreakEvenTarget: Math.max(0, Number(targetForm.monthlyBreakEvenTarget || 0)),
        updatedAt: new Date(),
        updatedBy: employeeId ?? undefined,
      })
      setTargetsDirty(false)
      setTargetsSaved(true)
      addToast('success', 'Performance targets saved')
    } finally {
      setTargetsSaving(false)
    }
  }

  const fields: Array<{ key: keyof StoreConfig; label: string; placeholder: string }> = [
    { key: 'name',             label: 'Store Name',                  placeholder: 'My Grocery Store' },
    { key: 'address',          label: 'Address',                     placeholder: '123 Market Street' },
    { key: 'city',             label: 'City & State',                placeholder: 'Mumbai, Maharashtra' },
    { key: 'phone',            label: 'Phone',                       placeholder: '+91 98765 43210' },
    { key: 'gstin',            label: 'GSTIN',                       placeholder: '27AAAAA0000A1Z5' },
    { key: 'upiVpa',           label: 'UPI VPA',                     placeholder: 'store@upi' },
    { key: 'sheetsWebAppUrl',  label: 'Google Sheets Web App URL',   placeholder: 'https://script.google.com/macros/s/…/exec' },
  ]

  return (
    <PageContainer title="Settings" subtitle="Store configuration printed on receipts">
      <div className="max-w-lg space-y-6">

        {/* Store Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Store Details</h3>
          <p className="text-sm text-gray-500">
            Shared across devices. Receipts, payment QR, and export links all read from these details.
          </p>
          {storeLoading ? (
            <p className="text-sm text-gray-400">Loading shared store details…</p>
          ) : (
            fields.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  disabled={!canEditSharedSettings}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => void handleSave()} disabled={!canEditSharedSettings || storeLoading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            <Save size={15} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
          <button onClick={() => void handleReset()} disabled={!canEditSharedSettings || storeLoading} className="btn-secondary flex items-center gap-2 disabled:opacity-60">
            <RotateCcw size={15} />
            Reset to Defaults
          </button>
        </div>

        <p className="text-xs text-gray-400">
          {canEditSharedSettings ? 'Changes take effect immediately on new receipts.' : 'Only admins can edit shared store details.'}
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp size={14} />
            Performance Targets
          </h3>
          <p className="text-sm text-gray-500">
            Shared across devices. Daily sales target is calculated automatically from the monthly sales target.
          </p>

          {targetsLoading ? (
            <p className="text-sm text-gray-400">Loading shared targets…</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Sales Target (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={targetForm.monthlySalesTarget}
                    onChange={setTarget('monthlySalesTarget')}
                    disabled={!canEditSharedSettings}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Break-even Target (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={targetForm.monthlyBreakEvenTarget}
                    onChange={setTarget('monthlyBreakEvenTarget')}
                    disabled={!canEditSharedSettings}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void handleSaveTargets()}
                  disabled={targetsSaving || !canEditSharedSettings}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60"
                >
                  <Save size={15} />
                  {targetsSaving ? 'Saving…' : targetsSaved ? 'Saved!' : 'Save Targets'}
                </button>
                <p className="text-xs text-gray-400">
                  {canEditSharedSettings
                    ? 'Dashboard compares today\'s sales and month-to-date net profit against these shared targets.'
                    : 'Only admins can edit shared targets.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Data Sync */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Data Sync</h3>
          <div>
            <Link to={ROUTES.ERROR_LOG} className="btn-secondary inline-flex items-center gap-2 text-sm">
              <AlertTriangle size={15} />
              Error Log
            </Link>
            <p className="text-xs text-gray-400 mt-2">View uncaught errors and crashes logged from all devices.</p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">Sync Status</p>
            <p className="text-xs text-gray-500 mt-1">
              {isOnline ? 'Online — writes go directly to Firestore.' : 'Offline — reconnect to sync changes.'}
            </p>
          </div>
        </div>

        {/* About / Diagnostics
            Shows build-time metadata for support — tells you exactly which client build
            is running, what plan they are on, and whether the license is active. */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Info size={14} />
            About
          </h3>
          {[
            { label: 'App',       value: CLIENT_CONFIG.brand.appName },
            { label: 'Client ID', value: CLIENT_CONFIG.clientId },
            { label: 'Plan',      value: CLIENT_CONFIG.plan.charAt(0).toUpperCase() + CLIENT_CONFIG.plan.slice(1) },
            { label: 'License',   value: isLicenseExpired(CLIENT_CONFIG.licenseExpiresAt)
                ? '⚠ Expired'
                : `Active until ${formatDate(new Date(CLIENT_CONFIG.licenseExpiresAt))}` },
            { label: 'Version',   value: APP_BUILD.version },
            { label: 'Build',     value: `${APP_BUILD.gitCommit} · ${formatDate(new Date(APP_BUILD.builtAt))}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-mono text-gray-800 text-right">{value}</span>
            </div>
          ))}
        </div>

      </div>
    </PageContainer>
  )
}
