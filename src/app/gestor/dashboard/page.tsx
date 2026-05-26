'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CountStatCard } from '@/components/ui/stat-card'
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid'
import { AcessosChart } from '@/components/dashboard/AcessosChart'
import { useAuth } from '@/hooks/use-auth'
import { Users, UserCheck, UserX, DollarSign, Cake, MessageCircle } from 'lucide-react'
import Link from 'next/link'

function ChartSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-[300px] w-full" />
    </Card>
  )
}

const RevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const MemberGrowthChart = dynamic(
  () => import('@/components/dashboard/MemberGrowthChart').then(m => ({ default: m.MemberGrowthChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

interface DashboardStats {
  members: {
    total: number
    active: number
    delinquent: number
    blocked: number
    pending: number
  }
  pending: {
    payments: number
    registrations: number
    total: number
  }
}

interface Aniversariante {
  id: string
  nome_completo: string
  data_nascimento: string
  whatsapp: string | null
}

interface ChartData {
  recentActivity: {
    payments: unknown[]
    registrations: unknown[]
  }
  revenue: Array<{
    month: string
    fullMonth: string
    revenue: number
    year: number
  }>
  memberGrowth: Array<{
    month: string
    fullMonth: string
    newMembers: number
    totalMembers: number
  }>
  engajamento: Array<{
    month: string
    fullMonth: string
    pagamentos: number
    cadastros: number
    total: number
  }>
  acessos: Array<{
    month: string
    fullMonth: string
    acessos: number
  }>
}

export default function DashboardPage() {
  const { torcidaId } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([])

  const fetchDashboardData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      console.log('[Dashboard] Iniciando carregamento...')

      // Fetch stats and charts in parallel
      const [statsRes, chartsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { signal }),
        fetch('/api/dashboard/charts', { signal }),
      ])

      console.log('[Dashboard] APIs responderam:', statsRes.status, chartsRes.status)

      if (!statsRes.ok || !chartsRes.ok) {
        throw new Error('Erro ao carregar dados do dashboard')
      }

      const statsData = await statsRes.json()
      const chartsData = await chartsRes.json()

      setStats(statsData)
      setCharts(chartsData)
      console.log('[Dashboard] Dados carregados com sucesso')
    } catch (err: unknown) {
      // Ignorar AbortError causado por cleanup do componente
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('[Dashboard] Requisição cancelada (cleanup ou timeout)')
        return
      }

      console.error('[Dashboard] Erro:', err)
      console.error('[Dashboard] Tipo:', err instanceof Error ? err.name : typeof err)
      console.error('[Dashboard] Mensagem:', err instanceof Error ? err.message : String(err))

      setError('Erro ao carregar dados do dashboard. Clique em "Tentar novamente".')
    } finally {
      setLoading(false)
      console.log('[Dashboard] Loading finalizado')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    fetchDashboardData(controller.signal).finally(() => clearTimeout(timeoutId))

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [fetchDashboardData])

  // Buscar aniversariantes do mês
  useEffect(() => {
    if (!torcidaId) return
    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    fetch('/api/socios?status=ativo&fields=aniversariantes')
      .then(r => r.json())
      .then(({ socios: data }) => {
        if (!data) return
        const filtrados = (data as Aniversariante[]).filter((s) => {
          if (!s.data_nascimento) return false
          const nasc = new Date(s.data_nascimento + 'T00:00:00')
          return nasc.getMonth() + 1 === mesAtual
        })
        filtrados.sort((a, b) => {
          const diaA = new Date(a.data_nascimento + 'T00:00:00').getDate()
          const diaB = new Date(b.data_nascimento + 'T00:00:00').getDate()
          return diaA - diaB
        })
        setAniversariantes(filtrados)
      })
      .catch(() => {})
  }, [torcidaId])

  // Retry baseado em estado (sem window.location.reload)
  function handleRetry() {
    fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !stats || !charts) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">{error || 'Erro ao carregar dados'}</p>
          <button
            onClick={handleRetry}
            className="text-sm text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão completa das métricas e atividades da torcida
        </p>
      </div>

      {/* Botões de Ação Rápida - No topo para fácil acesso */}
      <QuickActionsGrid torcidaId={torcidaId} />

      {/* Cards de Estatísticas */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <CountStatCard
          icon={Users}
          label="Total de Sócios"
          value={stats.members.total}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />

        <CountStatCard
          icon={UserCheck}
          label="Sócios Ativos"
          value={stats.members.active}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />

        <CountStatCard
          icon={UserX}
          label="Inadimplentes"
          value={stats.members.delinquent}
          iconColor="text-red-500"
          iconBgColor="bg-red-500/10"
        />
      </div>

      {/* Gráficos */}
      <div className="space-y-6">
        <RevenueChart data={charts.revenue || []} />
        <MemberGrowthChart data={charts.memberGrowth || []} />
      </div>

      {/* Pendências e Atividades Recentes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pendências */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Pendências</h2>
              <p className="text-sm text-muted-foreground">
                Ações que precisam de atenção
              </p>
            </div>
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
              <span className="text-sm font-bold text-orange-600">
                {stats.pending.total}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/gestor/socios?status=pendente"
              prefetch={false}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Cadastros Pendentes</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.pending.registrations} sócios aguardando aprovação
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-500">
                {stats.pending.registrations}
              </span>
            </Link>

            <Link
              href="/gestor/pagamentos?status=comprovante_enviado"
              prefetch={false}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Pagamentos Pendentes</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.pending.payments} comprovantes para validar
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-500">
                {stats.pending.payments}
              </span>
            </Link>
          </div>
        </Card>

        {/* Acessos à Plataforma */}
        <AcessosChart data={charts.acessos || []} />
      </div>

      {/* Aniversariantes do Mês */}
      {aniversariantes.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cake className="h-5 w-5 text-pink-500" />
            <h2 className="text-xl font-bold">Aniversariantes do Mês</h2>
            <span className="ml-2 text-sm text-muted-foreground">({aniversariantes.length})</span>
          </div>
          <div className="space-y-3">
            {aniversariantes.map((a) => {
              const nascimento = new Date(a.data_nascimento + 'T00:00:00')
              const dia = nascimento.getDate()
              const mes = nascimento.toLocaleString('pt-BR', { month: 'long' })
              const hoje = new Date()
              const isHoje = nascimento.getDate() === hoje.getDate() && nascimento.getMonth() === hoje.getMonth()
              const msgWpp = encodeURIComponent(`Olá ${a.nome_completo.split(' ')[0]}! A TorcidaClub deseja um Feliz Aniversário para você! 🎉🎂`)
              const wppLink = a.whatsapp
                ? `https://wa.me/55${a.whatsapp.replace(/\D/g, '')}?text=${msgWpp}`
                : null
              return (
                <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg border ${isHoje ? 'border-pink-300 bg-pink-50 dark:bg-pink-950/20' : ''}`}>
                  <div>
                    <p className="font-medium text-sm">{a.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">
                      {dia} de {mes}
                      {isHoje && <span className="ml-2 text-pink-600 font-semibold">🎂 Hoje!</span>}
                    </p>
                  </div>
                  {wppLink && (
                    <a
                      href={wppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Parabenizar
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
