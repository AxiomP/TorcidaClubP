'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import dynamic from 'next/dynamic'

const CheckCircle = dynamic(() => import('lucide-react').then(m => ({ default: m.CheckCircle })), { ssr: false })
const Clock = dynamic(() => import('lucide-react').then(m => ({ default: m.Clock })), { ssr: false })
const RefreshCw = dynamic(() => import('lucide-react').then(m => ({ default: m.RefreshCw })), { ssr: false })
const ExternalLink = dynamic(() => import('lucide-react').then(m => ({ default: m.ExternalLink })), { ssr: false })
const CreditCard = dynamic(() => import('lucide-react').then(m => ({ default: m.CreditCard })), { ssr: false })
const Zap = dynamic(() => import('lucide-react').then(m => ({ default: m.Zap })), { ssr: false })
const Smartphone = dynamic(() => import('lucide-react').then(m => ({ default: m.Smartphone })), { ssr: false })
const PartyPopper = dynamic(() => import('lucide-react').then(m => ({ default: m.PartyPopper })), { ssr: false })

type Modalidade = 'pix_automatico' | 'debito' | 'credito'

interface AssinaturaData {
  assinatura_status: 'pendente' | 'ativa' | 'vencida' | null
  assinatura_validade: string | null
  invoiceUrl: string | null
  paymentStatus: string | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const { gestorData, loading: authLoading } = useAuth()
  const gestorId = gestorData?.id

  const [data, setData] = useState<AssinaturaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<Modalidade | null>(null)
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [gerando, setGerando] = useState(false)

