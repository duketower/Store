import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const TOAST_STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  info:    'bg-brand-50 border-brand-200 text-brand-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const TOAST_ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
  warning: AlertTriangle,
}

export function Toast() {
  const { toasts, removeToast } = useUiStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = TOAST_ICONS[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-3 shadow-md text-sm font-medium',
              TOAST_STYLES[toast.type]
            )}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 rounded p-0.5 opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
