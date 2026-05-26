import { cn } from '@/lib/utils'

interface ErrorAlertProps {
  message: string
  className?: string
  onRetry?: () => void
}

export function ErrorAlert({ message, className, onRetry }: ErrorAlertProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-red-500 bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold">Erro</h3>
          <p className="mt-1 text-sm">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
