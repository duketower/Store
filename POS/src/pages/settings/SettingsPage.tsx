import { useState } from 'react'
import { Save, RotateCcw, DatabaseZap, AlertTriangle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { CLIENT_CONFIG, APP_BUILD } from '@/constants/clientConfig'
import { useUiStore } from '@/stores/uiStore'
import { type StoreConfig, loadStoreConfig, saveStoreConfig } from '@/utils/storeConfig'
import { ROUTES } from '@/constants/routes'

export function SettingsPage() {
  const { addToast } = useUiStore()
  const [form, setForm] = useState<StoreConfig>(loadStoreConfig)
  const [saved, setSaved] = useState(false)

  const set = (key: keyof StoreConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setSaved(false)
  }

  const handleSave = () => {
    saveStoreConfig(form)
    setSaved(true)
    addToast('success', 'Settings saved')
  }

  // Reset reverts to the build-time CLIENT_CONFIG defaults, not hardcoded fallbacks
  const handleReset = () => {
    setForm({ ...CLIENT_CONFIG.store })
    saveStoreConfig({ ...CLIENT_CONFIG.store })
    setSaved(false)
    addToast('success', 'Reset to defaults')
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
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={15} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
            <RotateCcw size={15} />
            Reset to Defaults
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Changes take effect immediately on new receipts.
        </p>

        {/* Data Sync */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Data Sync</h3>
          <div>
            <Link to={ROUTES.MIGRATION} className="btn-secondary inline-flex items-center gap-2 text-sm">
              <DatabaseZap size={15} />
              Firestore Migration
            </Link>
            <p className="text-xs text-gray-400 mt-2">One-time sync of local data to Firestore for multi-device support.</p>
          </div>
          <div>
            <Link to={ROUTES.ERROR_LOG} className="btn-secondary inline-flex items-center gap-2 text-sm">
              <AlertTriangle size={15} />
              Error Log
            </Link>
            <p className="text-xs text-gray-400 mt-2">View uncaught errors and crashes logged from all devices.</p>
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
            { label: 'License',   value: new Date(CLIENT_CONFIG.licenseExpiresAt) > new Date()
                ? `Active until ${new Date(CLIENT_CONFIG.licenseExpiresAt).toLocaleDateString('en-IN')}`
                : '⚠ Expired' },
            { label: 'Version',   value: APP_BUILD.version },
            { label: 'Build',     value: `${APP_BUILD.gitCommit} · ${new Date(APP_BUILD.builtAt).toLocaleDateString('en-IN')}` },
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
