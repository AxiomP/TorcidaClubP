'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RankingMinimoEventoBadge, type RankingType } from '@/components/ui/ranking-badge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, MapPin, Users, Clock, Search, Medal, RefreshCw, Pencil, Share2, FileDown, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Evento {
  id: string
  nome_evento: string
  time_casa?: string
  time_visitante?: string
  data_hora: string
  local: string
  status: 'ativo' | 'encerrado' | 'cancelado'
  qtd_ingressos_total?: number
  qtd_ingressos_vendidos?: number
  qtd_ingressos_disponiveis?: number
  ranking_minimo?: RankingType | null
  valor_socio?: number
  valor_dependente?: number
  valor_adicional?: number
  created_at: string
}

const FETCH_TIMEOUT = 15000

export default function EventosPage() {
  const supabase = createClient()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'todos' | 'futuros' | 'passados'>('futuros')
  const [rankingFilter, setRankingFilter] = useState<RankingType | 'todos'>('todos')
  const abortControllerRef = useRef<AbortController | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadEventos = useCallback(async () => {
    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Buscar gestor para obter torcida_id
      const { data: gestor } = await supabase
        .from('gestores')
        .select('torcida_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!gestor) {
        setLoading(false)
        return
      }

      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      // Buscar eventos da API
      const response = await fetch(`/api/eventos?torcida_id=${gestor.torcida_id}&filter=${filter}`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Erro ao carregar eventos')
      }

      const data = await response.json()
      setEventos(data.eventos || [])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tempo limite excedido. Clique para tentar novamente.')
      } else {
        console.error('Erro ao carregar eventos:', err)
        setError('Erro ao carregar eventos')
      }
    } finally {
      setLoading(false)
    }
  }, [filter, supabase])

  useEffect(() => {
    loadEventos()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadEventos])

  // Filtrar por termo de busca e ranking
  const filteredEventos = eventos.filter(evento => {
    const matchesSearch =
      evento.nome_evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evento.time_casa && evento.time_casa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evento.time_visitante && evento.time_visitante.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRanking = rankingFilter === 'todos' || evento.ranking_minimo === rankingFilter

    return matchesSearch && matchesRanking
  })

  // Função para obter badge de status (usando status do schema real)
  const getStatusBadge = (status: string) => {
    const styles = {
      ativo: 'bg-green-100 text-green-800 border-green-300',
      encerrado: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelado: 'bg-red-100 text-red-800 border-red-300',
    }

    const labels = {
      ativo: 'Ativo',
      encerrado: 'Encerrado',
      cancelado: 'Cancelado',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function handleDownloadCSVIngressos(evento: Evento) {
    setDownloadingId(evento.id)
    try {
      const response = await fetch(`/api/eventos/${evento.id}/ingressos`)
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message = errorBody?.error || 'Erro ao buscar ingressos para exportação'
        throw new Error(message)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const nomeSlug = evento.nome_evento.toLowerCase().replace(/[^a-z0-9]+/g, '_')
      link.href = url
      link.download = `ingressos_${nomeSlug}_${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar CSV:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar CSV de ingressos')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDeleteEvento(evento: Evento) {
    if (!confirm(`Excluir o evento "${evento.nome_evento}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(evento.id)
    try {
      const res = await fetch(`/api/eventos?id=${evento.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Evento excluído')
      setEventos(prev => prev.filter(e => e.id !== evento.id))
    } catch {
      toast.error('Erro ao excluir evento')
    } finally {
      setDeletingId(null)
    }
  }

  function handleShareEvento(evento: Evento) {
    const data = new Date(evento.data_hora).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const hora = new Date(evento.data_hora).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const qtd = evento.qtd_ingressos_disponiveis ?? 0
    const quemJoga = (evento.time_casa && evento.time_visitante)
      ? `${evento.time_casa} vs ${evento.time_visitante}`
      : evento.nome_evento
    const linhas: string[] = [
      '# # # VENDA DE INGRESSOS # # #',
      '',
      `🚨 QUEM JOGA: ${quemJoga}`,
      `🕗 DATA: ${data} às ${hora}`,
      `🏟️ LOCAL: ${evento.local}`,
    ]
    if (evento.valor_socio != null) {
      linhas.push(`👑 VALOR P/ SÓCIO: R$ ${evento.valor_socio.toFixed(2).replace('.', ',')}`)
    }
    if (evento.valor_dependente != null) {
      linhas.push(`👥 VALOR P/ DEPENDENTE: R$ ${evento.valor_dependente.toFixed(2).replace('.', ',')}`)
    }
    if (evento.valor_adicional != null) {
      linhas.push(`➕ VALOR P/ ADICIONAL: R$ ${evento.valor_adicional.toFixed(2).replace('.', ',')}`)
    }
    linhas.push(`⌛ AINDA RESTAM: ${qtd} Ingressos!`)
    linhas.push('')
    linhas.push('📲 RESERVAS ONLINE PELO SITE ⤵️')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    linhas.push(`${siteUrl}/ingressos`)

    const texto = linhas.join('\n')

    if (navigator.share) {
      navigator.share({ title: evento.nome_evento, text: texto }).catch(() => {
        navigator.clipboard.writeText(texto)
        toast.success('Copiado para área de transferência!')
      })
    } else {
      navigator.clipboard.writeText(texto)
      toast.success('Copiado para área de transferência!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">
            Gerencie jogos, festas e eventos da sua torcida
          </p>
        </div>
        <Button asChild>
          <Link href="/gestor/eventos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Link>
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">
                {eventos.filter(e => new Date(e.data_hora) > new Date()).length}
              </div>
              <p className="text-sm text-muted-foreground">Próximos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">
                {eventos.reduce((sum, e) => sum + (e.qtd_ingressos_vendidos || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Ingressos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-2xl font-bold">
                {eventos.filter(e => e.status === 'encerrado').length}
              </div>
              <p className="text-sm text-muted-foreground">Encerrados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, local ou adversário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('todos')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'futuros' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('futuros')}
              >
                Próximos
              </Button>
              <Button
                variant={filter === 'passados' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('passados')}
              >
                Passados
              </Button>
            </div>
          </div>

          {/* Filtro por Ranking */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Medal className="h-4 w-4" />
              Ranking:
            </span>
            <Button
              variant={rankingFilter === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRankingFilter('todos')}
            >
              Todos
            </Button>
            <Button
              variant={rankingFilter === 'ouro' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRankingFilter('ouro')}
              className={rankingFilter === 'ouro' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
            >
              Ouro
            </Button>
            <Button
              variant={rankingFilter === 'prata' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRankingFilter('prata')}
              className={rankingFilter === 'prata' ? 'bg-gray-400 hover:bg-gray-500' : ''}
            >
              Prata
            </Button>
            <Button
              variant={rankingFilter === 'bronze' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRankingFilter('bronze')}
              className={rankingFilter === 'bronze' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              Bronze
            </Button>
          </div>
        </div>
      </Card>

      {/* Erro com retry */}
      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <Button onClick={loadEventos} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </Card>
      )}

      {/* Lista de Eventos */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando eventos...</p>
        </div>
      ) : filteredEventos.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || filter !== 'todos'
              ? 'Nenhum evento encontrado com os filtros aplicados.'
              : 'Nenhum evento cadastrado ainda.'}
          </p>
          <Button asChild className="mt-4">
            <Link href="/gestor/eventos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Evento
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEventos.map((evento) => (
            <Card key={evento.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-lg leading-tight">{evento.nome_evento}</h3>
                    {evento.time_casa && evento.time_visitante && (
                      <p className="text-sm text-muted-foreground">
                        {evento.time_casa} vs {evento.time_visitante}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteEvento(evento)}
                    disabled={deletingId === evento.id}
                    title="Excluir evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Informações do Evento */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(evento.data_hora)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {evento.local}
                  </div>
                  {evento.qtd_ingressos_total && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {evento.qtd_ingressos_vendidos || 0}/{evento.qtd_ingressos_total} ingressos
                    </div>
                  )}
                </div>

                {/* Ranking e Status */}
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(evento.status)}
                    <RankingMinimoEventoBadge rankingMinimo={evento.ranking_minimo || null} />
                  </div>
                  <div className="flex justify-end gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadCSVIngressos(evento)}
                      disabled={downloadingId === evento.id}
                    >
                      <FileDown className="mr-1 h-3 w-3" />
                      CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareEvento(evento)}
                    >
                      <Share2 className="mr-1 h-3 w-3" />
                      Compartilhar
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/gestor/eventos/${evento.id}/editar`}>
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
