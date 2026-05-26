'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import QRCode from 'qrcode'

const CheckCircle = dynamic(() => import('lucide-react').then(m => ({ default: m.CheckCircle })), { ssr: false })
const Clock = dynamic(() => import('lucide-react').then(m => ({ default: m.Clock })), { ssr: false })
const XCircle = dynamic(() => import('lucide-react').then(m => ({ default: m.XCircle })), { ssr: false })
const RefreshCw = dynamic(() => import('lucide-react').then(m => ({ default: m.RefreshCw })), { ssr: false })
const ExternalLink = dynamic(() => import('lucide-react').then(m => ({ default: m.ExternalLink })), { ssr: false })
const CreditCard = dynamic(() => import('lucide-react').then(m => ({ default: m.CreditCard })), { ssr: false })
const Copy = dynamic(() => import('lucide-react').then(m => ({ default: m.Copy })), { ssr: false })
const Check = dynamic(() => import('lucide-react').then(m => ({ default: m.Check })), { ssr: false })
const Zap = dynamic(() => import('lucide-react').then(m => ({ default: m.Zap })), { ssr: false })
const Smartphone = dynamic(() => import('lucide-react').then(m => ({ default: m.Smartphone })), { ssr: false })

type Modalidade = 'pix_automatico' | 'debito' | 'credito'

interface AssinaturaData {
  assinatura_status: 'pendente' | 'ativa' | 'vencida' | null
  assinatura_validade: string | null
  invoiceUrl: string | null
  paymentStatus: string | null
  pixAuthPending: boolean
  pixPayload: string | null
}

