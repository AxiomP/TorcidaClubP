'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PaymentStatusBadge } from '@/components/pagamentos/payment-status-badge'
import { Modal } from '@/components/ui/modal'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Download,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface PagamentoDetalhe {
  id: string
  referencia_mes: string
  valor_original: number
  data_vencimento: string
  data_pagamento: string | null
  status: string
  comprovante_url: string | null
  observacao: string | null
  motivo_recusa: string | null
  socios: {
    id: string
    nome_completo: string
    apelido: string | null
    whatsapp: string
  } | null
}

export default function DetalhesPagamentoPage() {
  const params = useParams()
  const router = useRouter()
  const pagamentoId = params.id as string

  const [pagamento, setPagamento] = useState<PagamentoDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalRecusaOpen, setModalRecusaOpen] = useState(false)
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    async function fetchPagamento() {
      setLoading(true)
      try {
        const res = await fetch(`/api/pagamentos/${pagamentoId}`)
        if (!res.ok) throw new Error('Erro ao carregar pagamento')
        const { pagamento: data } = await res.json()
        setPagamento(data as PagamentoDetalhe)
      } catch (error) {
        console.error('Erro ao carregar pagamento:', error)
        toast.error('Erro ao carregar dados do pagamento')
      } finally {
        setLoading(false)
      }
    }

    if (pagamentoId) fetchPagamento()
  }, [pagamentoId])

  const handleAprovar = async () => {
    setProcessando(true)
    try {
      const res = await fetch(`/api/pagamentos/${pagamentoId}/aprovar`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aprovar')
      }
      toast.success('Pagamento aprovado com sucesso!')
      router.push('/gestor/pagamentos')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar pagamento')
    } finally {
      setProcessando(false)
    }
  }

  const handleRecusar = async () => {
    if (!motivoRecusa.trim()) {
      toast.error('Por favor, informe o motivo da recusa')
      return
    }

    setProcessando(true)
    try {
      const res = await fetch(`/api/pagamentos/${pagamentoId}/recusar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoRecusa }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao recusar')
      }
      toast.success('Pagamento recusado. O sócio será notificado.')
      router.push('/gestor/pagamentos')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao recusar pagamento')
    } finally {
      setProcessando(false)
      setModalRecusaOpen(false)
    }
  }

  const handleDownloadComprovante = async () => {
    if (!pagamento?.comprovante_url) return
    try {
      const res = await fetch(pagamento.comprovante_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comprovante-${pagamentoId}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erro ao baixar comprovante')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-72" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!pagamento) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Pagamento não encontrado</h2>
        <Button asChild variant="outline">
          <Link href="/gestor/pagamentos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Pagamentos
          </Link>
        </Button>
      </div>
    )
  }

  const referenciaMes = new Date(pagamento.referencia_mes).toLocaleDateString(
    'pt-BR',
    { month: 'long', year: 'numeric' }
  )
  const dataVencimento = new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR')
  const dataPagamento = pagamento.data_pagamento
    ? new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')
    : null

  const podeAprovarRecusar = pagamento.status === 'comprovante_enviado'
  const socioNome = pagamento.socios?.nome_completo ?? '-'
  const socioWhatsapp = pagamento.socios?.whatsapp ?? '-'
  const socioId = pagamento.socios?.id ?? ''

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/gestor/pagamentos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Pagamento</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie o pagamento do sócio
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informações do Pagamento */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Status */}
          <Card>
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Status do Pagamento</h2>
                <PaymentStatusBadge status={pagamento.status as 'pendente' | 'comprovante_enviado' | 'confirmado' | 'recusado' | 'perdoado'} />
              </div>
            </div>
            <div className="card-body">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Referência</p>
                    <p className="font-semibold capitalize">{referenciaMes}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Valor</p>
                    <p className="font-semibold currency">
                      R$ {pagamento.valor_original.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Vencimento</p>
                    <p className="font-semibold">{dataVencimento}</p>
                  </div>
                </div>
                {dataPagamento && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Data do Pagamento</p>
                      <p className="font-semibold">{dataPagamento}</p>
                    </div>
                  </div>
                )}
              </div>

              {pagamento.observacao && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Observação do Sócio</p>
                      <p className="mt-1">{pagamento.observacao}</p>
                    </div>
                  </div>
                </div>
              )}

              {pagamento.motivo_recusa && (
                <div className="mt-4 pt-4 border-t bg-error-bg p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-error mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-error">Motivo da Recusa</p>
                      <p className="mt-1 text-error-dark">{pagamento.motivo_recusa}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Comprovante */}
          {pagamento.comprovante_url && (
            <Card>
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Comprovante de Pagamento
                  </h2>
                  <Button variant="outline" size="sm" onClick={handleDownloadComprovante}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
              <div className="card-body">
                <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={pagamento.comprovante_url}
                    alt="Comprovante de pagamento"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Informações do Sócio e Ações */}
        <div className="space-y-6">
          {/* Informações do Sócio */}
          <Card>
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Sócio
              </h3>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-semibold">{socioNome}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm">{socioWhatsapp}</p>
              </div>
              {socioId && (
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href={`/gestor/cadastros/${socioId}`}>
                    Ver Ficha Completa
                  </Link>
                </Button>
              )}
            </div>
          </Card>

          {/* Ações */}
          {podeAprovarRecusar && (
            <Card>
              <div className="card-header">
                <h3 className="font-semibold">Ações</h3>
              </div>
              <div className="card-body space-y-3">
                <Button
                  className="w-full btn-success"
                  onClick={handleAprovar}
                  disabled={processando}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processando ? 'Processando...' : 'Aprovar Pagamento'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full btn-error"
                  onClick={() => setModalRecusaOpen(true)}
                  disabled={processando}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Recusar Pagamento
                </Button>
              </div>
            </Card>
          )}

          {/* Informação Adicional */}
          {!podeAprovarRecusar && (
            <div className="bg-info-bg border border-info p-4 rounded-lg">
              <p className="text-sm text-info-dark">
                {pagamento.status === 'confirmado'
                  ? 'Este pagamento já foi aprovado.'
                  : pagamento.status === 'recusado'
                  ? 'Este pagamento foi recusado.'
                  : pagamento.status === 'perdoado'
                  ? 'Esta dívida foi perdoada.'
                  : 'Este pagamento ainda não tem comprovante enviado.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Recusa */}
      <Modal
        isOpen={modalRecusaOpen}
        onClose={() => setModalRecusaOpen(false)}
        title="Recusar Pagamento"
      >
        <div className="modal-body">
          <div className="bg-warning-bg border border-warning p-4 rounded-lg mb-4">
            <p className="text-sm text-warning-dark">
              O sócio será notificado sobre a recusa via WhatsApp e email. Informe o motivo
              para que ele possa corrigir e reenviar o comprovante.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Motivo da Recusa *
            </label>
            <textarea
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              placeholder="Ex: Comprovante ilegível, valor incorreto, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-md resize-none"
              rows={4}
            />
          </div>
        </div>
        <div className="modal-footer">
          <Button
            variant="outline"
            onClick={() => setModalRecusaOpen(false)}
            disabled={processando}
          >
            Cancelar
          </Button>
          <Button
            className="btn-error"
            onClick={handleRecusar}
            disabled={processando}
          >
            {processando ? 'Recusando...' : 'Confirmar Recusa'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
