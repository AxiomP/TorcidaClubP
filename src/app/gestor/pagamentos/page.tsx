'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { PaymentFilters } from '@/components/pagamentos/payment-filters'
import { PaymentList } from '@/components/pagamentos/payment-list'
import { IngressoCard, type CompraIngresso } from '@/components/pagamentos/ingresso-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { Pagamento, PagamentoStatus } from '@/types/pagamento'
import { generateRelatorioFinanceiroPDF } from '@/lib/services/pdf-service'
import { Loader2, Save, CreditCard, FileDown, Ticket, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'

interface CompraIngressoGroup extends CompraIngresso {
  ids: string[]
  quantidade: number
  valorTotal: number
  ingressosDoLote: CompraIngresso[]
}

function groupIngressosGestor(ingressos: CompraIngresso[]): CompraIngressoGroup[] {
  const map = new Map<string, CompraIngressoGroup>()

  for (const ing of ingressos) {
    const prefix = ing.codigo_validacao?.includes('-ticket-') 
      ? ing.codigo_validacao.split('-ticket-')[0] 
      : null
      
    const key = prefix ? `${ing.evento_id}|${prefix}` : `${ing.evento_id}|avulso-${ing.id}`

    const existing = map.get(key)
    if (existing) {
      existing.ids.push(ing.id)
      existing.quantidade += 1
      existing.valorTotal += ing.valor
      existing.ingressosDoLote.push(ing)
      continue
    }

    map.set(key, {
      ...ing,
      ids: [ing.id],
      quantidade: 1,
      valorTotal: ing.valor,
      ingressosDoLote: [ing]
    })
  }

  return Array.from(map.values())
}

const financialSchema = z.object({
  chave_pix: z.string().max(100).optional().or(z.literal('')),
  dia_vencimento_mensalidade: z.number().int().min(1).max(31),
  idade_min_pagamento: z.number().int().min(0).max(100),
})
type FinancialData = z.infer<typeof financialSchema>
import { TabMensalidades } from '@/components/configuracoes/tab-mensalidades'
import { VisualizarModal, type VisualizarItem } from '@/components/pagamentos/visualizar-modal'
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Receipt,
  Settings,
} from 'lucide-react'
interface Stats {
  total: number
  comprovantes: number
  confirmados: number
  pendentes: number
  recusados: number
  totalArrecadado: number
  totalPendente: number
}