export function AssinaturaSection() {
  const { gestorData, loading: authLoading } = useAuth()
  const gestorId = gestorData?.id

  const [data, setData] = useState<AssinaturaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // checkout state
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<Modalidade | null>(null)
  const [gerando, setGerando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  // PIX auto state
  const [pixPayload, setPixPayload] = useState<string | null>(null)
  const [qrCodeSrc, setQrCodeSrc] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [pollingAtivo, setPollingAtivo] = useState(false)

  // refetch principal
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

      // Se voltou com pixPayload, mostrar QR code
      if (json.pixPayload) {
        setPixPayload(json.pixPayload)
        gerarQrCode(json.pixPayload)
        setPollingAtivo(true)
      }

      // Se ativou, parar polling
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

  // Polling do PIX automático a cada 10s
  useEffect(() => {
    if (!pollingAtivo) return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/gestores/assinatura/pix-automatico')
        if (!res.ok) return
        const json = await res.json()

        if (json.status === 'ACTIVE') {
          pararPolling()
          // Recarregar dados principais para refletir a ativação
          await fetchAssinatura()
        }
      } catch {
        // Ignorar erros de polling
      }
    }, 10_000)

    return () => pararPolling()
  }, [pollingAtivo, fetchAssinatura])

  function pararPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setPollingAtivo(false)
  }

  async function gerarQrCode(payload: string) {
    try {
      const src = await QRCode.toDataURL(payload, { width: 220, margin: 2 })
      setQrCodeSrc(src)
    } catch {
      // QR code generation failure is non-fatal
    }
  }

  async function handleCancelarAssinatura() {
    if (!window.confirm(
      'Tem certeza que deseja cancelar sua assinatura?\n\n' +
      'Você perderá acesso à plataforma imediatamente e sua torcida será suspensa. ' +
      'Para reativar, basta efetuar um novo pagamento.'
    )) return

    try {
      setCancelando(true)
      setError(null)
      const res = await fetch('/api/gestores/assinatura', { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erro ao cancelar assinatura')
      await fetchAssinatura()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar assinatura')
    } finally {
      setCancelando(false)
    }
  }

  async function handleGerarPixAutomatico() {
    try {
      setGerando(true)
      setError(null)
      const res = await fetch('/api/gestores/assinatura/pix-automatico', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erro ao gerar autorização PIX')

      setPixPayload(body.payload)
      await gerarQrCode(body.payload)
      setPollingAtivo(true)
      await fetchAssinatura()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar PIX automático')
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

  function handleCopiarPix() {
    if (!pixPayload) return
    navigator.clipboard.writeText(pixPayload).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    })
  }

  function handleMudarMetodo() {
    setModalidadeSelecionada(null)
    setPixPayload(null)
    setQrCodeSrc(null)
    pararPolling()
  }

  function formatValidade(iso: string | null) {
    if (!iso) return null
    try {
      return format(new Date(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const status = data?.assinatura_status ?? 'pendente'
  // Resolver pixPayload: do estado local (recém criado) ou do GET
  const payloadAtivo = pixPayload ?? data?.pixPayload ?? null
  const mostrarQrCode = !!payloadAtivo && status !== 'ativa'
  const mostrarInvoice = !!data?.invoiceUrl && status !== 'ativa' && !mostrarQrCode
  const mostrarCheckout = !mostrarQrCode && !mostrarInvoice && status !== 'ativa'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Minha Assinatura</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie sua assinatura do TorcidaClub®
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {/* ── Status: ATIVA ──────────────────────────────────────────────────── */}
      {status === 'ativa' && (
        <Card className="p-6 border-green-500/50 bg-green-500/5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-green-400 text-lg">Assinatura Ativa</h3>
              <p className="text-sm text-muted-foreground">
                Sua assinatura está ativa e o acesso ao TorcidaClub® está liberado.
              </p>
              {data?.assinatura_validade && (() => {
                const diasRestantes = Math.round(
                  (new Date(data.assinatura_validade!).getTime() - Date.now()) / 86_400_000
                )
                return (
                  <>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Válida até: </span>
                      <span className="font-medium">{formatValidade(data.assinatura_validade)}</span>
                    </p>
                    <p className={`text-sm font-medium ${diasRestantes <= 7 ? 'text-red-400' : diasRestantes <= 30 ? 'text-orange-400' : 'text-green-400'}`}>
                      Restam {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
                    </p>
                  </>
                )
              })()}
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/60"
                  onClick={handleCancelarAssinatura}
                  disabled={cancelando}
                >
                  {cancelando ? 'Cancelando...' : 'Cancelar Assinatura'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Status: PENDENTE com QR Code PIX automático ───────────────────── */}
      {status === 'pendente' && mostrarQrCode && (
        <Card className="p-6 border-yellow-500/50 bg-yellow-500/5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <h3 className="font-semibold text-yellow-400 text-lg">PIX Automático</h3>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR code com o app do seu banco para autorizar o débito automático mensal.
                  Após a autorização, sua assinatura será ativada automaticamente.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                {qrCodeSrc ? (
                  <Image
                    src={qrCodeSrc}
                    alt="QR Code PIX Automático"
                    className="w-full max-w-[220px] rounded-lg border border-muted/50 bg-white p-2"
                    width={220}
                    height={220}
                    style={{ height: 'auto' }}
                  />
                ) : (
                  <div className="h-[160px] w-[160px] sm:h-[220px] sm:w-[220px] rounded-lg border border-muted/50 bg-muted/10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                )}

                <div className="w-full space-y-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleCopiarPix}
                  >
                    {copiado ? (
                      <><Check className="h-4 w-4 text-green-500" /> Copiado!</>
                    ) : (
                      <><Copy className="h-4 w-4" /> Copiar código PIX</>
                    )}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={handleVerificar}
                      disabled={verifying}
                    >
                      <RefreshCw className={`h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
                      {verifying ? 'Verificando...' : 'Verificar autorização'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={handleMudarMetodo}
                    >
                      Mudar método
                    </Button>
                  </div>
                </div>

                {pollingAtivo && (
                  <p className="text-xs text-muted-foreground text-center flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    Aguardando autorização...
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Status: PENDENTE com link Débito/Crédito ──────────────────────── */}
      {status === 'pendente' && mostrarInvoice && (
        <Card className="p-6 border-yellow-500/50 bg-yellow-500/5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="space-y-1">
                <h3 className="font-semibold text-yellow-400 text-lg">Pagamento Pendente</h3>
                <p className="text-sm text-muted-foreground">
                  Sua cobrança foi gerada. Clique em &quot;Pagar Agora&quot; para concluir o pagamento.
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

      {/* ── Checkout: Selector de método (pendente sem cobrança ou vencida) ── */}
      {mostrarCheckout && (
        <Card className="overflow-hidden border-muted/50">
          {/* Banner TorPIX */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg leading-none">TorPIX</p>
              <p className="text-green-100 text-xs mt-0.5">Pague sua assinatura via PIX</p>
            </div>
            <button
              type="button"
              onClick={handleGerarPixAutomatico}
              disabled={gerando}
              className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-60"
            >
              {gerando ? 'Gerando...' : 'Pagar com PIX'}
            </button>
          </div>
          <div className="p-6">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                status === 'vencida'
                  ? 'bg-red-500/10'
                  : 'bg-yellow-500/10'
              }`}>
                {status === 'vencida'
                  ? <XCircle className="h-6 w-6 text-red-500" />
                  : <Clock className="h-6 w-6 text-yellow-500" />
                }
              </div>
              <div className="space-y-1">
                <h3 className={`font-semibold text-lg ${
                  status === 'vencida' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {status === 'vencida' ? 'Assinatura Vencida' : 'Ativar Assinatura'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {status === 'vencida'
                    ? 'Renove sua assinatura para continuar usando o TorcidaClub®.'
                    : 'Escolha como pagar sua assinatura para liberar o acesso completo.'
                  }
                </p>
              </div>
            </div>

            {/* Seletor de modalidade */}
            <div>
              <p className="text-sm font-medium mb-3">Escolha o método de pagamento:</p>
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
            </div>

            {/* Descrição da modalidade selecionada */}
            {modalidadeSelecionada === 'pix_automatico' && (
              <div className="text-sm text-muted-foreground bg-muted/10 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">⚡ PIX Automático</p>
                <p>Autorize um débito automático mensal via PIX. Você escaneia o QR code uma vez
                e as cobranças futuras são realizadas automaticamente pelo seu banco.</p>
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

            {/* Botão de ação */}
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
                {gerando
                  ? 'Gerando...'
                  : modalidadeSelecionada === 'pix_automatico'
                    ? 'Gerar QR Code PIX'
                    : 'Gerar link de pagamento'
                }
              </Button>
            )}
          </div>
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
  )
}
