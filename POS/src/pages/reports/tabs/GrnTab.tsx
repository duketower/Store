import { useState } from 'react'
import { Truck, Printer } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { getAllGrns, getGrnBatches } from '@/db/queries/grns'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'
import { formatCurrency } from '@/utils/currency'
import { formatDate, formatDateTime } from '@/utils/date'
import { loadStoreConfig } from '@/utils/storeConfig'
import type { Batch, Grn } from '@/types'

export function GrnTab() {
  const [viewGrnId, setViewGrnId] = useState<number | null>(null)
  const [viewGrnBatches, setViewGrnBatches] = useState<Array<Batch & { productName: string }> | null>(null)
  const [viewGrnSession, setViewGrnSession] = useState<Grn | null>(null)
  const [viewGrnCreatorName, setViewGrnCreatorName] = useState('')

  const grnListData = useFirestoreDataStore((s) =>
    [...s.grns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  )
  const employees = useFirestoreDataStore((s) => s.employees)

  const STORE_CONFIG = loadStoreConfig()

  const openGrnDetail = async (grnId: number) => {
    const session = grnListData.find((g) => g.id === grnId) ?? null
    setViewGrnSession(session)
    setViewGrnId(grnId)
    setViewGrnBatches(null)
    const batches = await getGrnBatches(grnId)
    setViewGrnBatches(batches)
    if (session?.createdBy) {
      const emp = employees.find((e) => e.id === session.createdBy)
      setViewGrnCreatorName(emp?.name ?? `Employee #${session.createdBy}`)
    }
  }

  return (
    <div className="space-y-3">
      {grnListData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-400">
          <Truck size={32} className="mx-auto mb-3 opacity-30" />
          <p>No GRN entries yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">GRN ID</th>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Invoice No</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grnListData.map((grn) => (
                <tr key={grn.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openGrnDetail(grn.id!)}
                      className="font-mono text-sm font-bold text-brand-700 hover:underline"
                    >
                      GRN-{String(grn.id).padStart(4, '0')}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDateTime(new Date(grn.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{grn.vendorName ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{grn.invoiceNo ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{grn.lineCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(grn.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GRN Receipt Modal */}
      {viewGrnId !== null && (
        <Modal open onClose={() => { setViewGrnId(null); setViewGrnBatches(null); setViewGrnSession(null) }} title="" size="lg">
          {viewGrnBatches === null ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
          ) : viewGrnSession && (
            <div>
              {/* Print button */}
              <div className="mb-4 flex justify-end print:hidden">
                <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
                  <Printer size={16} /> Print GRN
                </button>
              </div>

              {/* GRN Slip */}
              <div className="border border-gray-300 rounded-lg p-6 space-y-4 font-mono text-sm">
                {/* Header */}
                <div className="text-center space-y-1 border-b border-dashed border-gray-400 pb-4">
                  <p className="text-base font-bold text-gray-900 not-italic">{STORE_CONFIG.name}</p>
                  <p className="text-lg font-bold tracking-widest text-gray-800">GOODS RECEIVED NOTE</p>
                  <p className="text-xs text-gray-500 font-bold tracking-wide">GRN-{String(viewGrnSession.id).padStart(4, '0')}</p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div><span className="text-gray-500">From Vendor: </span><span className="font-bold">{viewGrnSession.vendorName ?? '—'}</span></div>
                  <div><span className="text-gray-500">Date: </span><span className="font-bold">{formatDate(new Date(viewGrnSession.createdAt))}</span></div>
                  {viewGrnSession.invoiceNo && (
                    <div><span className="text-gray-500">Vendor Invoice No: </span><span className="font-bold">{viewGrnSession.invoiceNo}</span></div>
                  )}
                  <div><span className="text-gray-500">Received by: </span><span className="font-bold">{viewGrnCreatorName}</span></div>
                </div>

                {/* Items table */}
                <table className="w-full text-xs border-collapse mt-2">
                  <thead>
                    <tr className="border-b-2 border-gray-400">
                      <th className="py-1.5 text-left text-gray-600 font-semibold">#</th>
                      <th className="py-1.5 text-left text-gray-600 font-semibold">Product</th>
                      <th className="py-1.5 text-left text-gray-600 font-semibold">Batch No</th>
                      <th className="py-1.5 text-left text-gray-600 font-semibold">Mfg Date</th>
                      <th className="py-1.5 text-left text-gray-600 font-semibold">Expiry</th>
                      <th className="py-1.5 text-right text-gray-600 font-semibold">Qty</th>
                      <th className="py-1.5 text-right text-gray-600 font-semibold">Rate (₹)</th>
                      <th className="py-1.5 text-right text-gray-600 font-semibold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewGrnBatches.map((b, idx) => (
                      <tr key={b.id} className="border-b border-gray-200">
                        <td className="py-1.5">{idx + 1}</td>
                        <td className="py-1.5">{b.productName}</td>
                        <td className="py-1.5">{b.batchNo}</td>
                        <td className="py-1.5">{b.mfgDate ? formatDate(new Date(b.mfgDate)) : '—'}</td>
                        <td className="py-1.5">{formatDate(new Date(b.expiryDate))}</td>
                        <td className="py-1.5 text-right">{b.qtyRemaining}</td>
                        <td className="py-1.5 text-right">{b.purchasePrice.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-semibold">{(b.purchasePrice * b.qtyRemaining).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-400">
                      <td colSpan={7} className="py-2 text-right font-bold text-gray-700">Total Purchase Value:</td>
                      <td className="py-2 text-right font-bold text-base">₹{viewGrnBatches.reduce((s, b) => s + b.purchasePrice * b.qtyRemaining, 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signature lines */}
                <div className="grid grid-cols-2 gap-12 pt-10 text-xs text-gray-500">
                  <div className="border-t border-gray-500 pt-1 text-center">Received by (Store)</div>
                  <div className="border-t border-gray-500 pt-1 text-center">Delivered by (Vendor)</div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
