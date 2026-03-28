import LoadingBottle from '@/components/ui/loading-bottle'
import { CLIENT_CONFIG } from '@/constants/clientConfig'

interface AppLoadingScreenProps {
  message?: string
}

export function AppLoadingScreen({
  message = 'Preparing your POS workspace and syncing the latest data.',
}: AppLoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center sm:max-w-md">
        <div className="w-full rounded-[28px] bg-white/90 p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200/80 backdrop-blur sm:p-8 md:p-10">
          <LoadingBottle />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Starting Up
          </p>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {CLIENT_CONFIG.brand.appName}
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-6 text-slate-500 sm:max-w-sm sm:text-base">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
