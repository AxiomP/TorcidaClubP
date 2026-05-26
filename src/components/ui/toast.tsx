'use client'

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id?: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose?: () => void
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles = {
  success: {
    container: 'border-success bg-success-bg',
    icon: 'text-success',
  },
  error: {
    container: 'border-error bg-error-bg',
    icon: 'text-error',
  },
  warning: {
    container: 'border-warning bg-warning-bg',
    icon: 'text-warning',
  },
  info: {
    container: 'border-info bg-info-bg',
    icon: 'text-info',
  },
}

export function Toast({ type, title, message, onClose }: ToastProps) {
  const Icon = toastIcons[type]
  const styles = toastStyles[type]

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-md gap-3 rounded-lg border-2 p-4 shadow-lg',
        styles.container
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', styles.icon)} />
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        {message && <div className="mt-1 text-sm opacity-90">{message}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {children}
    </div>
  )
}
