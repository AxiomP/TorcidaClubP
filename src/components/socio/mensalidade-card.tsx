'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/types/database'

type Pagamento = Database['public']['Tables']['pagamentos']['Row']

interface MensalidadeCardProps {
  pagamentoAtual: Pagamento | null
  valorMensalidadeBase: number
  qtdDependentes: number
  valorAdicionalDependente: number
  loading?: boolean
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }
> = {
  confirmado: { label: 'Em dia', variant: 'default', icon: CheckCircle },
  pendente: { label: 'Pendente', variant: 'secondary', icon: Clock },
  comprovante_enviado: { label: 'Aguardando aprovação', variant: 'outline', icon: Clock },
  recusado: { label: 'Recusado', variant: 'destructive', icon: AlertCircle },
  perdoado: { label: 'Perdoado', variant: 'default', icon: CheckCircle },
}

export function MensalidadeCard({
  pagamentoAtual,
  valorMensalidadeBase,
  qtdDependentes,
  valorAdicionalDependente,
  loading,
}: MensalidadeCardProps) {
  const valorDependentes = qtdDependentes * valorAdicionalDependente
  const valorTotal = valorMensalidadeBase + valorDependentes

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-500" />
            Mensalidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const status = pagamentoAtual?.status || 'pendente'
  const config = statusConfig[status] || statusConfig.pendente
  const StatusIcon = config.icon

  const isVencido =
    pagamentoAtual?.data_vencimento &&
    new Date(pagamentoAtual.data_vencimento + 'T00:00:00') < new Date() &&
    status === 'pendente'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-500" />
          Mensalidade
        </CardTitle>
        <Badge variant={isVencido ? 'destructive' : config.variant}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {isVencido ? 'Vencida' : config.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Valor da mensalidade */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Mensalidade base</span>
            <span className="font-medium">
              {valorMensalidadeBase.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>

          {qtdDependentes > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Dependentes ({qtdDependentes}x{' '}
                {valorAdicionalDependente.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                )
              </span>
              <span className="font-medium">
                {valorDependentes.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          )}

          <div className="border-t pt-2 flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">
              {valorTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>

        {/* Data de vencimento */}
        {pagamentoAtual?.data_vencimento && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vencimento:</span>
            <span className={isVencido ? 'text-red-500 font-medium' : ''}>
              {format(new Date(pagamentoAtual.data_vencimento + 'T00:00:00'), "dd 'de' MMMM", {
                locale: ptBR,
              })}
            </span>
          </div>
        )}

        {/* Alerta de vencido */}
        {isVencido && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">
              Sua mensalidade está vencida. Regularize para evitar o bloqueio da sua
              associação.
            </p>
          </div>
        )}

        {/* Botão de ação */}
        <Link href="/mensalidade">
          <Button className="w-full" variant={isVencido ? 'destructive' : 'default'}>
            {status === 'confirmado' ? 'Ver Histórico' : 'Pagar Mensalidade'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
