import { StatusPagamento } from '@/lib/mock/pagamentos-mock'
import { cn } from '@/lib/utils'

interface PaymentStatusBadgeProps {
  status: StatusPagamento
  className?: string
}

const statusConfig = {
  pendente: {
    label: 'Pendente',
    className: 'badge-gray',
  },
  comprovante_enviado: {
    label: 'Aguardando Aprovação',
    className: 'badge-warning',
  },
  confirmado: {
    label: 'Confirmado',
    className: 'badge-success',
  },
  recusado: {
    label: 'Recusado',
    className: 'badge-error',
  },
  perdoado: {
    label: 'Perdoado',
    className: 'badge-info',
  },
}

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={cn('badge', config.className, className)}>
      {config.label}
    </span>
  )
}
