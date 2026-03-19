import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, CheckCircle, Check } from 'lucide-react'
import { firestore } from '@/services/firebase'
import { formatDateTime } from '@/utils/date'

interface ErrorEntry {
  id: string
  type: string
  message: string
  stack: string | null
  url: string
  userAgent: string
  appVersion: string | null
  gitCommit: string | null
  createdAt: Date
  resolved?: boolean
}

interface ErrorGroup {
  message: string
  type: string
  count: number
  firstSeen: Date
  lastSeen: Date
  latestEntry: ErrorEntry
  entries: ErrorEntry[]
  resolved: boolean
}

const TYPE_STYLES: Record<string, string> = {
  uncaught_error: 'bg-red-100 text-red-700',
  unhandled_rejection: 'bg-orange-100 text-orange-700',
}

function groupErrors(errors: ErrorEntry[]): ErrorGroup[] {
  const map: Record<string, ErrorGroup> = {}
  for (const err of errors) {
    const key = err.message
    if (!map[key]) {
      map[key] = {
        message: err.message,
        type: err.type,
        count: 0,
        firstSeen: err.createdAt,
        lastSeen: err.createdAt,
        latestEntry: err,
        entries: [],
        resolved: err.resolved ?? false,
      }
    }
    map[key].count += 1
    if (err.createdAt < map[key].firstSeen) map[key].firstSeen = err.createdAt
    if (err.createdAt > map[key].lastSeen) {
      map[key].lastSeen = err.createdAt
      map[key].latestEntry = err
    }
    map[key].entries.push(err)
    // Group is unresolved if any entry is unresolved
    if (!err.resolved) map[key].resolved = false
  }
  return Object.values(map).sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
}

export function ErrorLogTab() {
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showResolved, setShowResolved] = useState(true)
  const [resolving, setResolving] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const q = query(collection(firestore, 'errors'), orderBy('createdAt', 'desc'), limit(200))
      const snap = await getDocs(q)
      setErrors(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            type: data.type ?? 'unknown',
            message: data.message ?? '',
            stack: data.stack ?? null,
            url: data.url ?? '',
            userAgent: data.userAgent ?? '',
            appVersion: data.appVersion ?? null,
            gitCommit: data.gitCommit ?? null,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            resolved: data.resolved ?? false,
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

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const markResolved = async (group: ErrorGroup) => {
    const ids = group.entries.map((e) => e.id)
    setResolving((prev) => new Set([...prev, group.message]))
    try {
      await Promise.all(ids.map((id) => updateDoc(doc(firestore, 'errors', id), { resolved: true })))
      setErrors((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, resolved: true } : e))
    } catch {
      // best-effort
    } finally {
      setResolving((prev) => { const next = new Set(prev); next.delete(group.message); return next })
    }
  }

  const allGroups = groupErrors(errors)
  const groups = showResolved ? allGroups : allGroups.filter((g) => !g.resolved)
  const resolvedCount = allGroups.filter((g) => g.resolved).length

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{allGroups.length} unique error{allGroups.length !== 1 ? 's' : ''} logged</p>
          {resolvedCount > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded text-brand-600"
              />
              Show resolved ({resolvedCount})
            </label>
          )}
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {fetchError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{fetchError}</div>
      )}

      {!loading && !fetchError && groups.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
          <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
          <p className="text-sm font-medium text-gray-600">
            {resolvedCount > 0 ? 'All errors resolved' : 'No errors logged'}
          </p>
          <p className="text-xs text-gray-400 mt-1">All clear across all devices.</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {groups.map((group) => {
            const isOpen = expanded.has(group.message)
            const typeStyle = TYPE_STYLES[group.type] ?? 'bg-gray-100 text-gray-600'
            const isResolving = resolving.has(group.message)
            const daysSince = Math.floor((Date.now() - group.lastSeen.getTime()) / 86400000)
            const lastSeenLabel = daysSince === 0 ? 'today' : daysSince === 1 ? 'yesterday' : `${daysSince}d ago`

            return (
              <div key={group.message} className={group.resolved ? 'opacity-50' : ''}>
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                  <button onClick={() => toggle(group.message)} className="mt-0.5 text-gray-300 flex-shrink-0">
                    {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                  <AlertTriangle size={15} className="mt-0.5 text-red-400 flex-shrink-0" />
                  <button onClick={() => toggle(group.message)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeStyle}`}>{group.type}</span>
                      {group.count > 1 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          ×{group.count}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">last seen {lastSeenLabel}</span>
                      {group.latestEntry.gitCommit && (
                        <span className="font-mono text-xs text-gray-300">{group.latestEntry.gitCommit}</span>
                      )}
                      {group.resolved && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Resolved</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 mt-1 truncate">{group.message}</p>
                  </button>
                  {!group.resolved && (
                    <button
                      onClick={() => markResolved(group)}
                      disabled={isResolving}
                      className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                      title="Mark as resolved"
                    >
                      <Check size={13} />
                      {isResolving ? 'Saving…' : 'Resolve'}
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3">
                    {/* Timeline */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-medium text-gray-500 mb-0.5">First seen</p>
                        <p className="text-gray-700">{formatDateTime(group.firstSeen)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500 mb-0.5">Last seen</p>
                        <p className="text-gray-700">{formatDateTime(group.lastSeen)}</p>
                      </div>
                      {group.latestEntry.appVersion && (
                        <div>
                          <p className="font-medium text-gray-500 mb-0.5">App version</p>
                          <p className="font-mono text-gray-700">{group.latestEntry.appVersion} · {group.latestEntry.gitCommit}</p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-500 mb-0.5">Occurrences</p>
                        <p className="text-gray-700">{group.count} time{group.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {group.latestEntry.stack && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Stack Trace</p>
                        <pre className="text-xs text-gray-700 bg-white border border-gray-200 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
                          {group.latestEntry.stack}
                        </pre>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div>
                        <p className="font-medium text-gray-500 mb-0.5">Page</p>
                        <p className="text-gray-600 break-all">{group.latestEntry.url}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500 mb-0.5">Device</p>
                        <p className="text-gray-600 break-all">{group.latestEntry.userAgent}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
