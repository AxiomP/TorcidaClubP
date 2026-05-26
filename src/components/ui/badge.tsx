import React from 'react'
import { cn } from '@/lib/utils/cn'

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'gray' | 'default' | 'secondary' | 'outline' | 'destructive'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const badgeVariants: Record<BadgeVariant, string> = {
  success: 'badge-success',
  error: 'badge-error',
  warning: 'badge-warning',
  info: 'badge-info',
  gray: 'badge-gray',
  default: 'badge-gray',
  secondary: 'badge-secondary',
  outline: 'badge-outline',
  destructive: 'badge-error',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('badge', badgeVariants[variant], className)}>
      {children}
    </span>
  )
}

// Helper para status de pagamento
export function PagamentoStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
    pendente: { label: 'Pendente', variant: 'warning' },
    comprovante_enviado: { label: 'Comprovante Enviado', variant: 'info' },
    confirmado: { label: 'Confirmado', variant: 'success' },
    recusado: { label: 'Recusado', variant: 'error' },
    perdoado: { label: 'Perdoado', variant: 'gray' },
  }

  const statusInfo = statusMap[status] || { label: status, variant: 'gray' as BadgeVariant }

  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
}

// Helper para status de sócio
export function SocioStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
    ativo: { label: 'Ativo', variant: 'success' },
    inadimplente: { label: 'Inadimplente', variant: 'error' },
    bloqueado: { label: 'Bloqueado', variant: 'error' },
    pendente: { label: 'Pendente', variant: 'warning' },
    inativo: { label: 'Inativo', variant: 'gray' },
  }

  const statusInfo = statusMap[status] || { label: status, variant: 'gray' as BadgeVariant }

  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
}
