'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Componentes do dashboard
import { BeneficiosSection } from '@/components/socio/beneficios-section'
import { CompartilharSection } from '@/components/socio/compartilhar-section'
import { MensalidadeCard } from '@/components/socio/mensalidade-card'
import { EventosSection } from '@/components/socio/eventos-section'
import { PatrocinadorPopup } from '@/components/socio/patrocinador-popup'

import type { Database } from '@/types/database'

type Beneficio = Database['public']['Tables']['beneficios']['Row']
type Dependente = Database['public']['Tables']['dependentes']['Row']
type Pagamento = Database['public']['Tables']['pagamentos']['Row']
type Evento = Database['public']['Tables']['eventos']['Row']
type TipoMensalidade = Database['public']['Tables']['tipos_mensalidade']['Row']
type Torcida = Database['public']['Tables']['torcidas']['Row']

export default function PainelSocioPage() {
  const { torcidaId, loading: authLoading, isDependente, dependenteData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [beneficios, setBeneficios] = useState<Beneficio[]>([])
  const [dependentes, setDependentes] = useState<Dependente[]>([])
  const [pagamentoAtual, setPagamentoAtual] = useState<Pagamento | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [tipoMensalidade, setTipoMensalidade] = useState<TipoMensalidade | null>(null)
  const [torcida, setTorcida] = useState<Torcida | null>(null)
  const [socioData, setSocioData] = useState<Database['public']['Tables']['socios']['Row'] | null>(null)

  const fetchDashboardData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = isDependente ? '/api/dependente/painel' : '/api/socio/painel'
      const res = await fetch(endpoint, { signal })
      if (signal?.aborted) return
      if (!res.ok) throw new Error('Erro ao carregar painel')
      const data = await res.json()
      if (signal?.aborted) return

      if (data.socio) setSocioData(data.socio)
      if (data.beneficios) setBeneficios(data.beneficios)
      if (data.dependentes) setDependentes(data.dependentes)
      if (data.pagamento) setPagamentoAtual(data.pagamento)
      if (data.eventos) setEventos(data.eventos)
      if (data.torcida) setTorcida(data.torcida)
      if (data.tipoMensalidade) setTipoMensalidade(data.tipoMensalidade)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      console.error('Erro ao carregar dados do painel:', err)
      setError('Erro ao carregar dados. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [isDependente])

  useEffect(() => {
    if (authLoading) return

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    fetchDashboardData(controller.signal).finally(() => clearTimeout(timeoutId))

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [fetchDashboardData, authLoading])

  const isLoading = authLoading || loading

  // 1. Loading state — Segura a renderização até que a API termine de responder
  if (isLoading) {
    return (
      <div className="space-y-5 md:space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // 2. Error state with retry
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="text-sm text-primary hover:underline font-medium"
          >
            Tentar novamente
          </button>
        </Card>
      </div>
    )
  }

  // 3. Painel para sócio dependente — view simplificada
  if (isDependente) {
    const nomeDep = (dependenteData?.nome_completo as string | undefined)?.split(' ')[0] ?? 'Dependente'
    return (
      <div className="space-y-5 md:space-y-8">
        <PatrocinadorPopup torcidaId={torcidaId as string | null} />
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Olá, {nomeDep}!</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel. Acompanhe eventos e benefícios da torcida.
          </p>
        </div>
        <EventosSection eventos={eventos} loading={loading} socioRanking="bronze" />
        <BeneficiosSection beneficios={beneficios} loading={loading} />
        <CompartilharSection
          codigoReferencia={null}
          beneficios={beneficios}
          nomeTorcida={torcida?.nome}
        />
      </div>
    )
  }

  // 4. Tipo Guard isolado: Daqui para baixo o TS sabe que socioData NÃO é null
  if (!socioData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Dados não encontrados</h2>
          <p className="text-muted-foreground">
            Não foi possível carregar seus dados. Tente fazer login novamente.
          </p>
        </Card>
      </div>
    )
  }

  const socio = socioData
  const dependentesAtivos = dependentes.filter((d) => d.status === 'ativo')
  const valorMensalidadeBase = tipoMensalidade?.valor || 0
  const valorAdicionalDependente = torcida?.valor_adicional_dependente || 0

  return (
    <div className="space-y-5 md:space-y-8">
      {/* Popup de patrocinador (1x por sessão) */}
      <PatrocinadorPopup torcidaId={torcidaId as string | null} />

      {/* Header com saudação */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Olá, {socioData.nome_completo?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel. Aqui você acompanha tudo sobre sua associação.
        </p>
      </div>

      {/* Mensalidade Card - destaque principal */}
      <MensalidadeCard
        pagamentoAtual={pagamentoAtual}
        valorMensalidadeBase={valorMensalidadeBase}
        qtdDependentes={dependentesAtivos.length}
        valorAdicionalDependente={valorAdicionalDependente}
        loading={loading}
      />

      {/* Próximo Vencimento */}
      <Card className="p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Próximo Venc.</span>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-1">
            {(() => {
              // Verifica se o pagamento atual está em dia (pago ou perdoado)
              const statusEmDia = pagamentoAtual?.status === 'confirmado' || pagamentoAtual?.status === 'perdoado'
              const dataString = (statusEmDia && socio.data_proximo_pagamento) 
                ? socio.data_proximo_pagamento 
                : pagamentoAtual?.data_vencimento

              if (!dataString) {
                return (
                  <>
                    <p className="text-xl sm:text-2xl font-bold">--</p>
                    <p className="text-xs text-muted-foreground">Sem vencimento ativo</p>
                  </>
                )
              }

              // Faz o parse seguro da string YYYY-MM-DD evitando quebras de fuso horário
              const [ano, mes, dia] = dataString.split('-').map(Number)
              const dataObjeto = new Date(ano, mes - 1, dia)

              return (
                <>
                  <p className="text-xl sm:text-2xl font-bold">
                    {format(dataObjeto, 'dd', { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(dataObjeto, 'MMMM/yyyy', { locale: ptBR })}
                  </p>
                </>
              )
            })()}
          </div>
        </div>
      </Card>

      <EventosSection eventos={eventos} loading={loading} socioRanking={socio.ranking ?? 'bronze'} />

      <BeneficiosSection beneficios={beneficios} loading={loading} />

      <CompartilharSection
        codigoReferencia={socio.codigo_referencia || null}
        beneficios={beneficios}
        nomeTorcida={torcida?.nome}
      />
    </div>
  )
}