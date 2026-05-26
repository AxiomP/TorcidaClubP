'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PaymentStatusBadge } from '@/components/pagamentos/payment-status-badge'
import { TorpixModal } from '@/components/socio/torpix-modal'
import { useAuth } from '@/hooks/use-auth'
import { calcularIdade } from '@/lib/utils/calculate'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  CreditCard,
  Zap,
  Loader2,
  Users,
  MessageCircle,
} from 'lucide-react'

type StatusPagamento = 'pendente' | 'comprovante_enviado' | 'confirmado' | 'recusado' | 'perdoado'

interface PagamentoData {
  id: string
  referencia_mes: string
  valor_original: number
  data_vencimento: string
  status: StatusPagamento
  data_pagamento?: string | null
  motivo_recusa?: string | null
}

interface PagamentoDependenteData extends PagamentoData {
  socio_id: string
  dependente_nome: string
}

interface TorpixTarget {
  id: string
  valor: number
  descricao: string
}

function parseDataPura(dataString: string): Date {
  const partes = dataString.split('T')[0].split('-').map(Number)
  // Meses no JS vão de 0 a 11 (partes[1] - 1)
  return new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0)
}

function formatarMesReferencia(dataString: string): string {
  const data = parseDataPura(dataString)
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function calcularDiferencaDias(dataVencimentoStr: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const venc = parseDataPura(dataVencimentoStr)
  venc.setHours(0, 0, 0, 0)

  return Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default function MensalidadePage() {
  const { loading: authLoading, isDependente, dependenteData, torcidaId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pagamentoAtual, setPagamentoAtual] = useState<PagamentoData | null>(null)
  const [historicoPagamentos, setHistoricoPagamentos] = useState<PagamentoData[]>([])
  const [dataProximoPagamento, setDataProximoPagamento] = useState<string | null>(null)
  const [pagamentosDependentes, setPagamentosDependentes] = useState<PagamentoDependenteData[]>([])
  const [chavePIX, setChavePIX] = useState<string | null>(null)
  const [tipoMensalidade, setTipoMensalidade] = useState<string>('')
  const [valorPlano, setValorPlano] = useState<number | null>(null)
  const [torpixOpen, setTorpixOpen] = useState(false)
  const [torpixTarget, setTorpixTarget] = useState<TorpixTarget | null>(null)
  const [idadeMinPagamento, setIdadeMinPagamento] = useState<number | null>(null)
  const [idadeMinLoading, setIdadeMinLoading] = useState(true)
  const [telefoneGestor, setTelefoneGestor] = useState<string | null>(null)

  const idadeAtual = (isDependente && dependenteData?.data_nascimento)
    ? calcularIdade(dependenteData.data_nascimento as string)
    : null

  useEffect(() => {
    if (!isDependente || !torcidaId) {
      setIdadeMinLoading(false)
      return
    }
    fetch(`/api/torcida/${torcidaId}/restricoes-idade`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.idade_min_pagamento != null) setIdadeMinPagamento(d.idade_min_pagamento)
        if (d?.telefone_gestor) setTelefoneGestor(d.telefone_gestor)
      })
      .catch(() => {})
      .finally(() => setIdadeMinLoading(false))
  }, [isDependente, torcidaId])

  // Buscar dados de mensalidade apenas para não-dependentes.
  // Dependentes nunca gerenciam a própria mensalidade — o responsável paga por eles.
  useEffect(() => {
    if (authLoading) return
    if (isDependente) return

    const controller = new AbortController()
    const { signal } = controller
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    async function fetchMensalidade(signal: AbortSignal) {
      setLoading(true)
      try {
        const res = await fetch('/api/socio/mensalidade', { signal })
        if (signal.aborted) return
        if (!res.ok) throw new Error('Erro ao carregar mensalidade')
        const data = await res.json()
        if (signal.aborted) return

        if (data.chavePix) setChavePIX(data.chavePix)
        if (data.telefone_gestor) setTelefoneGestor(data.telefone_gestor)
        if (data.data_proximo_pagamento) setDataProximoPagamento(data.data_proximo_pagamento)
        if (data.tipoMensalidade) {
          setTipoMensalidade(data.tipoMensalidade.nome)
          setValorPlano(data.tipoMensalidade.valor)
        }
        setPagamentosDependentes(data.pagamentosDependentes ?? [])

        if (data.pagamentos?.length > 0) {
          const pendente = data.pagamentos.find(
            (p: PagamentoData) => p.status === 'pendente' || p.status === 'comprovante_enviado' || p.status === 'recusado'
          )
          const atual = pendente || data.pagamentos[0]
          setPagamentoAtual(atual)
          const historico = data.pagamentos
            .filter((p: PagamentoData) => p.id !== atual.id)
            .slice(0, 10)
          setHistoricoPagamentos(historico)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Erro ao carregar mensalidade:', error)
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    fetchMensalidade(signal)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [authLoading, isDependente])

  function handleComprovanteEnviado(pagamentoId: string, isDepPayment: boolean) {
    if (isDepPayment) {
      setPagamentosDependentes(prev =>
        prev.map(p => p.id === pagamentoId
          ? { ...p, status: 'comprovante_enviado' as StatusPagamento, motivo_recusa: null }
          : p
        )
      )
    } else {
      setPagamentoAtual(prev =>
        prev ? { ...prev, status: 'comprovante_enviado', motivo_recusa: null } : prev
      )
    }
  }

  function openTorpix(target: TorpixTarget) {
    setTorpixTarget(target)
    setTorpixOpen(true)
  }

  // Dependente: enquanto carrega a restrição de idade, mostrar spinner
  if (isDependente && idadeMinLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Dependentes nunca gerenciam a própria mensalidade — o responsável paga por eles.
  // Abaixo da idade mínima: não são cobrados. Acima: o responsável paga.
  if (isDependente) {
    const abaixoIdadeMin = idadeMinPagamento !== null && idadeAtual !== null && idadeAtual < idadeMinPagamento
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-6 text-center space-y-4">
          <CreditCard className="h-10 w-10 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">Mensalidade</h2>
          <p className="text-sm text-muted-foreground">
            {abaixoIdadeMin
              ? `Como dependente, você não é cobrado(a) até completar ${idadeMinPagamento} anos.`
              : 'Como dependente, sua mensalidade é paga pelo sócio responsável.'}
          </p>
          {telefoneGestor && (
            <a
              href={`https://wa.me/55${telefoneGestor.replace(/\D/g, '')}?text=Preciso%20de%20ajuda`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Preciso de Ajuda
            </a>
          )}
        </Card>
      </div>
    )
  }

  // Carregando dados do titular
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const statusAtrasado =
    pagamentoAtual != null &&
    new Date() > new Date(pagamentoAtual.data_vencimento + 'T00:00:00') &&
    pagamentoAtual.status === 'pendente'
  const statusAguardando = pagamentoAtual?.status === 'comprovante_enviado'
  const statusEmDia =
    pagamentoAtual?.status === 'confirmado' ||
    pagamentoAtual?.status === 'perdoado'
  const statusRecusado = pagamentoAtual?.status === 'recusado'

  const diasParaVencimento = pagamentoAtual
    ? Math.round((parseDataPura(pagamentoAtual.data_vencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity
  const torpixVisivelTitular =
    pagamentoAtual?.status === 'pendente' && diasParaVencimento <= 7

  const torpixVisivelDependentes =
    pagamentosDependentes.some(d => {
      if (d.status !== 'pendente') return false
      const vencDep = parseDataPura(d.data_vencimento)
      return Math.round((vencDep.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) <= 7
    })

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minha Mensalidade</h1>
        <p className="text-gray-600 mt-1">
          Gerencie seus pagamentos e mantenha-se em dia
        </p>
      </div>

      {/* Sem pagamentos: card informativo com plano + PIX */}
      {!pagamentoAtual ? (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground opacity-60" />
            <div>
              <h2 className="text-xl font-semibold mb-1">Nenhuma mensalidade gerada</h2>
              {tipoMensalidade && valorPlano != null ? (
                <p className="text-sm text-muted-foreground">
                  Seu plano: <span className="font-medium text-foreground">{tipoMensalidade}</span>
                  {' — '}
                  <span className="font-medium text-foreground">
                    R$ {valorPlano.toFixed(2).replace('.', ',')}
                  </span>
                  /mês
                </p>
              ) : tipoMensalidade ? (
                <p className="text-sm text-muted-foreground">
                  Plano: <span className="font-medium text-foreground">{tipoMensalidade}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sua mensalidade ainda não foi gerada pelo gestor.
                </p>
              )}
            </div>
            {chavePIX ? (
              <div className="w-full pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Para adiantar seu pagamento, use a chave PIX da torcida:
                </p>
                <div className="flex items-center gap-2 bg-muted p-3 rounded-lg text-left">
                  <Zap className="h-4 w-4 text-green-600 shrink-0" />
                  <code className="text-sm break-all flex-1">{chavePIX}</code>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground border-t pt-3 w-full text-center">
                Para pagar, entre em contato com o gestor da sua torcida para obter as instruções de pagamento.
              </p>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Card de Status Principal */}
          <Card className="overflow-hidden">
            <div className={`p-4 flex items-center gap-3 ${
              statusEmDia
                ? 'bg-gradient-to-r from-green-600 to-emerald-500'
                : statusAtrasado
                ? 'bg-gradient-to-r from-red-600 to-rose-500'
                : statusAguardando
                ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                : 'bg-gradient-to-r from-orange-500 to-amber-400'
            }`}>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                {statusEmDia ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : statusAtrasado ? (
                  <AlertCircle className="h-6 w-6 text-white" />
                ) : statusAguardando ? (
                  <Clock className="h-6 w-6 text-white" />
                ) : (
                  <CreditCard className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg leading-none">
                  {statusEmDia
                    ? 'Mensalidade em Dia'
                    : statusAtrasado
                    ? 'Mensalidade Vencida'
                    : statusAguardando
                    ? 'Aguardando Aprovação'
                    : 'Mensalidade Pendente'}
                </p>
                {tipoMensalidade && (
                  <p className="text-white/80 text-xs mt-0.5">{tipoMensalidade}</p>
                )}
              </div>
              <PaymentStatusBadge status={pagamentoAtual.status} />
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Valor da Mensalidade</p>
                  <p className="text-2xl font-bold currency">
                    R$ {pagamentoAtual.valor_original.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vencimento</p>
                  <p className="text-2xl font-bold">
                    {(() => {
                      // Se a mensalidade atual estiver confirmada/perdoada E houver a data no sócio, use-a
                      if (statusEmDia && dataProximoPagamento) {
                        return parseDataPura(dataProximoPagamento).toLocaleDateString('pt-BR')
                      }
                      return parseDataPura(pagamentoAtual.data_vencimento).toLocaleDateString('pt-BR')
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {statusAtrasado ? 'Dias em atraso' : statusEmDia ? 'Situação' : 'Dias restantes'}
                  </p>
                  {statusEmDia ? (
                    <p className="text-2xl font-bold text-green-600">Em dia</p>
                  ) : (
                    <p className={`text-2xl font-bold ${diasParaVencimento < 0 ? 'text-red-600' : diasParaVencimento <= 5 ? 'text-orange-500' : ''}`}>
                      {Math.abs(diasParaVencimento)} {Math.abs(diasParaVencimento) === 1 ? 'dia' : 'dias'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Pagamento via TorPIX — visível quando faltam ≤7 dias ou já venceu */}
          {torpixVisivelTitular && chavePIX && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg leading-none">TorPIX</p>
                  <p className="text-green-100 text-xs mt-0.5">Pagamento PIX instantâneo para sócios</p>
                </div>
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full shrink-0">
                  Recomendado
                </span>
              </div>
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div>
                  <h3 className="text-lg font-semibold">Pague com TorPIX</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Realize o pagamento via PIX e envie o comprovante em poucos passos
                  </p>
                </div>
                <Button
                  onClick={() => openTorpix({
                    id: pagamentoAtual.id,
                    valor: pagamentoAtual.valor_original,
                    descricao: `Mensalidade ${new Date(pagamentoAtual.referencia_mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
                  })}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Pagar com TorPIX
                </Button>
              </div>
            </Card>
          )}

          {/* Pagamento recusado — exibir motivo + opção de reenvio */}
          {statusRecusado && chavePIX && (
            <Card className="overflow-hidden border-red-200">
              {pagamentoAtual.motivo_recusa && (
                <div className="bg-red-50 dark:bg-red-950/20 p-4 border-b border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        Comprovante Recusado
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
                        {pagamentoAtual.motivo_recusa}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg leading-none">TorPIX</p>
                  <p className="text-green-100 text-xs mt-0.5">Reenvie seu comprovante</p>
                </div>
              </div>
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Faça o pagamento novamente e reenvie o comprovante correto.
                </p>
                <button
                  type="button"
                  onClick={() => openTorpix({
                    id: pagamentoAtual.id,
                    valor: pagamentoAtual.valor_original,
                    descricao: `Mensalidade ${new Date(pagamentoAtual.referencia_mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
                  })}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-5 rounded-md transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  Reenviar via TorPIX
                </button>
              </div>
            </Card>
          )}

          {/* Sem PIX configurado + pagamento pendente */}
          {pagamentoAtual.status === 'pendente' && !chavePIX && (
            <Card className="p-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Forma de pagamento: entre em contato com o gestor da sua torcida para obter as instruções de pagamento.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Seção de Mensalidades dos Dependentes (apenas para titulares) */}
      {!isDependente && pagamentosDependentes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mensalidades dos Dependentes
          </h2>

          {/* Banner TorPIX de dependentes — visível quando algum dependente tem vencimento em ≤7 dias */}
          {chavePIX && torpixVisivelDependentes && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-none">TorPIX</p>
                  <p className="text-green-100 text-xs mt-0.5">Há dependentes com mensalidade pendente</p>
                </div>
              </div>
            </Card>
          )}

          {pagamentosDependentes.map(dep => {
            

            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)
            //const vencDep = new Date(dep.data_vencimento + 'T00:00:00')
            const diffDep = calcularDiferencaDias(dep.data_vencimento)
            const depAtrasado = diffDep < 0 && dep.status === 'pendente'
            const depRecusado = dep.status === 'recusado'
            const mesDep = formatarMesReferencia(dep.referencia_mes)
            
            return (
              <Card key={dep.id} className={`border ${depAtrasado ? 'border-red-200' : dep.status === 'comprovante_enviado' ? 'border-yellow-200' : 'border-gray-200'}`}>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{dep.dependente_nome}</p>
                      <p className="text-sm text-muted-foreground capitalize">{mesDep}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-bold">R$ {dep.valor_original.toFixed(2).replace('.', ',')}</p>
                      <PaymentStatusBadge status={dep.status} />
                    </div>
                  </div>

                  {/* Dias restantes / em atraso */}
                  {(dep.status === 'pendente' || depAtrasado) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className={`h-4 w-4 shrink-0 ${diffDep < 0 ? 'text-red-500' : diffDep <= 5 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <span className={diffDep < 0 ? 'text-red-600' : diffDep <= 5 ? 'text-orange-500' : 'text-muted-foreground'}>
                        {diffDep < 0
                          ? `${Math.abs(diffDep)} dia${Math.abs(diffDep) !== 1 ? 's' : ''} em atraso`
                          : `${diffDep} dia${diffDep !== 1 ? 's' : ''} restante${diffDep !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  )}

                  {depRecusado && dep.motivo_recusa && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{dep.motivo_recusa}</span>
                    </div>
                  )}

                  {(dep.status === 'pendente' || depRecusado) && chavePIX && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 w-full"
                      onClick={() => openTorpix({
                        id: dep.id,
                        valor: dep.valor_original,
                        descricao: `Mensalidade ${dep.dependente_nome} — ${mesDep}`,
                      })}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {depRecusado ? `Reenviar por ${dep.dependente_nome}` : `Pagar por ${dep.dependente_nome}`}
                    </Button>
                  )}

                  {dep.status === 'comprovante_enviado' && (
                    <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>Comprovante enviado, aguardando aprovação do gestor.</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Histórico de Pagamentos */}
      {historicoPagamentos.length > 0 && (
        <Card>
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Histórico de Pagamentos
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {historicoPagamentos.map((pagamento) => {
                const mes = new Date(pagamento.referencia_mes).toLocaleDateString(
                  'pt-BR',
                  { month: 'long', year: 'numeric' }
                )
                const dataPagamento = pagamento.data_pagamento
                  ? new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')
                  : '-'

                return (
                  <div
                    key={pagamento.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {pagamento.status === 'confirmado' ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : pagamento.status === 'pendente' ? (
                        <Clock className="h-5 w-5 text-warning" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium capitalize">{mes}</p>
                        {pagamento.data_pagamento && (
                          <p className="text-sm text-gray-600">
                            Pago em: {dataPagamento}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold currency">
                        R$ {pagamento.valor_original.toFixed(2).replace('.', ',')}
                      </p>
                      <PaymentStatusBadge status={pagamento.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Botão de ajuda via WhatsApp do gestor */}
      {telefoneGestor && (
        <div className="flex justify-center">
          <a
            href={`https://wa.me/55${telefoneGestor.replace(/\D/g, '')}?text=Preciso%20de%20ajuda`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Preciso de Ajuda
          </a>
        </div>
      )}

      {/* Modal TorPIX compartilhado (titular + dependentes) */}
      {torpixTarget && (
        <TorpixModal
          open={torpixOpen}
          onOpenChange={(open) => {
            setTorpixOpen(open)
            if (!open) setTorpixTarget(null)
          }}
          pagamentoId={torpixTarget.id}
          valor={torpixTarget.valor}
          chavePix={chavePIX}
          tipo="mensalidade"
          descricao={torpixTarget.descricao}
          onComprovanteEnviado={() => {
            const isDepPayment = pagamentosDependentes.some(p => p.id === torpixTarget.id)
            handleComprovanteEnviado(torpixTarget.id, isDepPayment)
          }}
        />
      )}
    </div>
  )
}
