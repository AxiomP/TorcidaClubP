'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type RankingType } from '@/components/ui/ranking-badge'
import { Ticket, Calendar, MapPin, ArrowRight, Medal } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/types/database'

type Evento = Database['public']['Tables']['eventos']['Row']

interface EventosSectionProps {
  eventos: Evento[]
  loading?: boolean
  socioRanking?: RankingType
}

export function EventosSection({ eventos, loading, socioRanking = 'bronze' }: EventosSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-orange-500" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-full mt-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filtrar eventos por status ativo E por categoria do sócio
  // Regra: ranking_minimo = null -> todos podem ver
  //        ranking_minimo definido -> exclusivo para aquela categoria exata
  const eventosVisiveis = eventos.filter((e) => {
    if (e.status !== 'ativo') return false
    if (e.ranking_minimo === null) return true
    return e.ranking_minimo === socioRanking
  })

  const eventosAtivos = eventosVisiveis

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-orange-500" />
          Próximos Eventos
        </CardTitle>
        <Link href="/ingressos">
          <Button variant="ghost" size="sm">
            Ver Todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {eventosAtivos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum evento disponível no momento.
          </p>
        ) : (
          <div className="space-y-4">
            {eventosAtivos.slice(0, 3).map((evento) => {
              const dataEvento = new Date(evento.data_hora)
              const dataFimVendas = new Date(evento.data_fim_vendas)
              const vendasEncerradas = dataFimVendas < new Date()
              const ingressosDisponiveis =
                evento.qtd_ingressos_disponiveis !== null
                  ? evento.qtd_ingressos_disponiveis
                  : evento.qtd_ingressos_total - evento.qtd_ingressos_vendidos

              return (
                <div
                  key={evento.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{evento.nome_evento}</h4>
                        {evento.ranking_minimo && (
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600">
                            <Medal className="h-3 w-3" />
                            Exclusivo
                          </span>
                        )}
                      </div>
                      {evento.time_casa && evento.time_visitante && (
                        <p className="text-sm text-muted-foreground">
                          {evento.time_casa} x {evento.time_visitante}
                        </p>
                      )}
                    </div>
                    {vendasEncerradas ? (
                      <Badge variant="secondary">Vendas encerradas</Badge>
                    ) : ingressosDisponiveis <= 0 ? (
                      <Badge variant="destructive">Esgotado</Badge>
                    ) : (
                      <Badge variant="default">
                        {ingressosDisponiveis} disponíveis
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(dataEvento, "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {evento.local}
                    </div>
                  </div>

                  {evento.valor_socio && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Ingresso:{' '}
                        <strong>
                          {evento.valor_socio.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </strong>
                      </span>

                      {!vendasEncerradas && ingressosDisponiveis > 0 && (
                        <Link href={`/ingressos?evento=${evento.id}`}>
                          <Button size="sm">
                            <Ticket className="h-4 w-4 mr-1" />
                            Comprar
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
