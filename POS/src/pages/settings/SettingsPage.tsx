import { useEffect, useState } from 'react'
import { Save, RotateCcw, DatabaseZap, AlertTriangle, Info, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { CLIENT_CONFIG, APP_BUILD } from '@/constants/clientConfig'
import { isLicenseExpired } from '@/constants/features'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { getPerformanceTargets, putPerformanceTargets } from '@/db/queries/performanceTargets'
import { getOutboxSummary, listPendingOutboxEntries } from '@/db/queries/outbox'
import { getStoreSettings, putStoreSettings } from '@/db/queries/storeSettings'
import { flushOutbox } from '@/services/sync/outbox'
import { loadStoreConfig } from '@/utils/storeConfig'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/date'
import type { OutboxEntry, StoreConfig } from '@/types'

export function SettingsPage() {
  const { addToast } = useUiStore()
  const { employeeId, role } = useAuth()
  const [form, setForm] = useState<StoreConfig>(loadStoreConfig)
  const [saved, setSaved] = useState(false)
  const [storeLoading, setStoreLoading] = useState(true)
  const [targetForm, setTargetForm] = useState({
    monthlySalesTarget: '0',
    monthlyBreakEvenTarget: '0',
  })
  const [targetsLoading, setTargetsLoading] = useState(true)
  const [targetsSaving, setTargetsSaving] = useState(false)
  const [targetsSaved, setTargetsSaved] = useState(false)
  const [syncEntries, setSyncEntries] = useState<OutboxEntry[]>([])
  const [syncSummary, setSyncSummary] = useState({ pending: 0, failed: 0, syncing: 0 })
  const [syncRefreshing, setSyncRefreshing] = useState(false)
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine)

  useEffect(() => {
    let active = true

    getStoreSettings()
      .then((settings) => {
        if (!active) return
        setForm(settings.config)
      })
      .finally(() => {
        if (active) setStoreLoading(false)
      })

    getPerformanceTargets()
      .then((targets) => {
        if (!active) return
        setTargetForm({
          monthlySalesTarget: String(targets.monthlySalesTarget || 0),
          monthlyBreakEvenTarget: String(targets.monthlyBreakEvenTarget || 0),
        })
      })
      .finally(() => {
        if (active) setTargetsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const refreshSyncState = async () => {
      const [entries, summary] = await Promise.all([listPendingOutboxEntries(), getOutboxSummary()])
      if (!active) return
      setSyncEntries(entries)
      setSyncSummary(summary)
    }

    void refreshSyncState()
    const interval = window.setInterval(() => {
      void refreshSyncState()
    }, 4000)

    const handleOnline = () => {
      setIsOnline(true)
      void refreshSyncState()
    }
    const handleOffline = () => {
      setIsOnline(false)
      void refreshSyncState()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const set = (key: keyof StoreConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setSaved(false)
  }

  const setTarget = (key: keyof typeof targetForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetForm((prev) => ({ ...prev, [key]: e.target.value }))
    setTargetsSaved(false)
  }

  const canEditSharedSettings = role === 'admin'

  const handleSave = async () => {
    await putStoreSettings({
      config: form,
      updatedAt: new Date(),
      updatedBy: employeeId ?? undefined,
    })
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
      setTargetsSaved(true)
      addToast('success', 'Performance targets saved')
    } finally {
      setTargetsSaving(false)
    }
  }

  const handleRetrySync = async () => {
    setSyncRefreshing(true)
    try {
      await flushOutbox()
      const [entries, summary] = await Promise.all([listPendingOutboxEntries(), getOutboxSummary()])
      setSyncEntries(entries)
      setSyncSummary(summary)
      addToast('success', summary.pending === 0 && summary.failed === 0 ? 'All pending updates synced' : 'Sync retry completed')
    } finally {
      setSyncRefreshing(false)
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
            <Link to={ROUTES.MIGRATION} className="btn-secondary inline-flex items-center gap-2 text-sm">
              <DatabaseZap size={15} />
              Firestore Migration
            </Link>
            <p className="text-xs text-gray-400 mt-2">One-time sync of local data, including shared expenses, to Firestore for multi-device support.</p>
          </div>
          <div>
            <Link to={ROUTES.ERROR_LOG} className="btn-secondary inline-flex items-center gap-2 text-sm">
              <AlertTriangle size={15} />
              Error Log
            </Link>
            <p className="text-xs text-gray-400 mt-2">View uncaught errors and crashes logged from all devices.</p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Pending Sync Queue</p>
                <p className="text-xs text-gray-500">
                  {isOnline ? 'Online' : 'Offline'} · Pending {syncSummary.pending} · Failed {syncSummary.failed} · Syncing {syncSummary.syncing}
                </p>
              </div>
              <button
                onClick={handleRetrySync}
                disabled={syncRefreshing || !isOnline}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {syncRefreshing ? 'Retrying…' : 'Retry Sync Now'}
              </button>
            </div>

            {syncEntries.length === 0 ? (
              <p className="text-xs text-gray-500">No pending updates. Shared data is currently in sync.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                <div className="divide-y divide-gray-100">
                  {syncEntries.slice(0, 20).map((entry) => (
                    <div key={entry.id} className="px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-800">
                          {entry.entityType.replace(/_/g, ' ')} · {entry.action.replace(/_/g, ' ')}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            entry.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : entry.status === 'syncing'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {entry.entityKey ?? 'No key'} · queued {formatDate(new Date(entry.createdAt))}
                        {entry.retryCount > 0 ? ` · retries ${entry.retryCount}` : ''}
                      </p>
                      {entry.lastError && (
                        <p className="mt-1 text-[11px] text-red-600">{entry.lastError}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
