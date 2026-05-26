'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, FileImage, Loader2, Eye, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'

export interface CompraIngresso {
  id: string
  evento_id: string
  socio_id: string
  dependente_id: string | null
  tipo_ingresso: 'socio' | 'dependente' | 'adicional'
  valor: number
  comprovante_url: string | null
  status: 'pendente' | 'comprovante_enviado' | 'aprovado' | 'recusado' | 'usado'
  codigo_validacao: string | null
  aprovado_por: string | null
  motivo_recusa: string | null
  nome_adicional: string | null
  cpf_adicional: string | null
  created_at: string
  socios?: {
    id: string
    nome_completo: string
    apelido: string | null
    cpf: string
    whatsapp: string | null
  } | null
  eventos?: {
    id: string
    nome: string
    data_hora: string
    torcida_id?: string
  } | null
}

interface CompraIngressoGroup extends CompraIngresso {
  ids: string[]
  quantidade: number
  valorTotal: number
  ingressosDoLote: CompraIngresso[]
}

const STATUS_BADGE: Record<string, string> = {
  aprovado:            'bg-green-100 text-green-700',
  comprovante_enviado: 'bg-yellow-100 text-yellow-700',
  recusado:            'bg-red-100 text-red-700',
  pendente:            'bg-blue-100 text-blue-700',
  usado:               'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<string, string> = {
  aprovado:            'Aprovado',
  comprovante_enviado: 'Aguardando',
  recusado:            'Recusado',
  pendente:            'Pendente',
  usado:               'Usado',
}

interface IngressoCardProps {
  ingressoGroup: CompraIngressoGroup
  showActions?: boolean
  onRefresh?: () => void
  onComprovanteClick?: () => void
  onVisualizar?: () => void
}

export function IngressoCard({ ingressoGroup, showActions = false, onRefresh, onComprovanteClick, onVisualizar }: IngressoCardProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const socioNome = ingressoGroup.socios?.nome_completo || ingressoGroup.socios?.apelido || ingressoGroup.nome_adicional || 'Sócio'
  const eventoNome = ingressoGroup.eventos?.nome || 'Evento'
  const valor = `R$ ${ingressoGroup.valorTotal.toFixed(2).replace('.', ',')}` // Valor total somado do lote
  const dataEvento = ingressoGroup.eventos?.data_hora
    ? new Date(ingressoGroup.eventos.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  const handleApprove = async () => {
    try {
      setIsApproving(true)
      const res = await fetch(`/api/ingressos/${ingressoGroup.id}/aprovar`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aprovar ingresso')
      }
      toast.success('Ingresso aprovado!')
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar ingresso')
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
      const res = await fetch(`/api/ingressos/${ingressoGroup.id}/recusar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: rejectReason }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao recusar ingresso')
      }
      toast.success('Ingresso recusado.')
      setShowRejectModal(false)
      setRejectReason('')
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao recusar ingresso')
    } finally {
      setIsRejecting(false)
    }
  }

  const podeAgir = showActions && ingressoGroup.status === 'comprovante_enviado'
  const comprovanteUrl = ingressoGroup.comprovante_url
  const temComprovante = comprovanteUrl || ingressoGroup.status === 'comprovante_enviado'

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="truncate">
            <p className="text-sm font-semibold leading-tight truncate flex items-center gap-1.5">
              {socioNome}
              {ingressoGroup.quantidade > 1 && (
                <span className="inline-flex items-center gap-0.5 text-xs bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded">
                  <Users className="h-3 w-3" /> x{ingressoGroup.quantidade}
                </span>
              )}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[ingressoGroup.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABEL[ingressoGroup.status] ?? ingressoGroup.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {eventoNome}{dataEvento ? ` · ${dataEvento}` : ''} · {valor}
        </p>
        {ingressoGroup.quantidade > 1 && (
          <div className="mt-2 pt-1.5 border-t border-dashed border-muted flex flex-wrap gap-1">
            {ingressoGroup.ingressosDoLote.map((i) => (
              <span key={i.id} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                {i.tipo_ingresso === 'socio' ? 'Titular' : i.nome_adicional || 'Dependente'}
              </span>
            ))}
          </div>
        )}
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

      {ingressoGroup.motivo_recusa && (
        <div className="px-4 py-2 border-b">
          <p className="text-xs text-red-500 font-medium">Motivo da recusa:</p>
          <p className="text-xs text-red-400 mt-0.5">{ingressoGroup.motivo_recusa}</p>
        </div>
      )}

      {/* Action row */}
      <div className="px-4 py-2 flex items-center justify-between gap-2">
        <div>
          {onVisualizar && (
            <Button variant="ghost" size="sm" onClick={onVisualizar}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
              <Eye className="h-3.5 w-3.5 mr-1" />
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
        title="Recusar Ingresso"
      >
        <div className="space-y-4">
          <div className="bg-warning-bg border border-warning rounded-lg p-3">
            <p className="text-sm text-warning-dark">
              O sócio será notificado sobre a recusa do comprovante.
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
