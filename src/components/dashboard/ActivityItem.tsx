'use client'

import { DollarSign, UserCheck, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Activity {
  id: string
  type: 'payment' | 'registration'
  memberName: string
  amount?: number
  date: string
}

interface ActivityItemProps {
  activity: Activity
}

/**
 * Item Individual de Atividade
 * Representa uma ação recente no sistema (pagamento ou cadastro)
 */
export function ActivityItem({ activity }: ActivityItemProps) {
  const isPayment = activity.type === 'payment'

  // Formatar tempo relativo
  const timeAgo = formatDistanceToNow(new Date(activity.date), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50">
      {/* Ícone */}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          isPayment ? 'bg-green-500/10' : 'bg-blue-500/10'
        }`}
      >
        {isPayment ? (
          <DollarSign className="h-5 w-5 text-green-500" />
        ) : (
          <UserCheck className="h-5 w-5 text-blue-500" />
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.memberName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isPayment ? 'Pagamento confirmado' : 'Cadastro aprovado'}
          {isPayment && activity.amount && (
            <span className="ml-1 font-semibold text-green-500">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(activity.amount)}
            </span>
          )}
        </p>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  )
}
