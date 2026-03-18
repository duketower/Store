import { useState } from 'react'
import { DatabaseZap, CheckCircle, AlertCircle } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { runMigration, type MigrationProgress } from '@/services/sync/migration'

type Status = 'idle' | 'running' | 'done' | 'error'

export function MigrationPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<MigrationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setStatus('running')
    setError(null)
    try {
      await runMigration((p) => setProgress(p))
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <PageContainer title="Firestore Migration" subtitle="One-time sync: local data → Firestore">
      <div className="max-w-md space-y-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Run this once per device</p>
          <p>Copies all products, batches, customers, and employees from IndexedDB to Firestore. Safe to re-run — existing records are overwritten with current values.</p>
        </div>

        {status === 'idle' && (
          <button onClick={handleRun} className="btn-primary flex items-center gap-2">
            <DatabaseZap size={16} />
            Start Migration
          </button>
        )}

        {status === 'running' && progress && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Migrating…</p>
            <ProgressRow label={progress.stage} done={progress.done} total={progress.total} />
          </div>
        )}

        {status === 'done' && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
            <CheckCircle className="text-green-500 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-green-800">Migration complete</p>
              <p className="text-sm text-green-700 mt-0.5">All local data is now in Firestore. Check the Firebase console to confirm.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">Migration failed</p>
              <p className="text-sm text-red-700 mt-0.5 font-mono">{error}</p>
              <button onClick={handleRun} className="mt-3 btn-secondary text-sm">
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

function ProgressRow({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 100
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{total > 0 ? `${done}/${total}` : '✓'}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
