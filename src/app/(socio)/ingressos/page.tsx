'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Upload,
  CreditCard,
  Loader2,
  ShoppingCart,
  Users,
  Plus,
  Minus,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TorpixModal } from '@/components/socio/torpix-modal'

type RankingType = 'bronze' | 'prata' | 'ouro'

interface Ingresso {
  id: string
  evento: {
    id: string
    nome_evento: string
    data_hora: string
    local: string
  }
  status: 'confirmado' | 'pendente' | 'utilizado' | 'cancelado' | 'aprovado' | 'comprovante_enviado' | 'usado' | 'recusado'
  setor: string
  codigo_qr: string
  codigo_validacao?: string | null
  valor?: number
  created_at: string
}

interface IngressoGroup extends Ingresso {
  ids: string[]
  leadIngresso: Ingresso
  quantidade: number
  valorTotal: number
}

interface EventoDisponivel {
  id: string
  nome_evento: string
  data_hora: string
  local: string
  valor_socio: number | null
  valor_dependente?: number | null
  valor_adicional?: number | null
  ranking_minimo: RankingType | null
  qtd_ingressos_disponiveis: number | null
  qtd_ingressos_total?: number | null
  qtd_ingressos_vendidos?: number | null
  permite_dependentes?: boolean
  permite_adicionais?: boolean
  data_fim_vendas?: string | null
}

interface Dependente {
  id: string
  nome_completo: string
}

interface SolicitacaoConfig {
  evento: EventoDisponivel
  dependentesDisponiveis: Dependente[]
  dependentesSelecionados: string[]
  qtdAdicional: number
  adicionais: { nome: string; cpf: string }[]
  permiteDependentes: boolean
  permiteAdicionais: boolean
}

function getBatchPrefix(codigo?: string | null) {
  if (!codigo) return null
  return codigo.includes('-ticket-') ? codigo.split('-ticket-')[0] : null
}

function groupIngressos(ingressos: Ingresso[]): IngressoGroup[] {
  const map = new Map<string, IngressoGroup>()

  for (const ingresso of ingressos) {
    const prefix = getBatchPrefix(ingresso.codigo_validacao)

    const eventoId = ingresso.evento?.id || 'evento-desconhecido'

    const key = `${eventoId}|${prefix ?? ingresso.codigo_validacao ?? ingresso.id}`

    const existing = map.get(key)
    if (existing) {
      existing.ids.push(ingresso.id)
      existing.quantidade += 1
      existing.valorTotal += ingresso.valor ?? 0
      
      if (ingresso.status === 'comprovante_enviado' && existing.status === 'aprovado') {
        existing.status = 'comprovante_enviado'
      }
      continue
    }

    map.set(key, {
      ...ingresso,
      ids: [ingresso.id],
      leadIngresso: { ...ingresso },
      quantidade: 1,
      valorTotal: ingresso.valor ?? 0,
    })
  }

  return Array.from(map.values())
}

