import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react'
import { firestore } from '@/services/firebase'
import { PageContainer } from '@/components/layout/PageContainer'

interface ErrorEntry {
  id: string
  type: string
  message: string
  stack: string | null
  url: string
  userAgent: string
  createdAt: Date
}

const TYPE_STYLES: Record<string, string> = {
  uncaught_error: 'bg-red-100 text-red-700',
  unhandled_rejection: 'bg-orange-100 text-orange-700',
}

function formatTime(d: Date): string {
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function ErrorLogPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const q = query(
        collection(firestore, 'errors'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const snap = await getDocs(q)
      setErrors(
        snap.docs.map((doc) => {
          const d = doc.data()
          return {
            id: doc.id,
            type: d.type ?? 'unknown',
            message: d.message ?? '',
            stack: d.stack ?? null,
            url: d.url ?? '',
            userAgent: d.userAgent ?? '',
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt),
          }
        })
      )
    } catch (err) {
      setFetchError('Failed to load errors from Firestore.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <PageContainer title="Error Log" subtitle="Uncaught errors and unhandled rejections logged from all devices">
      <div className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Last 100 errors, newest first.</p>
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {fetchError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {!loading && !fetchError && errors.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
            <p className="text-sm font-medium text-gray-600">No errors logged</p>
            <p className="text-xs text-gray-400 mt-1">All clear across all devices.</p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {errors.map((err) => {
              const isOpen = expanded.has(err.id)
              const typeStyle = TYPE_STYLES[err.type] ?? 'bg-gray-100 text-gray-600'
              return (
                <div key={err.id}>
                  <button
                    onClick={() => toggle(err.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3"
                  >
                    <span className="mt-0.5 text-gray-300">
                      {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </span>
                    <AlertTriangle size={15} className="mt-0.5 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeStyle}`}>
                          {err.type}
                        </span>
                        <span className="text-xs text-gray-400">{formatTime(err.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1 truncate">{err.message}</p>
                      <p className="text-xs text-gray-400 truncate">{err.url}</p>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3">
                      {err.stack && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Stack Trace</p>
                          <pre className="text-xs text-gray-700 bg-white border border-gray-200 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
                            {err.stack}
                          </pre>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Device</p>
                        <p className="text-xs text-gray-600 break-all">{err.userAgent}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Page URL</p>
                        <p className="text-xs text-gray-600 break-all">{err.url}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
