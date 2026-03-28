import { cn } from '@/utils/cn'

interface LoadingBottleProps {
  className?: string
}

export default function LoadingBottle({ className }: LoadingBottleProps) {
  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-live="polite">
      <svg
        viewBox="0 0 205 615"
        className="loading-bottle h-auto w-14 text-[var(--brand-primary,#2563eb)] sm:w-16 md:w-20"
        fill="none"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M47 595c-8 0-26-6-26-34V261c0-17 9-29 16-38s16-28 16-28L68 59l-4-5s3-30 7-36 14-6 32-6 28 0 32 6 7 36 7 36l-4 5 15 136s9 19 16 28 16 21 16 38v300c0 28-18 34-26 34H47z" />
      </svg>
      <span className="sr-only">Loading application</span>
    </div>
  )
}
