import { useState } from 'react'
import { AlertTriangle, PackageX, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { NEAR_EXPIRY_DAYS } from '@/constants/app'
import type { Product } from '@/types'

type NearExpiryBatch = {
  id?: number
  productName?: string
  batchNo: string
  expiryDate: Date
  qtyRemaining: number
}

interface Props {
  lowStock: Product[]
  nearExpiry: NearExpiryBatch[]
  defaultExpanded?: boolean
}

export function InventoryAlertsPanel({ lowStock, nearExpiry, defaultExpanded = true }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const alertCount = lowStock.length + nearExpiry.length

  if (alertCount === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">Inventory Alerts</span>
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
            {alertCount}
          </span>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-amber-600" />
          : <ChevronDown size={16} className="text-amber-600" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-amber-200">

          {/* Low Stock */}
          <div className="px-4 py-3 sm:border-r sm:border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <PackageX size={14} className="text-red-500" />
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                Low Stock ({lowStock.length})
              </p>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-xs text-gray-400">All products sufficiently stocked.</p>
            ) : (
              <div className="space-y-1.5">
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-800 truncate">{p.name}</span>
                    <span className="ml-2 shrink-0 font-semibold text-red-600">
                      {p.stock} / {p.reorderLevel} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Near Expiry */}
          <div className="px-4 py-3 border-t border-amber-200 sm:border-t-0">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-amber-600" />
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Near Expiry ({nearExpiry.length})
              </p>
            </div>
            {nearExpiry.length === 0 ? (
              <p className="text-xs text-gray-400">No batches expiring within {NEAR_EXPIRY_DAYS} days.</p>
            ) : (
              <div className="space-y-1.5">
                {nearExpiry.map((b) => {
                  const exp = b.expiryDate instanceof Date ? b.expiryDate : new Date(b.expiryDate)
                  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000)
                  return (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-800">{b.productName}</span>
                        <span className="ml-1 text-xs text-gray-400">#{b.batchNo}</span>
                      </div>
                      <span className={`ml-2 shrink-0 font-semibold text-xs ${daysLeft <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                        {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
