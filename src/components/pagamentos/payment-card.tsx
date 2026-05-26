'use client'

import { useState } from 'react'
import { Pagamento } from '@/types/pagamento'
import { PaymentStatusBadge } from './payment-status-badge'
import { FileImage, Loader2, MessageCircle, XCircle, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

interface PaymentCardProps {
  pagamento: Pagamento
  showActions?: boolean
  onRefresh?: () => void
  chavePix?: string | null
  torcidaNome?: string
  torcidaSlug?: string
  onComprovanteClick?: () => void
  onVisualizar?: () => void
}

export function PaymentCard({ pagamento, showActions = false, onRefresh, chavePix, torcidaNome, torcidaSlug, onComprovanteClick, onVisualizar }: PaymentCardProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = async () => {
    try {
      setIsApproving(true)
      const response = await fetch(`/api/pagamentos/${pagamento.id}/aprovar`, { method: 'POST' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao aprovar pagamento')
      }
      toast.success('Pagamento aprovado com sucesso!')
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar pagamento')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Informe o motivo da recusa')
      return
    }
    try {
      setIsRejecting(true)
      const response = await fetch(`/api/pagamentos/${pagamento.id}/recusar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: rejectReason }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao recusar pagamento')
      }
      toast.success('Pagamento recusado. Sócio notificado.')
      setShowRejectModal(false)
      setRejectReason('')
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao recusar pagamento')
    } finally {
      setIsRejecting(false)
    }
  }

  const formatReferenciaMes = (ref: string) => {
    if (ref.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = ref.split('-')
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    }
    return new Date(ref).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const socioNome = pagamento.socios?.nome_completo || pagamento.socios?.apelido || 'Sócio'
  const referenciaMes = formatReferenciaMes(pagamento.referencia_mes)
  const valor = `R$ ${pagamento.valor_original.toFixed(2).replace('.', ',')}`

  const handleWhatsAppCobranca = () => {
    const whatsapp = pagamento.socios?.whatsapp?.replace(/\D/g, '')
    if (!whatsapp) return
    const primeiroNome = (pagamento.socios?.nome_completo || 'sócio').split(' ')[0]
    const meses = pagamento.socios?.meses_pendentes ?? 1
    const valorNum = pagamento.valor_original
    const total = (meses * valorNum).toFixed(2).replace('.', ',')
    const valorFormatado = valorNum.toFixed(2).replace('.', ',')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const slug = torcidaSlug ? `${siteUrl}/torcida/${torcidaSlug}` : siteUrl
    const mensagem = [
      `Olá, ${primeiroNome}!👋🏽 Somos da ${torcidaNome || 'nossa torcida'}!!🔥`,
      `Vimos que você ainda não pagou ${meses > 1 ? `${meses} mensalidades de R$ ${valorFormatado} (Total: R$ ${total})` : `a mensalidade de R$ ${valorFormatado}`}.`,
      `Aconteceu alguma coisa? Posso te ajudar com o pagamento!`,
      chavePix ? `Nossa CHAVE PIX é: ${chavePix}` : '',
      slug ? `Após efetuar o pagamento, ENCAMINHE O COMPROVANTE PELO SITE DA TORCIDA: ${slug}` : '',
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/55${whatsapp}?text=${encodeURIComponent(mensagem)}`, '_blank')
  }

  const mostrarBotaoWA = pagamento.status === 'pendente' && pagamento.socios?.whatsapp
  const podeAgir = showActions && pagamento.status === 'comprovante_enviado'
  const comprovanteUrl = pagamento.comprovante_url
  const temComprovante = comprovanteUrl || pagamento.status === 'comprovante_enviado' || pagamento.status === 'recusado'

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight truncate">{socioNome}</p>
          <PaymentStatusBadge status={pagamento.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{referenciaMes} · {valor}</p>
      </div>

      {/* Comprovante thumbnail */}
      {temComprovante && (
        <div className="px-4 py-2 border-b">
          {comprovanteUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comprovanteUrl}
              alt="Comprovante"
              onClick={onVisualizar ?? onComprovanteClick}
              className="w-full max-h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
            />
          ) : (
            <button
              onClick={onVisualizar ?? onComprovanteClick}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs border rounded text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <FileImage className="h-3.5 w-3.5" />
              Ver comprovante
            </button>
          )}
        </div>
      )}

      {pagamento.motivo_recusa && (
        <div className="px-4 py-2 border-b">
          <p className="text-xs text-red-500 font-medium">Motivo da recusa:</p>
          <p className="text-xs text-red-400 mt-0.5">{pagamento.motivo_recusa}</p>
        </div>
      )}

      {/* Action row */}
      <div className="px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {mostrarBotaoWA && (
            <Button variant="ghost" size="icon" onClick={handleWhatsAppCobranca}
              title="Enviar cobrança pelo WhatsApp"
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50">
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          {onVisualizar && (
            <Button variant="ghost" size="sm" onClick={onVisualizar}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
              Visualizar
            </Button>
          )}
        </div>
        {podeAgir && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm"
              onClick={() => setShowRejectModal(true)}
              disabled={isApproving || isRejecting}
              className="h-7 px-2 text-xs border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600">
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Recusar
            </Button>
            <Button size="sm" onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white">
              {isApproving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <><CheckCircle className="h-3.5 w-3.5 mr-1" />Aprovar</>}
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectReason('') }}
        title="Recusar Pagamento"
      >
        <div className="space-y-4">
          <div className="bg-warning-bg border border-warning rounded-lg p-3">
            <p className="text-sm text-warning-dark">
              O sócio será notificado via WhatsApp e email sobre a recusa.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Motivo da recusa <span className="text-error">*</span>
            </label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Informe o motivo da recusa do comprovante..."
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowRejectModal(false); setRejectReason('') }} disabled={isRejecting}>
              Cancelar
            </Button>
            <Button className="btn-error" onClick={handleReject} disabled={isRejecting || !rejectReason.trim()}>
              {isRejecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recusando...</> : 'Confirmar Recusa'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
