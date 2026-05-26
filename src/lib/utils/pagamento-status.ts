import { PagamentoStatus } from '@/types/pagamento'

/**
 * Helpers for payment status
 */

export interface StatusInfo {
  label: string
  color: 'success' | 'error' | 'warning' | 'info' | 'gray'
  description: string
}

export const STATUS_INFO: Record<PagamentoStatus, StatusInfo> = {
  pendente: {
    label: 'Pendente',
    color: 'warning',
    description: 'Aguardando pagamento do sócio',
  },
  comprovante_enviado: {
    label: 'Comprovante Enviado',
    color: 'info',
    description: 'Aguardando aprovação do gestor',
  },
  confirmado: {
    label: 'Confirmado',
    color: 'success',
    description: 'Pagamento aprovado e confirmado',
  },
  recusado: {
    label: 'Recusado',
    color: 'error',
    description: 'Comprovante recusado pelo gestor',
  },
  perdoado: {
    label: 'Perdoado',
    color: 'gray',
    description: 'Dívida perdoada pelo gestor',
  },
}

export function getStatusInfo(status: PagamentoStatus): StatusInfo {
  return STATUS_INFO[status]
}

export function getStatusLabel(status: PagamentoStatus): string {
  return STATUS_INFO[status].label
}

export function getStatusColor(status: PagamentoStatus): string {
  return STATUS_INFO[status].color
}

/**
 * Check if payment is overdue
 */
export function isOverdue(dataVencimento: string): boolean {
  const today = new Date()
  const vencimento = new Date(dataVencimento)
  return vencimento < today
}

/**
 * Calculate days until due date
 */
export function daysUntilDue(dataVencimento: string): number {
  const today = new Date()
  const vencimento = new Date(dataVencimento)
  const diff = vencimento.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Check if payment can be approved
 */
export function canApprove(status: PagamentoStatus): boolean {
  return status === 'comprovante_enviado' || status === 'recusado'
}

/**
 * Check if payment can be rejected
 */
export function canReject(status: PagamentoStatus): boolean {
  return status === 'comprovante_enviado'
}

/**
 * Check if payment needs action from manager
 */
export function needsManagerAction(status: PagamentoStatus): boolean {
  return status === 'comprovante_enviado'
}
