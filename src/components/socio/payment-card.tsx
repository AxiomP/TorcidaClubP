'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Upload,
} from 'lucide-react'

interface PaymentCardProps {
  id: string
  valor: number
  dataVencimento: string
  status: 'pendente' | 'comprovante_enviado' | 'confirmado' | 'recusado' | 'atrasado'
  mesReferencia?: string
  onPagar?: () => void
  onEnviarComprovante?: () => void
  compactMode?: boolean
}

const STATUS_CONFIG = {
  pendente: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  comprovante_enviado: {
    label: 'Aguardando Confirmação',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Upload,
  },
  confirmado: {
    label: 'Pago',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle,
  },
  recusado: {
    label: 'Recusado',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: AlertTriangle,
  },
  atrasado: {
    label: 'Atrasado',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: AlertTriangle,
  },
}

export function PaymentCard({
  valor,
  dataVencimento,
  status,
  mesReferencia,
  onPagar,
  onEnviarComprovante,
  compactMode = false,
}: PaymentCardProps) {
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isOverdue = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const vencimento = new Date(dataVencimento)
    vencimento.setHours(0, 0, 0, 0)
    return vencimento < today && status === 'pendente'
  }

  const isPending = status === 'pendente' || status === 'atrasado'
  const isAwaitingConfirmation = status === 'comprovante_enviado'

  if (compactMode) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              status === 'confirmado'
                ? 'bg-green-100 text-green-600'
                : isOverdue()
                ? 'bg-red-100 text-red-600'
                : 'bg-yellow-100 text-yellow-600'
            }`}
          >
            <StatusIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{mesReferencia || 'Mensalidade'}</p>
            <p className="text-xs text-muted-foreground">
              Venc: {formatDate(dataVencimento)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(valor)}</p>
          <Badge className={`text-xs ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={`p-6 ${
        isOverdue()
          ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
          : isPending
          ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20'
          : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {mesReferencia || 'Mensalidade'}
          </p>
          <p className="text-2xl font-bold">{formatCurrency(valor)}</p>
        </div>
        <Badge className={statusConfig.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Vencimento: {formatDate(dataVencimento)}</span>
        </div>
        {isOverdue() && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Atrasado</span>
          </div>
        )}
      </div>

      {/* Ações */}
      {isPending && (
        <div className="flex gap-2">
          <Button onClick={onPagar} className="flex-1">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar com PIX
          </Button>
          <Button onClick={onEnviarComprovante} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Enviar Comprovante
          </Button>
        </div>
      )}

      {isAwaitingConfirmation && (
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm">
          <p className="text-blue-700 dark:text-blue-300">
            Seu comprovante foi enviado e está aguardando confirmação do gestor.
          </p>
        </div>
      )}

      {status === 'recusado' && (
        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-sm">
          <p className="text-red-700 dark:text-red-300 mb-2">
            Seu comprovante foi recusado. Por favor, envie um novo comprovante.
          </p>
          <Button onClick={onEnviarComprovante} variant="destructive" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Enviar Novo Comprovante
          </Button>
        </div>
      )}
    </Card>
  )
}
