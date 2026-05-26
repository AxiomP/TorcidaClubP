'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  History,
  CreditCard,
  Ticket,
  UserPlus,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Tipos
interface Atividade {
  id: string
  tipo: 'pagamento' | 'ingresso' | 'dependente' | 'notificacao' | 'cadastro'
  titulo: string
  descricao: string
  status: 'sucesso' | 'pendente' | 'erro' | 'info'
  data: string
  metadata?: Record<string, unknown>
}

interface Pagamento {
  id: string
  referencia_mes: string
  valor_original: number
  status: string
  data_pagamento: string | null
  created_at: string
}

export default function HistoricoPage() {
  const { loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])

  useEffect(() => {
    if (authLoading) return

    async function fetchHistorico() {
      setLoading(true)
      try {
        const res = await fetch('/api/socio/historico')
        if (!res.ok) throw new Error('Erro ao carregar histórico')
        const data = await res.json()

        if (data.pagamentos) {
          setPagamentos(data.pagamentos)

          const atividadesPagamentos: Atividade[] = data.pagamentos.map((p: Pagamento) => ({
            id: `pag-${p.id}`,
            tipo: 'pagamento' as const,
            titulo:
              p.status === 'confirmado'
                ? 'Pagamento Confirmado'
                : p.status === 'pendente'
                ? 'Pagamento Pendente'
                : 'Comprovante Enviado',
            descricao: `Mensalidade ${p.referencia_mes} - ${p.valor_original?.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}`,
            status:
              p.status === 'confirmado'
                ? ('sucesso' as const)
                : p.status === 'pendente'
                ? ('pendente' as const)
                : ('info' as const),
            data: p.created_at,
          }))

          setAtividades(atividadesPagamentos)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Erro ao carregar histórico:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistorico()
  }, [authLoading])

  function getIconByTipo(tipo: Atividade['tipo']) {
    switch (tipo) {
      case 'pagamento':
        return <CreditCard className="h-4 w-4" />
      case 'ingresso':
        return <Ticket className="h-4 w-4" />
      case 'dependente':
        return <UserPlus className="h-4 w-4" />
      case 'notificacao':
        return <Bell className="h-4 w-4" />
      case 'cadastro':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <History className="h-4 w-4" />
    }
  }

  function getStatusIcon(status: Atividade['status']) {
    switch (status) {
      case 'sucesso':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  function getStatusColor(status: Atividade['status']) {
    switch (status) {
      case 'sucesso':
        return 'bg-green-500/10 border-green-500/20'
      case 'pendente':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'erro':
        return 'bg-red-500/10 border-red-500/20'
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20'
    }
  }

  function getPagamentoStatusBadge(status: string) {
    switch (status) {
      case 'confirmado':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            Confirmado
          </Badge>
        )
      case 'pendente':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Pendente
          </Badge>
        )
      case 'comprovante_enviado':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Em Análise
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const isLoading = authLoading || loading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-purple-500" />
          Histórico
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe todas as suas atividades e transações
        </p>
      </div>

      <Tabs defaultValue="atividades" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        {/* Atividades */}
        <TabsContent value="atividades" className="mt-4">
          {atividades.length === 0 ? (
            <Card className="p-8 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma atividade</h3>
              <p className="text-muted-foreground">
                Suas atividades aparecerão aqui conforme você usar a plataforma.
              </p>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

              {/* Atividades */}
              <div className="space-y-4">
                {atividades.map((atividade) => (
                  <div key={atividade.id} className="relative pl-14">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute left-4 top-4 h-5 w-5 rounded-full border-2 bg-background flex items-center justify-center ${getStatusColor(
                        atividade.status
                      )}`}
                    >
                      {getIconByTipo(atividade.tipo)}
                    </div>

                    {/* Card */}
                    <Card className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{atividade.titulo}</h4>
                            {getStatusIcon(atividade.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {atividade.descricao}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>
                            {atividade.data ? formatDistanceToNow(new Date(atividade.data), {
                              addSuffix: true,
                              locale: ptBR,
                            }) : '—'}
                          </p>
                          <p className="text-xs">
                            {atividade.data ? format(new Date(atividade.data), "dd/MM/yyyy 'às' HH:mm") : ''}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Pagamentos */}
        <TabsContent value="pagamentos" className="mt-4">
          {pagamentos.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum pagamento</h3>
              <p className="text-muted-foreground">
                Seu histórico de pagamentos aparecerá aqui.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {pagamentos.filter((p) => p.status === 'confirmado').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Confirmados</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {pagamentos.filter((p) => p.status === 'pendente').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {pagamentos
                          .filter((p) => p.status === 'confirmado')
                          .reduce((acc, p) => acc + (p.valor_original || 0), 0)
                          .toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Pago</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Lista de Pagamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Últimos Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pagamentos.map((pagamento) => (
                      <div
                        key={pagamento.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {format(
                                new Date(pagamento.referencia_mes + 'T12:00:00'),
                                "MMMM 'de' yyyy",
                                { locale: ptBR }
                              )}
                            </p>
                            {pagamento.data_pagamento && (
                              <p className="text-xs text-muted-foreground">
                                Pago em{' '}
                                {format(
                                  new Date(pagamento.data_pagamento),
                                  'dd/MM/yyyy'
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-semibold">
                            {pagamento.valor_original.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                          {getPagamentoStatusBadge(pagamento.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
