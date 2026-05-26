'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Ban, CreditCard, Phone, AlertTriangle, Zap } from 'lucide-react'
import Link from 'next/link'
import { TorpixModal } from '@/components/socio/torpix-modal'

interface PendingPayment {
  id: string
  valor_original: number
  data_vencimento: string
  status: string
}

export default function BloqueadoPage() {
  const { socioData, dependenteData, loading, isSocioTitular, isDependente, torcidaId } = useAuth()
  const router = useRouter()
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [totalPendente, setTotalPendente] = useState(0)
  const [torpixOpen, setTorpixOpen] = useState(false)
  const [torcidaInfo, setTorcidaInfo] = useState<{
    nome: string | null
    telefone_gestor: string | null
    chave_pix: string | null
  } | null>(null)

  useEffect(() => {
    if (loading) return

    if (isSocioTitular && socioData) {
      if (socioData.status !== 'bloqueado') {
        router.replace('/painel')
        return
      }

      fetch('/api/socio/mensalidade')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (!data) return
          const pending = (data.pagamentos ?? []).filter(
            (p: PendingPayment) => p.status === 'pendente' || p.status === 'comprovante_enviado'
          )
          setPendingPayments(pending)
          setTotalPendente(pending.reduce((sum: number, p: PendingPayment) => sum + (p.valor_original || 0), 0))
          setTorcidaInfo({
            nome: data.torcidaNome ?? null,
            telefone_gestor: data.telefone_gestor ?? null,
            chave_pix: data.chavePix ?? null,
          })
        })
        .catch(console.error)
    }

    if (isDependente && torcidaId) {
      fetch(`/api/torcida/${torcidaId}/restricoes-idade`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (!data) return
          setTorcidaInfo({
            nome: null,
            telefone_gestor: data.telefone_gestor ?? null,
            chave_pix: null,
          })
        })
        .catch(console.error)
    }
  }, [loading, isSocioTitular, isDependente, socioData, torcidaId, router])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Card Principal */}
        <Card className="p-8 text-center border-red-200 dark:border-red-800">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
            Acesso Bloqueado
          </h1>

          <p className="text-muted-foreground mb-6">
            Olá, <span className="font-medium">{isDependente ? dependenteData?.nome_completo : socioData?.nome_completo}</span>.
            Seu acesso foi bloqueado devido a pagamentos pendentes.
          </p>

          {/* Valor Total */}
          {totalPendente > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Total em aberto</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalPendente)}
              </p>
            </div>
          )}

          {/* Lista de Pagamentos Pendentes */}
          {pendingPayments.length > 0 && (
            <div className="text-left mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Pagamentos Pendentes
              </h3>
              <div className="space-y-2">
                {pendingPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm"
                  >
                    <span className="text-muted-foreground">
                      Venc: {formatDate(payment.data_vencimento)}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(payment.valor_original)}
                    </span>
                  </div>
                ))}
                {pendingPayments.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    + {pendingPayments.length - 5} pagamentos
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chave PIX */}
          {torcidaInfo?.chave_pix && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Chave PIX para pagamento
              </p>
              <p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border break-all">
                {torcidaInfo.chave_pix}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Realize o pagamento e aguarde a confirmacao do gestor
              </p>
            </div>
          )}

          {/* Botoes de Pagamento */}
          {pendingPayments.length > 0 && torcidaInfo?.chave_pix && (
            <Button
              onClick={() => setTorpixOpen(true)}
              className="w-full mb-3 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Zap className="mr-2 h-4 w-4" />
              Pagar com TorPIX
            </Button>
          )}

          <Button asChild variant="outline" className="w-full mb-4" size="lg">
            <Link href="/mensalidade">
              <CreditCard className="mr-2 h-4 w-4" />
              Ver Mensalidades e Pagar
            </Link>
          </Button>

          <p className="text-xs text-muted-foreground">
            Apos a confirmacao do pagamento, seu acesso sera liberado automaticamente.
          </p>
        </Card>

        {/* TorPIX Modal */}
        {pendingPayments.length > 0 && (
          <TorpixModal
            open={torpixOpen}
            onOpenChange={setTorpixOpen}
            pagamentoId={pendingPayments[0].id}
            valor={pendingPayments[0].valor_original}
            chavePix={torcidaInfo?.chave_pix || null}
            tipo="mensalidade"
            descricao={`Mensalidade - Venc: ${formatDate(pendingPayments[0].data_vencimento)}`}
          />
        )}

        {/* Card de Contato */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Precisa de ajuda?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Entre em contato com a {torcidaInfo?.nome || 'sua torcida'} para regularizar sua situacao.
          </p>

          <div className="space-y-3">
            {torcidaInfo?.telefone_gestor && (
              <a
                href={`https://wa.me/55${torcidaInfo.telefone_gestor.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">WhatsApp - Gestor</p>
                  <p className="text-xs text-muted-foreground">{torcidaInfo.telefone_gestor}</p>
                </div>
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
