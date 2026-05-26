'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Filter,
} from 'lucide-react'

interface Payment {
  id: string
  mes_referencia: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: 'pendente' | 'comprovante_enviado' | 'confirmado'| 'aprovado' | 'recusado' | 'perdoado'
}

interface PaymentHistoryProps {
  payments: Payment[]
  onViewDetails?: (paymentId: string) => void
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pendente: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  comprovante_enviado: {
    label: 'Aguardando',
    color: 'bg-blue-100 text-blue-800',
    icon: Upload,
  },
  confirmado: {
    label: 'Pago',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  recusado: {
    label: 'Recusado',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
  },
  perdoado: {
    label: 'Perdoado',
    color: 'bg-purple-100 text-purple-800',
    icon: CheckCircle,
  },
}

export function PaymentHistory({ payments, onViewDetails }: PaymentHistoryProps) {
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterYear, setFilterYear] = useState<string>('todos')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }
  
  // 
  const groupedPaymentsMap = payments.reduce((acc, current) => {
    const key = current.mes_referencia; // Agrupa pelo mês de referência comum

    if (!acc[key]) {
      acc[key] = { ...current, valor: 0 };
    }

    acc[key].valor += Number(current.valor);
    
    return acc;
  }, {} as Record<string, Payment>);

  const uniquePayments = Object.values(groupedPaymentsMap);

  const years = Array.from(
    new Set(
      uniquePayments.map((p) => new Date(p.data_vencimento).getFullYear().toString())
    )
  ).sort((a, b) => parseInt(b) - parseInt(a));
  
  const filteredPayments = uniquePayments.filter((payment) => {
    const matchesStatus =
      filterStatus === 'todos' || payment.status === filterStatus
    const matchesYear =
      filterYear === 'todos' ||
      new Date(payment.data_vencimento).getFullYear().toString() === filterYear
    return matchesStatus && matchesYear;
  });

  const stats = {
    total: uniquePayments.length,
    pagos: uniquePayments.filter((p) => p.status === 'confirmado' || p.status === 'aprovado' || p.status === 'perdoado').length,
    pendentes: uniquePayments.filter((p) => p.status === 'pendente').length,
    aguardando: uniquePayments.filter((p) => p.status === 'comprovante_enviado').length,
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pagos}</p>
              <p className="text-xs text-muted-foreground">Pagos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.aguardando}</p>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Filtros:
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="comprovante_enviado">Aguardando</SelectItem>
                <SelectItem value="confirmado">Pagos</SelectItem>
                <SelectItem value="recusado">Recusados</SelectItem>
                <SelectItem value="perdoado">Perdoados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Anos</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referência</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhum pagamento encontrado
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => {
                const statusConfig = STATUS_CONFIG[payment.status]
                const StatusIcon = statusConfig.icon
                return (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewDetails?.(payment.id)}
                  >
                    <TableCell className="font-medium">
                      {payment.mes_referencia}
                    </TableCell>
                    <TableCell>{formatDate(payment.data_vencimento)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.valor)}
                    </TableCell>
                    <TableCell>{formatDate(payment.data_pagamento)}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
