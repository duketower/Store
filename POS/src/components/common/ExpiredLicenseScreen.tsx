// Shown instead of the full app when the client's license has expired.
// Rendered in main.tsx before React app mounts — no navigation or auth needed.

import { ShieldAlert } from 'lucide-react'
import { CLIENT_CONFIG } from '@/constants/clientConfig'
import { formatDate } from '@/utils/date'

export function ExpiredLicenseScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldAlert className="text-red-600" size={40} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">License Expired</h1>
          <p className="text-gray-500 text-sm">
            Your subscription for <span className="font-medium text-gray-700">{CLIENT_CONFIG.brand.appName}</span> has expired.
            Please contact support to renew.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Client ID</span>
            <span className="font-mono text-gray-800">{CLIENT_CONFIG.clientId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expired on</span>
            <span className="text-red-600 font-medium">
              {formatDate(new Date(CLIENT_CONFIG.licenseExpiresAt))}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Contact your POS provider to renew your subscription and restore access.
        </p>
      </div>
    </div>
  )
}