export default function PagamentosPage() {
  const { torcidaId: authTorcidaId, loading: authLoading } = useAuth()
  const isFetchingRef = useRef(false)
  const configLoadedRef = useRef(false)

  useEffect(() => {
    return () => {
      configLoadedRef.current = false
    }
  }, [])

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [ingressos, setIngressos] = useState<CompraIngresso[]>([])
  const [listaDependentes, setListaDependentes] = useState<{ cpf: string }[]>([]);
  const [loading, setLoading] = useState(true)
  const [statusFiltro, setStatusFiltro] = useState<PagamentoStatus | 'todos'>('todos')
  const [mesFiltro, setMesFiltro] = useState('todos')
  const [buscaFiltro, setBuscaFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'mensalidade' | 'ingresso'>('todos')
  const [torcidaId, setTorcidaId] = useState<string | null>(null)
  const [torcidaInfo, setTorcidaInfo] = useState<{ nome: string; slug: string; chave_pix: string | null; brasao_url: string | null; presidente: string | null; vice_presidente: string | null } | null>(null)
  const [activeTab, setActiveTab] = useState<'transacoes' | 'configuracoes'>('transacoes')
  const [stats, setStats] = useState<Stats>({
    total: 0,
    comprovantes: 0,
    confirmados: 0,
    pendentes: 0,
    recusados: 0,
    totalArrecadado: 0,
    totalPendente: 0,
  })

  const [gerandoPDF, setGerandoPDF] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)
  const [todosItems, setTodosItems] = useState<VisualizarItem[]>([])

  const ingressosScrollRef = useRef<HTMLDivElement>(null)
  const [ingressosCanLeft, setIngressosCanLeft] = useState(false)
  const [ingressosCanRight, setIngressosCanRight] = useState(true)

  const handleBaixarRelatorio = async () => {
    if (!torcidaInfo) return
    setGerandoPDF(true)
    try {
      const periodo = mesFiltro && mesFiltro !== 'todos'
        ? new Date(mesFiltro + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

      await generateRelatorioFinanceiroPDF(pagamentos, ingressos, listaDependentes || [], torcidaInfo, periodo)
      
      toast.success('Relatório filtrado gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório PDF')
    } finally {
      setGerandoPDF(false)
    }
  }

  const handleVisualizar = (itemId: string) => {
    const idx = todosItems.findIndex(i => i.id === itemId)
    setModalIndex(idx >= 0 ? idx : 0)
    setModalAberto(true)
  }

  // --- ADICIONE ESTE BLOCO AQUI ---
  const [saving, setSaving] = useState(false)

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FinancialData>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      chave_pix: '',
      dia_vencimento_mensalidade: 10,
      idade_min_pagamento: 0,
    },
  })

  // Função para salvar via API route (evita problema de sessão client-side)
  const onSubmit = async (data: FinancialData) => {
    try {
      setSaving(true)

      const response = await fetch('/api/gestor/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chave_pix: data.chave_pix,
          dia_vencimento_mensalidade: data.dia_vencimento_mensalidade,
          idade_min_pagamento: data.idade_min_pagamento,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Falha ao salvar')
      }

      toast.success('Configurações financeiras salvas!')
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error)
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar dados')
    } finally {
      setSaving(false)
    }
  }

  // Função para carregar os dados já inseridos
  useEffect(() => {
    async function carregarConfiguracoes() {
      if (activeTab !== 'configuracoes') return
      if (configLoadedRef.current) return

      try {
        const res = await fetch('/api/gestor/financeiro')
        if (!res.ok) return
        const { torcida } = await res.json()
        if (torcida) {
          reset({
            chave_pix: torcida.chave_pix || '',
            dia_vencimento_mensalidade: torcida.dia_vencimento_mensalidade || 10,
            idade_min_pagamento: torcida.idade_min_pagamento || 0,
          })
        }
        configLoadedRef.current = true
      } catch (err) {
        console.error('Erro ao carregar configurações:', err)
      }
    }
    carregarConfiguracoes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])
  // --------------------------------

  // Sincronizar torcidaId do useAuth() e carregar info da torcida
  useEffect(() => {
    if (!authTorcidaId) return
    setTorcidaId(authTorcidaId)

    fetch('/api/gestor/financeiro')
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.torcida) setTorcidaInfo({
          nome: json.torcida.nome,
          slug: json.torcida.slug,
          chave_pix: json.torcida.chave_pix,
          brasao_url: json.torcida.brasao_url,
          presidente: json.torcida.presidente,
          vice_presidente: json.torcida.vice_presidente,
        })
      })
      .catch(console.error)
  }, [authTorcidaId])

  const loadPagamentos = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      setLoading(true)

      // Buscar mensalidades e ingressos em paralelo
      const pagParams = new URLSearchParams()
      if (statusFiltro !== 'todos') pagParams.set('status', statusFiltro)
      if (mesFiltro && mesFiltro !== 'todos') pagParams.set('mes', mesFiltro)
      pagParams.set('limit', '500')

      const ingParams = new URLSearchParams()
      // Mapear status de mensalidade para ingresso onde aplicável
      if (statusFiltro === 'confirmado') ingParams.set('status', 'aprovado')
      else if (statusFiltro !== 'todos' && statusFiltro !== 'perdoado') ingParams.set('status', statusFiltro)
      ingParams.set('limit', '500')

      const [pagRes, ingRes] = await Promise.all([
        fetch(`/api/pagamentos?${pagParams}`),
        fetch(`/api/ingressos?${ingParams}`),
      ])

      if (!pagRes.ok) throw new Error('Erro ao carregar pagamentos')
      const { pagamentos: pagData, dependentes_cpfs } = await pagRes.json()
      const { ingressos: ingData } = ingRes.ok ? await ingRes.json() : { ingressos: [] }

      if (dependentes_cpfs) {
        setListaDependentes(dependentes_cpfs.map((cpf: string) => ({ cpf })))
      }

      let pagamentosFiltrados = (pagData || []) as Pagamento[]
      let ingressosFiltrados = (ingData || []) as CompraIngresso[]

      // Aplicar filtro de busca (client-side por nome do sócio)
      if (buscaFiltro) {
        const termoBusca = buscaFiltro.toLowerCase()
        pagamentosFiltrados = pagamentosFiltrados.filter(p =>
          p.socios?.nome_completo?.toLowerCase().includes(termoBusca) ||
          p.socios?.apelido?.toLowerCase().includes(termoBusca) ||
          p.socios?.cpf?.includes(termoBusca)
        )
        ingressosFiltrados = ingressosFiltrados.filter(i =>
          i.socios?.nome_completo?.toLowerCase().includes(termoBusca) ||
          i.socios?.apelido?.toLowerCase().includes(termoBusca) ||
          i.socios?.cpf?.includes(termoBusca) ||
          i.nome_adicional?.toLowerCase().includes(termoBusca)
        )
      }

      setPagamentos(pagamentosFiltrados)
      setIngressos(ingressosFiltrados)

      // Calcular estatísticas (do total, sem filtros de status/mês)
      const [statsRes, ingStatsRes] = await Promise.all([
        fetch('/api/pagamentos?limit=1000'),
        fetch('/api/ingressos?limit=1000'),
      ])

      if (statsRes.ok) {
        const { pagamentos: allPagamentos } = await statsRes.json()
        const { ingressos: allIngressos } = ingStatsRes.ok ? await ingStatsRes.json() : { ingressos: [] }

        if (allPagamentos) {
          // Montar lista unificada para o modal (mensalidades + ingressos)
          const itemsUnificados: VisualizarItem[] = [
            ...(allPagamentos as Pagamento[]).map((p) => ({ ...p, _tipo: 'mensalidade' as const })),
            ...(allIngressos as CompraIngresso[]).map((i) => ({ ...i, _tipo: 'ingresso' as const })),
          ]
          setTodosItems(itemsUnificados)

          const ingressosComprovantes = (allIngressos as CompraIngresso[]).filter(
            (i) => i.status === 'comprovante_enviado'
          ).length

          const newStats: Stats = {
            total: allPagamentos.length + (allIngressos?.length ?? 0),
            comprovantes: allPagamentos.filter((p: Pagamento) => p.status === 'comprovante_enviado').length + ingressosComprovantes,
            confirmados: allPagamentos.filter((p: Pagamento) => p.status === 'confirmado').length +
              (allIngressos as CompraIngresso[]).filter((i) => i.status === 'aprovado').length,
            pendentes: allPagamentos.filter((p: Pagamento) => p.status === 'pendente').length +
              (allIngressos as CompraIngresso[]).filter((i) => i.status === 'pendente').length,
            recusados: allPagamentos.filter((p: Pagamento) => p.status === 'recusado').length +
              (allIngressos as CompraIngresso[]).filter((i) => i.status === 'recusado').length,
            totalArrecadado: allPagamentos
              .filter((p: Pagamento) => p.status === 'confirmado')
              .reduce((acc: number, p: Pagamento) => acc + (p.valor_original || 0), 0) +
              (allIngressos as CompraIngresso[])
                .filter((i) => i.status === 'aprovado')
                .reduce((acc, i) => acc + (i.valor || 0), 0),
            totalPendente: allPagamentos
              .filter((p: Pagamento) => ['pendente', 'comprovante_enviado', 'recusado'].includes(p.status))
              .reduce((acc: number, p: Pagamento) => acc + (p.valor_original || 0), 0) +
              (allIngressos as CompraIngresso[])
                .filter((i) => ['pendente', 'comprovante_enviado'].includes(i.status))
                .reduce((acc, i) => acc + (i.valor || 0), 0),
          }
          setStats(newStats)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [statusFiltro, mesFiltro, buscaFiltro])

  // Carregar pagamentos quando auth terminar OU filtros mudarem
  useEffect(() => {
    if (!authLoading) {
      loadPagamentos()
    }
  }, [authLoading, loadPagamentos])

  return (
    <div className="space-y-8 w-full overflow-x-hidden">
      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os pagamentos de mensalidades dos socios
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleBaixarRelatorio}
          disabled={gerandoPDF || pagamentos.length === 0}
        >
          {gerandoPDF ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Relatório PDF
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'transacoes' | 'configuracoes')} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="transacoes" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab Transações */}
        <TabsContent value="transacoes" forceMount className="space-y-8 data-[state=inactive]:hidden">
          {/* Cards de Estatisticas */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pagamentos do Mês"
          value={stats.total}
          icon={Receipt}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />

        <StatCard
          label="Para Aprovar"
          value={stats.comprovantes}
          icon={Clock}
          iconBgColor="bg-warning-bg"
          iconColor="text-warning"
          trend={{
            value: '3 novos hoje',
            isPositive: true,
            label: '',
          }}
        />

        <StatCard
          label="Pagos"
          value={stats.confirmados}
          icon={CheckCircle}
          iconBgColor="bg-success-bg"
          iconColor="text-success"
        />

        <StatCard
          label="Não Pagos"
          value={stats.pendentes}
          icon={XCircle}
          iconBgColor="bg-error-bg"
          iconColor="text-error"
        />
      </div>

      {/* Card de Receita */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-success-bg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Arrecadado</p>
              <p className="text-2xl font-bold currency">
                R$ {stats.totalArrecadado.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-success font-medium">
              Crescimento de 12% este mês
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-warning-bg flex items-center justify-center">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-gray-600">A Receber</p>
              <p className="text-2xl font-bold currency">
                R$ {stats.totalPendente.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {stats.pendentes + stats.comprovantes} pagamentos pendentes
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Filtrar Pagamentos</h2>
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {(['todos', 'mensalidade', 'ingresso'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoFiltro(tipo)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  tipoFiltro === tipo
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {tipo === 'ingresso' && <Ticket className="h-3.5 w-3.5" />}
                {tipo === 'todos' ? 'Todos' : tipo === 'mensalidade' ? 'Mensalidades' : 'Ingressos de Eventos'}
              </button>
            ))}
          </div>
        </div>
        <PaymentFilters
          onStatusChange={setStatusFiltro}
          onMesChange={setMesFiltro}
          onBuscaChange={setBuscaFiltro}
        />
      </Card>

      {/* Lista de Pagamentos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {statusFiltro === 'todos'
              ? 'Todos os Pagamentos'
              : statusFiltro === 'comprovante_enviado'
              ? 'Aguardando Aprovação'
              : statusFiltro === 'confirmado'
              ? 'Pagamentos Confirmados'
              : statusFiltro === 'pendente'
              ? 'Pagamentos Pendentes'
              : statusFiltro === 'recusado'
              ? 'Pagamentos Recusados'
              : 'Pagamentos Perdoados'}
          </h2>
          <span className="text-sm text-gray-600">
            {(tipoFiltro !== 'ingresso' ? pagamentos.length : 0) + (tipoFiltro !== 'mensalidade' ? ingressos.length : 0)}{' '}
            resultados
          </span>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-2 text-sm text-muted-foreground">Carregando pagamentos...</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Carrossel de Mensalidades */}
            {tipoFiltro !== 'ingresso' && (
              <div>
                {tipoFiltro === 'todos' && pagamentos.length > 0 && (
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Mensalidades
                  </h3>
                )}
                <PaymentList
                  pagamentos={pagamentos}
                  showActions
                  onRefresh={loadPagamentos}
                  chavePix={torcidaInfo?.chave_pix}
                  torcidaNome={torcidaInfo?.nome}
                  torcidaSlug={torcidaInfo?.slug}
                  onVisualizar={handleVisualizar}
                  onComprovanteClick={handleVisualizar}
                  layout="carousel"
                />
              </div>
            )}

            {/* Carrossel de Ingressos */}
            {tipoFiltro !== 'mensalidade' && ingressos.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Ticket className="h-4 w-4" />
                  Ingressos de Eventos
                </h3>
                <div className="relative">
                  {ingressosCanLeft && (
                    <>
                      <div className="absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
                      <button
                        onClick={() => ingressosScrollRef.current?.scrollBy({ left: -312, behavior: 'smooth' })}
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background shadow-md border flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="Anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  <div
                    ref={ingressosScrollRef}
                    onScroll={() => {
                      const el = ingressosScrollRef.current
                      if (!el) return
                      setIngressosCanLeft(el.scrollLeft > 4)
                      setIngressosCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
                    }}
                    className="flex gap-3 overflow-x-auto pb-2 px-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ scrollSnapType: 'x mandatory' }}
                  >
                    {groupIngressosGestor(ingressos).map((grupo) => (
                      <div
                        key={grupo.ids.join('-')}
                        className="shrink-0 w-[min(300px,82vw)]"
                        style={{ scrollSnapAlign: 'start' }}
                      >
                        <IngressoCard
                          ingressoGroup={grupo}
                          showActions
                          onRefresh={loadPagamentos}
                          onVisualizar={() => handleVisualizar(grupo.id)}
                        />
                      </div>
                    ))}
                    <div className="shrink-0 w-4" aria-hidden />
                  </div>
                  {ingressosCanRight && ingressos.length > 1 && (
                    <>
                      <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
                      <button
                        onClick={() => ingressosScrollRef.current?.scrollBy({ left: 312, behavior: 'smooth' })}
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background shadow-md border flex items-center justify-center hover:bg-muted transition-colors"
                        aria-label="Próximo"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {tipoFiltro !== 'mensalidade' && ingressos.length === 0 && pagamentos.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground text-sm">
                Nenhum pagamento encontrado.
              </Card>
            )}
          </div>
        )}
      </div>

        </TabsContent>

        {/* Tab Configurações */}
        <TabsContent value="configuracoes" forceMount className="data-[state=inactive]:hidden">
          {torcidaId ? (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Financeiro</h2>
                    <p className="text-sm text-muted-foreground">Configurações de pagamento</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Chave PIX */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="chave_pix">Chave PIX</Label>
                    <Input
                      id="chave_pix"
                      {...register('chave_pix')}
                      placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                    />
                    {errors.chave_pix && (
                      <p className="text-sm text-red-400">{errors.chave_pix.message}</p>
                    )}
                  </div>

                  {/* Idades Mínimas */}
                  <div className="space-y-2">
                    <Label htmlFor="idade_min_pagamento">Idade Mín. para Pagar</Label>
                    <Input
                      id="idade_min_pagamento"
                      type="number"
                      {...register('idade_min_pagamento', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Button
                      type="button"
                      onClick={handleSubmit(onSubmit)}
                      disabled={saving}
                      className="w-full md:w-auto"
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar Alterações Financeiras
                    </Button>
                  </div>
                </div>
              </Card>
              <TabMensalidades 
                torcidaId={torcidaId} 
                isActive={activeTab === 'configuracoes'} 
              />
            </div>
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando configurações...</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Não foi possível carregar as configurações.</p>
                    <Button variant="outline" size="sm" onClick={loadPagamentos}>
                      Tentar novamente
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal unificado de visualização */}
      {modalAberto && todosItems.length > 0 && (
        <VisualizarModal
          items={todosItems}
          open={modalAberto}
          onClose={() => setModalAberto(false)}
          onRefresh={loadPagamentos}
          initialIndex={modalIndex}
        />
      )}
    </div>
  )
}