  const [pollingAtivo, setPollingAtivo] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAssinatura = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/gestores/assinatura')
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Erro ao carregar assinatura')
      }
      const json: AssinaturaData = await res.json()
      setData(json)

      if (json.assinatura_status === 'ativa') {
        pararPolling()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!gestorId) { setLoading(false); return }
    fetchAssinatura()
  }, [fetchAssinatura, authLoading, gestorId])

  // Redirecionar para perfil quando assinatura for ativada
  useEffect(() => {
    if (data?.assinatura_status === 'ativa') {
      const timer = setTimeout(() => { window.location.href = '/gestor/perfil' }, 2000)
      return () => clearTimeout(timer)
    }
  }, [data?.assinatura_status, router])

  // Polling de pagamento PIX a cada 15s
  useEffect(() => {
    if (!pollingAtivo) return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/gestores/assinatura/pix-automatico')
        if (!res.ok) return
        const json = await res.json()

        if (['RECEIVED', 'CONFIRMED'].includes(json.status)) {
          pararPolling()
          await fetchAssinatura()
        }
      } catch {
        // Ignorar erros de polling
      }
    }, 15_000)

    return () => pararPolling()
  }, [pollingAtivo, fetchAssinatura])

  function pararPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setPollingAtivo(false)
  }

  async function handleGerarPixAutomatico() {
    try {
      setGerando(true)
      setError(null)
      const digitos = cpfCnpj.replace(/\D/g, '')
      if (digitos.length !== 11 && digitos.length !== 14) {
        throw new Error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      }
      const res = await fetch('/api/gestores/assinatura/pix-automatico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfCnpj: digitos }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erro ao gerar assinatura PIX')

      // Atualizar UI com o estado atual (invoiceUrl vem do GET /api/gestores/assinatura)
      await fetchAssinatura()
      setPollingAtivo(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar assinatura PIX')
    } finally {
      setGerando(false)
    }
  }

  async function handleGerarCobranca(modalidade: 'debito' | 'credito') {
    try {
      setGerando(true)
      setError(null)
      const res = await fetch('/api/gestores/assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modalidade }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erro ao gerar cobrança')
      if (body.invoiceUrl) {
        window.open(body.invoiceUrl, '_blank', 'noopener,noreferrer')
      }
      await fetchAssinatura()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar cobrança')
    } finally {
      setGerando(false)
    }
  }

  async function handleVerificar() {
    setVerifying(true)
    await fetchAssinatura()
    setVerifying(false)
  }

  function handleMudarMetodo() {
    setModalidadeSelecionada(null)
    setCpfCnpj('')
    pararPolling()
    if (data) setData({ ...data, invoiceUrl: null })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const status = data?.assinatura_status ?? 'pendente'
  const mostrarInvoice = !!data?.invoiceUrl && status === 'pendente'
  const mostrarCheckout = status !== 'ativa' && !mostrarInvoice

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Header de boas-vindas */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <PartyPopper className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao TorcidaClub®!</h1>
          </div>
          <p className="text-muted-foreground">
            Para liberar seu acesso completo, escolha como deseja pagar sua assinatura mensal.
          </p>
        </div>

        {error && (
          <Card className="p-4 border-red-500/50 bg-red-500/10">
            <p className="text-red-400 text-sm">{error}</p>
          </Card>
        )}

        {/* ── Assinatura ATIVA ─────────────────────────────────────────────── */}
        {status === 'ativa' && (
          <Card className="p-6 border-green-500/50 bg-green-500/5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="space-y-1">
                <h2 className="font-semibold text-green-400 text-lg">Assinatura Ativada!</h2>
                <p className="text-sm text-muted-foreground">
                  Pagamento confirmado. Redirecionando para o painel...
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Link de pagamento (PIX assinatura, débito ou crédito) ──────── */}
        {status === 'pendente' && mostrarInvoice && (
          <Card className="p-6 border-yellow-500/50 bg-yellow-500/5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <h2 className="font-semibold text-yellow-400 text-lg">Pagamento Pendente</h2>
                  <p className="text-sm text-muted-foreground">
                    Sua cobrança foi gerada. Clique em &quot;Pagar Agora&quot; para concluir.
                    Após a confirmação, sua assinatura será ativada automaticamente.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    onClick={() => window.open(data!.invoiceUrl!, '_blank', 'noopener,noreferrer')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Pagar Agora
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleVerificar}
                    disabled={verifying}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
                    {verifying ? 'Verificando...' : 'Verificar Pagamento'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={handleMudarMetodo}
                  >
                    Mudar método
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── Checkout: Seletor de método ──────────────────────────────────── */}
        {mostrarCheckout && (
          <Card className="p-6 border-muted/50">
            <div className="space-y-5">
              <p className="text-sm font-medium">Escolha o método de pagamento:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setModalidadeSelecionada('pix_automatico')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    modalidadeSelecionada === 'pix_automatico'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted/50 hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Zap className="h-5 w-5" />
                  <span className="text-center leading-tight">PIX<br />Automático</span>
                </button>
                <button
                  onClick={() => setModalidadeSelecionada('debito')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    modalidadeSelecionada === 'debito'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted/50 hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-center leading-tight">Cartão<br />Débito</span>
                </button>
                <button
                  onClick={() => setModalidadeSelecionada('credito')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    modalidadeSelecionada === 'credito'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted/50 hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-center leading-tight">Cartão<br />Crédito</span>
                </button>
              </div>

              {modalidadeSelecionada === 'pix_automatico' && (
                <div className="text-sm text-muted-foreground bg-muted/10 rounded-lg p-3 space-y-3">
                  <div>
                    <p className="font-medium text-foreground mb-1">⚡ PIX Recorrente</p>
                    <p>Gera uma assinatura mensal via PIX. Você recebe o link de pagamento e o Asaas
                    cuida das renovações automáticas mês a mês.</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cpfCnpj" className="text-foreground font-medium">
                      CPF / CNPJ <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="cpfCnpj"
                      value={cpfCnpj}
                      onChange={e => setCpfCnpj(e.target.value)}
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obrigatório pelo processador de pagamentos (Asaas).
                    </p>
                  </div>
                </div>
              )}
              {modalidadeSelecionada === 'debito' && (
                <div className="text-sm text-muted-foreground bg-muted/10 rounded-lg p-3">
                  <p className="font-medium text-foreground mb-1">💳 Cartão de Débito</p>
                  <p>Você será redirecionado para o checkout seguro do Asaas para pagar com cartão de débito.
                  A assinatura é renovada manualmente a cada ciclo.</p>
                </div>
              )}
              {modalidadeSelecionada === 'credito' && (
                <div className="text-sm text-muted-foreground bg-muted/10 rounded-lg p-3">
                  <p className="font-medium text-foreground mb-1">💳 Cartão de Crédito</p>
                  <p>Você será redirecionado para o checkout seguro do Asaas para pagar com cartão de crédito.
                  A assinatura é renovada manualmente a cada ciclo.</p>
                </div>
              )}

              {modalidadeSelecionada && (
                <Button
                  className="w-full gap-2"
                  disabled={gerando}
                  onClick={() => {
                    if (modalidadeSelecionada === 'pix_automatico') {
                      handleGerarPixAutomatico()
                    } else {
                      handleGerarCobranca(modalidadeSelecionada)
                    }
                  }}
                >
                  <RefreshCw className={`h-4 w-4 ${gerando ? 'animate-spin' : ''}`} />
                  {gerando ? 'Gerando...' : 'Gerar link de pagamento'}
                </Button>
              )}
            </div>
          </Card>
        )}

        <Card className="p-4 border-muted/50 bg-muted/5">
          <p className="text-xs text-muted-foreground">
            Pagamentos processados com segurança via{' '}
            <span className="font-medium">Asaas</span>.
            Em caso de dúvidas, entre em contato com o suporte.
          </p>
        </Card>
      </div>
    </div>
  )
}
