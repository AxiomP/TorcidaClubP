'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TorpixModal } from '@/components/socio/torpix-modal'
import { useRouter } from 'next/navigation'
import { Loader2, Users, CheckCircle2, Zap, Clock, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface PagamentoPendente {
  id: string
  valor_original: number
  referencia_mes: string
  data_vencimento: string
  status: string
  motivo_recusa: string | null
}

interface TorcidaInfo {
  nome: string
  brasao_url: string | null
  cor_fundo: string | null
  chave_pix: string | null
}

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tornixOpen, setTornixOpen] = useState(false)
  const [pagamento, setPagamento] = useState<PagamentoPendente | null>(null)
  const [torcida, setTorcida] = useState<TorcidaInfo | null>(null)
  const [socioId, setSocioId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pendente' | 'comprovante_enviado' | 'recusado' | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/socio/me')

        if (res.status === 401) {
          router.push('/login')
          return
        }

        if (!res.ok) {
          console.error('Erro ao buscar dados do sócio:', res.status)
          setLoading(false)
          return
        }

        const { socio, torcida: torcidaData, pagamento: pagData } = await res.json()

        setSocioId(socio.id)
        setTorcida(torcidaData as TorcidaInfo | null)

        if (pagData) {
          const pag = pagData as PagamentoPendente
          setPagamento(pag)
          setPaymentStatus(pag.status as 'pendente' | 'comprovante_enviado' | 'recusado')
          if (pag.status === 'pendente') {
            setTornixOpen(true)
          }
        } else {
          // Fallback: gerar 1ª mensalidade sob demanda
          try {
            const genRes = await fetch('/api/socios/gerar-mensalidade-inicial', { method: 'POST' })
            if (genRes.ok) {
              const { pagamento: novoPagamento } = await genRes.json()
              if (novoPagamento) {
                const pag = { ...novoPagamento, status: 'pendente', motivo_recusa: null } as PagamentoPendente
                setPagamento(pag)
                setPaymentStatus('pendente')
                setTornixOpen(true)
              }
            }
          } catch (fallbackErr) {
            console.error('Erro ao gerar mensalidade inicial:', fallbackErr)
          }
        }
      } catch (err) {
        console.error('Erro no primeiro acesso:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  // Polling para detectar aprovação pelo gestor
  useEffect(() => {
    if (!socioId || paymentStatus !== 'comprovante_enviado') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/socio/me')
        if (res.ok) {
          const { socio: s } = await res.json()
          if (s?.primeiro_acesso_feito === true) {
            clearInterval(interval)
            router.push('/painel')
          }
        }
      } catch {
        // silencioso — próximo tick vai tentar novamente
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [socioId, paymentStatus, router])

  const handleComprovanteEnviado = () => {
    setPaymentStatus('comprovante_enviado')
    setTornixOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header com Torcida */}
        {torcida && (
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: torcida.cor_fundo || '#1a1a2e' }}
              >
                {torcida.brasao_url ? (
                  <Image
                    src={torcida.brasao_url}
                    alt={torcida.nome}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <Users className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bem-vindo à</p>
                <h2 className="text-xl font-bold">{torcida.nome}</h2>
              </div>
            </div>
          </Card>
        )}

        {/* Card Principal */}
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Cadastro Aprovado!</h1>
              <p className="text-muted-foreground">
                Seu cadastro foi aprovado. Para completar sua ativação, realize o pagamento da primeira mensalidade.
              </p>
            </div>
          </div>
        </Card>

        {/* Card de Pagamento — conteúdo varia por status */}
        {pagamento ? (
          <>
            {paymentStatus === 'pendente' && (
              <Card className="p-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-start gap-3 mb-4">
                  <Zap className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">Pagamento da 1ª Mensalidade</p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      Referência:{' '}
                      {new Date(pagamento.referencia_mes).toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                      {' '}— Valor:{' '}
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagamento.valor_original)}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setTornixOpen(true)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Pagar via TorPIX
                </Button>
              </Card>
            )}

            {paymentStatus === 'comprovante_enviado' && (
              <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Comprovante enviado!</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Aguardando aprovação do gestor. Você será redirecionado automaticamente assim que o pagamento for confirmado.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando status...
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {paymentStatus === 'recusado' && (
              <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-red-900 dark:text-red-100">Comprovante recusado</p>
                    {pagamento.motivo_recusa && (
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Motivo: {pagamento.motivo_recusa}
                      </p>
                    )}
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Por favor, envie um novo comprovante de pagamento.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => setTornixOpen(true)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Reenviar comprovante
                </Button>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              Nenhum pagamento pendente encontrado. Aguarde ou entre em contato com o gestor.
            </p>
          </Card>
        )}
      </div>

      {/* TorPIX Modal */}
      {pagamento && (
        <TorpixModal
          open={tornixOpen}
          onOpenChange={setTornixOpen}
          pagamentoId={pagamento.id}
          valor={pagamento.valor_original}
          chavePix={torcida?.chave_pix ?? null}
          tipo="mensalidade"
          descricao={`1ª Mensalidade — ${new Date(pagamento.referencia_mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
          onComprovanteEnviado={handleComprovanteEnviado}
        />
      )}
    </div>
  )
}