export default function IngressosPage() {
  const { socioData, loading: authLoading, isDependente } = useAuth()
  const [loading, setLoading] = useState(true)
  const [ingressosAtivos, setIngressosAtivos] = useState<Ingresso[]>([])
  const [historicoIngressos, setHistoricoIngressos] = useState<Ingresso[]>([])
  const [eventosDisponiveis, setEventosDisponiveis] = useState<EventoDisponivel[]>([])
  const [chavePix, setChavePix] = useState<string | null>(null)
  const [torpixOpen, setTorpixOpen] = useState(false)
  const [torpixIngresso, setTorpixIngresso] = useState<Ingresso | null>(null)
  const [torpixEvento, setTorpixEvento] = useState<EventoDisponivel | null>(null)
  const [torpixEventoOpen, setTorpixEventoOpen] = useState(false)
  const [novoIngressoId, setNovoIngressoId] = useState<string | null>(null)
  const [solicitandoId, setSolicitandoId] = useState<string | null>(null)
  const [dependentes, setDependentes] = useState<Dependente[]>([])
  const [solicitacaoConfig, setSolicitacaoConfig] = useState<SolicitacaoConfig | null>(null)
  const [submittingConfig, setSubmittingConfig] = useState(false)
  const [valorTotalIngressos, setValorTotalIngressos] = useState<number>(0)

  const socioRanking: RankingType = (socioData?.ranking ?? 'bronze') as RankingType

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/socio/ingressos')
      if (!res.ok) throw new Error('Erro ao carregar ingressos')
      const data = await res.json()

      if (data.chavePix) setChavePix(data.chavePix)
      if (data.dependentes) setDependentes(data.dependentes as Dependente[])
      if (data.ingressosAtivos) setIngressosAtivos(data.ingressosAtivos as unknown as Ingresso[])
      if (data.historicoIngressos) setHistoricoIngressos(data.historicoIngressos as unknown as Ingresso[])
      if (data.eventosDisponiveis) {
        const filtered = (data.eventosDisponiveis as EventoDisponivel[]).filter((e) => {
          if (!e.ranking_minimo) return true
          return e.ranking_minimo.toLowerCase() === socioRanking.toLowerCase()
        })
        setEventosDisponiveis(filtered)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Erro ao carregar ingressos:', error)
    } finally {
      setLoading(false)
    }
  }, [socioRanking])

  useEffect(() => {
    if (authLoading) return
    fetchData()
  }, [authLoading, fetchData])

  function getStatusBadge(status: string) {
    switch (status) {
      case 'aprovado':
      case 'confirmado':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        )
      case 'pendente':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <CreditCard className="h-3 w-3 mr-1" />
            Aguardando Pagamento
          </Badge>
        )
      case 'comprovante_enviado':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1" />
            Em Analise
          </Badge>
        )
      case 'utilizado':
      case 'usado':
        return (
          <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Utilizado
          </Badge>
        )
      case 'cancelado':
      case 'recusado':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            {status === 'recusado' ? 'Recusado' : 'Cancelado'}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function handleCompartilharEvento(evento: EventoDisponivel) {
    const data = format(new Date(evento.data_hora), "dd/MM/yyyy", { locale: ptBR })
    const hora = format(new Date(evento.data_hora), "HH:mm")
    const disponivel = evento.qtd_ingressos_disponiveis !== null
      ? evento.qtd_ingressos_disponiveis
      : evento.qtd_ingressos_total !== null
        ? (evento.qtd_ingressos_total ?? 0) - (evento.qtd_ingressos_vendidos ?? 0)
        : null
    const restamTexto = disponivel !== null ? `${disponivel} ingressos` : 'ilimitado'
    const texto = [
      `🏟️ *${evento.nome_evento}*`,
      `📅 ${data} às ${hora}`,
      `📍 ${evento.local}`,
      `🎟 Restam: ${restamTexto}`,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
    toast.success('Abrindo WhatsApp...')
  }

  function handleEnviarComprovante(ingresso: Ingresso | IngressoGroup) {
    const valorFinal = 'valorTotal' in ingresso ? ingresso.valorTotal : (ingresso.valor || 0)
    setValorTotalIngressos(valorFinal)

    const ingressoIndividual = 'leadIngresso' in ingresso ? ingresso.leadIngresso : ingresso
    setTorpixIngresso(ingressoIndividual)

    setTorpixOpen(true)
  }

  async function handleSolicitarIngresso(evento: EventoDisponivel) {
    const permiteDependentes = evento.permite_dependentes !== false
    const permiteAdicionais = evento.permite_adicionais !== false
    // Abre modal de configuração (permite escolher dependentes/adicionais conforme flags do evento)
    setSolicitacaoConfig({
      evento,
      dependentesDisponiveis: dependentes,
      dependentesSelecionados: [],
      qtdAdicional: 0,
      adicionais: [],
      permiteDependentes,
      permiteAdicionais,
    })
  }

  async function solicitarIngressoSimples(evento: EventoDisponivel, extras?: {
    dependentesSelecionados: string[]
    adicionais: { nome: string; cpf: string }[]
  }) {
    setSubmittingConfig(true)
    setSolicitandoId(evento.id)

    // Construir payload consolidado com todos os ingressos
    const ingressos: Array<{
      tipo_ingresso: string
      dependente_id?: string
      nome_adicional?: string
      cpf_adicional?: string
    }> = []

    // Ingresso do próprio sócio
    ingressos.push({ tipo_ingresso: 'socio' })

    // Ingressos para dependentes
    for (const depId of (extras?.dependentesSelecionados || [])) {
      ingressos.push({ tipo_ingresso: 'dependente', dependente_id: depId })
    }

    // Ingressos adicionais
    for (const ad of (extras?.adicionais || [])) {
      if (ad.nome && ad.cpf) {
        ingressos.push({
          tipo_ingresso: 'adicional',
          nome_adicional: ad.nome,
          cpf_adicional: ad.cpf,
        })
      }
    }

    try {
      // Fazer um único request consolidado
      const response = await fetch('/api/ingressos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento_id: evento.id,
          ingressos, // Array de ingressos a criar
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao solicitar ingressos')

      // O endpoint retorna um ID de lote, valor total e ingressos
      setNovoIngressoId(data.ingresso?.id || data.loteId)
      setValorTotalIngressos(data.valorTotal || data.ingresso?.valor || evento.valor_socio || 0)
      setTorpixEvento(evento)
      setTorpixEventoOpen(true)
      setSolicitacaoConfig(null)
      
      // Recarregar dados após sucesso
      setTimeout(() => fetchData(), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao solicitar ingressos')
    } finally {
      setSolicitandoId(null)
      setSubmittingConfig(false)
    }
  }

  function renderStatusSection(ingresso: Ingresso | IngressoGroup) {
    const valor = 'valorTotal' in ingresso ? ingresso.valorTotal : ingresso.valor || 0

    switch (ingresso.status) {
      case 'pendente':
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l">
            <CreditCard className="h-12 w-12 text-yellow-600 mb-3" />
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">Valor do Ingresso</p>
            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 mb-4">
              R$ {valor.toFixed(2).replace('.', ',')}
            </p>
            <Button
              variant="default"
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={() => handleEnviarComprovante(ingresso)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Enviar Comprovante
            </Button>
          </div>
        )

      case 'comprovante_enviado':
        return (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Em Analise</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 text-center max-w-[150px]">
              Aguardando aprovacao do gestor
            </p>
          </div>
        )

      case 'aprovado':
      case 'confirmado':
        return (
          <div className="bg-green-50 dark:bg-green-900/20 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l">
            <CheckCircle className="h-12 w-12 text-green-600 mb-3" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Pagamento Aprovado</p>
          </div>
        )

      default:
        return null
    }
  }

  const isLoading = authLoading || loading

  const _ingressoBloqueado = isDependente

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
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
          <Ticket className="h-6 w-6 text-orange-500" />
          Meus Ingressos
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus ingressos para eventos e jogos
        </p>
      </div>

      <Tabs defaultValue="disponiveis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="disponiveis">
            Disponíveis ({eventosDisponiveis.length})
          </TabsTrigger>
          <TabsTrigger value="ativos">
            Próximos ({ingressosAtivos.length})
          </TabsTrigger>
          <TabsTrigger value="historico">
            Histórico ({historicoIngressos.length})
          </TabsTrigger>
        </TabsList>

        {/* Eventos Disponíveis para Compra */}
        <TabsContent value="disponiveis" className="mt-4 space-y-4">
          {isDependente && (
            <Card className="p-4 flex items-start gap-3 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <Ticket className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Como dependente, a compra de ingressos é feita pelo sócio responsável. Você pode visualizar os eventos disponíveis abaixo.
              </p>
            </Card>
          )}
          {eventosDisponiveis.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum evento disponível</h3>
              <p className="text-muted-foreground">
                Não há eventos com ingressos disponíveis no momento.
              </p>
            </Card>
          ) : (
            eventosDisponiveis.map((evento) => {
              const disponivel = evento.qtd_ingressos_disponiveis !== null
                ? evento.qtd_ingressos_disponiveis
                : evento.qtd_ingressos_total !== null
                  ? (evento.qtd_ingressos_total ?? 0) - (evento.qtd_ingressos_vendidos ?? 0)
                  : null // null = sem limite de vagas
              const esgotado = disponivel !== null && disponivel <= 0
              
              // Verificar se passou da data limite de vendas
              const vendaseEncerradas = evento.data_fim_vendas ? new Date() > new Date(evento.data_fim_vendas) : false
              
              const solicitando = solicitandoId === evento.id
              return (
                <Card key={evento.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-lg">{evento.nome_evento}</h3>
                        <div className="flex gap-2">
                          {vendaseEncerradas && (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Vendas Encerradas
                            </Badge>
                          )}
                          {esgotado && !vendaseEncerradas && (
                            <Badge variant="secondary">Esgotado</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(evento.data_hora), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(evento.data_hora), 'HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <MapPin className="h-4 w-4" />
                          <span>{evento.local}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acao */}
                    {!isDependente ? (
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l min-w-[160px]">
                        <p className="text-sm text-muted-foreground mb-1">Valor</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-4">
                          {evento.valor_socio != null
                            ? `R$ ${evento.valor_socio.toFixed(2).replace('.', ',')}`
                            : 'Gratuito'}
                        </p>
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 w-full mb-2"
                          disabled={esgotado || solicitando || vendaseEncerradas}
                          onClick={() => handleSolicitarIngresso(evento)}
                        >
                          {solicitando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {vendaseEncerradas ? 'Vendas Encerradas' : esgotado ? 'Esgotado' : 'Solicitar'}
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleCompartilharEvento(evento)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l min-w-[160px]">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleCompartilharEvento(evento)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Ingressos Ativos (Próximos Eventos) */}
        <TabsContent value="ativos" className="mt-4 space-y-4">
          {ingressosAtivos.length === 0 ? (
            <Card className="p-8 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum ingresso ativo</h3>
              <p className="text-muted-foreground mb-4">
                Você não possui ingressos para eventos futuros no momento.
              </p>
              <p className="text-sm text-muted-foreground">
                Solicite ingressos na aba &ldquo;Disponíveis&rdquo; quando houver eventos abertos.
              </p>
            </Card>
          ) : (
            groupIngressos(ingressosAtivos).map((ingresso) => (
              <Card
                key={ingresso.ids.join('-')}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Info do Evento */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {ingresso.evento.nome_evento}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {ingresso.setor}
                          {ingresso.quantidade > 1 && (
                            <span className="ml-2 text-xs text-orange-600">({ingresso.quantidade} ingressos)</span>
                          )}
                        </p>
                      </div>
                      {getStatusBadge(ingresso.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(
                            new Date(ingresso.evento.data_hora),
                            "dd 'de' MMMM",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(ingresso.evento.data_hora), 'HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <MapPin className="h-4 w-4" />
                        <span>{ingresso.evento.local}</span>
                      </div>
                    </div>
                  </div>

                  {/* Secao de Status/Acoes */}
                  {renderStatusSection(ingresso)}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="mt-4 space-y-4">
          {historicoIngressos.length === 0 ? (
            <Card className="p-8 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum histórico</h3>
              <p className="text-muted-foreground">
                Seu histórico de ingressos aparecerá aqui após você participar de
                eventos.
              </p>
            </Card>
          ) : (
            groupIngressos(historicoIngressos).map((ingresso) => (
              <Card key={ingresso.ids.join('-')} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Ticket className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{ingresso.evento.nome_evento}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(ingresso.evento.data_hora),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )}
                        </span>
                        <span>
                          {ingresso.setor} 
                          {ingresso.quantidade > 1 && (
                            <span className="ml-1 text-xs text-orange-600">({ingresso.quantidade}x)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(ingresso.status)}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Configuração de Ingressos */}
      {solicitacaoConfig && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
                Configurar Ingressos — {solicitacaoConfig.evento.nome_evento}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSolicitacaoConfig(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            {/* Ingresso do Sócio */}
            <div className="bg-white dark:bg-background rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Seu ingresso</p>
                    <p className="text-xs text-muted-foreground">Incluído automaticamente</p>
                  </div>
                </div>
                <span className="font-semibold text-orange-700">
                  {solicitacaoConfig.evento.valor_socio != null
                    ? `R$ ${solicitacaoConfig.evento.valor_socio.toFixed(2).replace('.', ',')}`
                    : 'Gratuito'}
                </span>
              </div>
            </div>

            {/* Dependentes */}
            {solicitacaoConfig.permiteDependentes && solicitacaoConfig.dependentesDisponiveis.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Dependentes
                  {solicitacaoConfig.evento.valor_dependente != null && (
                    <span className="text-muted-foreground font-normal ml-1">
                      (R$ {solicitacaoConfig.evento.valor_dependente.toFixed(2).replace('.', ',')} cada)
                    </span>
                  )}
                </p>
                {solicitacaoConfig.dependentesDisponiveis.map((dep) => {
                  const selecionado = solicitacaoConfig.dependentesSelecionados.includes(dep.id)
                  return (
                    <div
                      key={dep.id}
                      className={`bg-white dark:bg-background rounded-lg p-3 border cursor-pointer transition-colors ${selecionado ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20' : ''}`}
                      onClick={() => setSolicitacaoConfig((prev) => {
                        if (!prev) return prev
                        const atual = prev.dependentesSelecionados
                        return {
                          ...prev,
                          dependentesSelecionados: atual.includes(dep.id)
                            ? atual.filter((id) => id !== dep.id)
                            : [...atual, dep.id],
                        }
                      })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selecionado ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                            {selecionado && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm">{dep.nome_completo}</span>
                        </div>
                        {selecionado && solicitacaoConfig.evento.valor_dependente != null && (
                          <span className="text-sm font-medium text-orange-700">
                            R$ {solicitacaoConfig.evento.valor_dependente.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Ingressos Adicionais */}
            {solicitacaoConfig.permiteAdicionais && (() => {
              const valorAdicional = solicitacaoConfig.evento.valor_adicional ?? solicitacaoConfig.evento.valor_socio ?? 0
              const labelValor = solicitacaoConfig.evento.valor_adicional != null
                ? `(R$ ${valorAdicional.toFixed(2).replace('.', ',')} cada)`
                : '(mesmo valor do sócio)'
              return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Ingressos Adicionais
                    <span className="text-muted-foreground font-normal ml-1">
                      {labelValor}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={solicitacaoConfig.qtdAdicional <= 0}
                      onClick={() => setSolicitacaoConfig((prev) => {
                        if (!prev) return prev
                        const novaQtd = prev.qtdAdicional - 1
                        return { ...prev, qtdAdicional: novaQtd, adicionais: prev.adicionais.slice(0, novaQtd) }
                      })}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{solicitacaoConfig.qtdAdicional}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setSolicitacaoConfig((prev) => {
                        if (!prev) return prev
                        const novaQtd = prev.qtdAdicional + 1
                        return { ...prev, qtdAdicional: novaQtd, adicionais: [...prev.adicionais, { nome: '', cpf: '' }] }
                      })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {solicitacaoConfig.adicionais.map((ad, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2 bg-white dark:bg-background rounded-lg p-3 border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nome Completo</p>
                      <input
                        type="text"
                        value={ad.nome}
                        onChange={(e) => setSolicitacaoConfig((prev) => {
                          if (!prev) return prev
                          const novos = [...prev.adicionais]
                          novos[idx] = { ...novos[idx], nome: e.target.value }
                          return { ...prev, adicionais: novos }
                        })}
                        placeholder="Nome do acompanhante"
                        className="w-full text-sm border rounded px-2 py-1 bg-background"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CPF</p>
                      <input
                        type="text"
                        value={ad.cpf}
                        onChange={(e) => setSolicitacaoConfig((prev) => {
                          if (!prev) return prev
                          const novos = [...prev.adicionais]
                          novos[idx] = { ...novos[idx], cpf: e.target.value }
                          return { ...prev, adicionais: novos }
                        })}
                        placeholder="000.000.000-00"
                        className="w-full text-sm border rounded px-2 py-1 bg-background"
                      />
                    </div>
                  </div>
                ))}
              </div>
              )
            })()}

            {/* Aviso quando nem dependentes nem adicionais são permitidos */}
            {!solicitacaoConfig.permiteDependentes && !solicitacaoConfig.permiteAdicionais && (
              <p className="text-xs text-muted-foreground text-center">Este evento só permite ingressos para o sócio titular.</p>
            )}

            {/* Resumo */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Sócio (1x)</span>
                <span>{solicitacaoConfig.evento.valor_socio != null ? `R$ ${solicitacaoConfig.evento.valor_socio.toFixed(2).replace('.', ',')}` : 'Gratuito'}</span>
              </div>
              {solicitacaoConfig.dependentesSelecionados.length > 0 && solicitacaoConfig.evento.valor_dependente != null && (
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Dependentes ({solicitacaoConfig.dependentesSelecionados.length}x)</span>
                  <span>R$ {(solicitacaoConfig.dependentesSelecionados.length * (solicitacaoConfig.evento.valor_dependente ?? 0)).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {solicitacaoConfig.qtdAdicional > 0 && (
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Adicionais ({solicitacaoConfig.qtdAdicional}x)</span>
                  <span>R$ {(solicitacaoConfig.qtdAdicional * (solicitacaoConfig.evento.valor_adicional ?? solicitacaoConfig.evento.valor_socio ?? 0)).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-bold border-t mt-2 pt-2">
                <span>Total</span>
                <span className="text-orange-700">
                  R$ {(
                    (solicitacaoConfig.evento.valor_socio ?? 0) +
                    (solicitacaoConfig.dependentesSelecionados.length * (solicitacaoConfig.evento.valor_dependente ?? 0)) +
                    (solicitacaoConfig.qtdAdicional * (solicitacaoConfig.evento.valor_adicional ?? solicitacaoConfig.evento.valor_socio ?? 0))
                  ).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={submittingConfig}
              onClick={() => solicitarIngressoSimples(solicitacaoConfig.evento, {
                dependentesSelecionados: solicitacaoConfig.dependentesSelecionados,
                adicionais: solicitacaoConfig.adicionais,
              })}
            >
              {submittingConfig ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Confirmar e Solicitar
            </Button>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="flex items-start gap-4 py-4">
          <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-500 mb-1">
              Como funcionam os ingressos?
            </p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Solicite seu ingresso na aba &ldquo;Disponíveis&rdquo;</li>
              <li>• Envie o comprovante de pagamento via TorPIX</li>
              <li>• Aguarde a aprovacao do gestor da torcida</li>
              <li>
                • Apos aprovado, baixe a ficha do evento para apresentar na entrada
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* TorPIX Modal para pagamento de ingressos existentes */}
      {torpixIngresso && (
        <TorpixModal
          open={torpixOpen}
          onOpenChange={(open) => {
            setTorpixOpen(open)
            if (!open) {
              setTorpixIngresso(null)
              setValorTotalIngressos(0) // Limpa o valor ao fechar
            }
          }}
          pagamentoId={torpixIngresso.id}
          valor={valorTotalIngressos || torpixIngresso.valor || 0} 
          chavePix={chavePix}
          tipo="ingresso"
          descricao={
            'quantidade' in torpixIngresso && (torpixIngresso as IngressoGroup).quantidade > 1 
              ? `${(torpixIngresso as IngressoGroup).quantidade} Ingressos: ${torpixIngresso.evento.nome_evento}`
              : `Ingresso: ${torpixIngresso.evento.nome_evento}`
          }
          eventoId={torpixIngresso.id}
          onComprovanteEnviado={() => {
            toast.success('Comprovante enviado! Aguarde aprovação do gestor.')
            setTorpixOpen(false)
            setTorpixIngresso(null)
            setValorTotalIngressos(0)
            fetchData()
          }}
        />
      )}

      {/* TorPIX Modal para novo ingresso solicitado */}
      {torpixEvento && novoIngressoId && (
        <TorpixModal
          open={torpixEventoOpen}
          onOpenChange={(open) => {
            setTorpixEventoOpen(open)
            if (!open) {
              setTorpixEvento(null)
              setNovoIngressoId(null)
              setValorTotalIngressos(0)
              fetchData()
            }
          }}
          pagamentoId={novoIngressoId}
          valor={valorTotalIngressos || torpixEvento.valor_socio || 0}
          chavePix={chavePix}
          tipo="ingresso"
          descricao={`Ingresso(s): ${torpixEvento.nome_evento}`}
          onComprovanteEnviado={() => {
            toast.success('Comprovante enviado! Aguarde aprovação do gestor.')
          }}
        />
      )}
    </div>
  )
}
