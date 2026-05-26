'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Zap,
  Clock,
  Ticket,
  Receipt,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Pagamento } from '@/types/pagamento'
import type { CompraIngresso } from '@/components/pagamentos/ingresso-card'

export type VisualizarItem =
  | (Pagamento & { _tipo: 'mensalidade' })
  | (CompraIngresso & { _tipo: 'ingresso' })

interface VisualizarModalProps {
  items: VisualizarItem[]
  open: boolean
  onClose: () => void
  onRefresh: () => void
  initialIndex?: number
}

function getStatusAtual(item: VisualizarItem): string {
  return item.status
}

function getNome(item: VisualizarItem) {
  return item.socios?.nome_completo || item.socios?.apelido ||
    (item._tipo === 'ingresso' ? item.nome_adicional : null) ||
    'Sócio'
}

function getComprovanteUrl(item: VisualizarItem): string | null {
  return item.comprovante_url ?? null
}

function getMotivoRecusa(item: VisualizarItem): string | null {
  if (item._tipo === 'mensalidade') return item.motivo_recusa ?? null
  return item.motivo_recusa ?? null
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  comprovante_enviado: 'Aguardando aprovação',
  confirmado: 'Confirmado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  perdoado: 'Perdoado',
  usado: 'Usado',
}

const STATUS_COLOR: Record<string, string> = {
  pendente: 'bg-blue-100 text-blue-700',
  comprovante_enviado: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-green-100 text-green-700',
  aprovado: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
  perdoado: 'bg-purple-100 text-purple-700',
  usado: 'bg-gray-100 text-gray-500',
}

export function VisualizarModal({ items, open, onClose, onRefresh, initialIndex = 0 }: VisualizarModalProps) {
  const [indice, setIndice] = useState(initialIndex)
  const [aprovando, setAprovando] = useState(false)
  const [reprovando, setReprovando] = useState(false)
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  const [motivo, setMotivo] = useState('')

  // Estado local para rastrear status após ações (sem fechar o modal)
  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({})

  useEffect(() => {
    setIndice(Math.min(initialIndex, Math.max(0, items.length - 1)))
    setStatusOverride({})
    setMostrarMotivo(false)
    setMotivo('')
  }, [initialIndex, items.length, open])

  const total = items.length
  const atual = items[indice] ?? null
  if (!atual) return null

  const statusAtual = statusOverride[atual.id] ?? getStatusAtual(atual)
  const podeAgir = statusAtual === 'comprovante_enviado'
  const aguardandoRevisao = items.filter(
    (i) => (statusOverride[i.id] ?? i.status) === 'comprovante_enviado'
  ).length

  const handleAprovar = async () => {
    if (!atual || !podeAgir) return
    setAprovando(true)
    try {
      const endpoint =
        atual._tipo === 'mensalidade'
          ? `/api/pagamentos/${atual.id}/aprovar`
          : `/api/ingressos/${atual.id}/aprovar`

      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aprovar')
      }
      toast.success(atual._tipo === 'mensalidade' ? 'Pagamento aprovado!' : 'Ingresso aprovado!')
      setStatusOverride((prev) => ({
        ...prev,
        [atual.id]: atual._tipo === 'mensalidade' ? 'confirmado' : 'aprovado',
      }))
      onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar')
    } finally {
      setAprovando(false)
    }
  }

  const handleReprovar = async () => {
    if (!atual || !motivo.trim()) {
      toast.error('Informe o motivo da recusa')
      return
    }
    setReprovando(true)
    try {
      const endpoint =
        atual._tipo === 'mensalidade'
          ? `/api/pagamentos/${atual.id}/recusar`
          : `/api/ingressos/${atual.id}/recusar`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao recusar')
      }
      toast.success('Recusado. Sócio notificado.')
      setStatusOverride((prev) => ({ ...prev, [atual.id]: 'recusado' }))
      setMostrarMotivo(false)
      setMotivo('')
      onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao recusar')
    } finally {
      setReprovando(false)
    }
  }

  const comprovanteUrl = getComprovanteUrl(atual)
  const socioNome = getNome(atual)
  const motiRecusa = getMotivoRecusa(atual)

  // Detalhes específicos por tipo
  const detalhe1 =
    atual._tipo === 'mensalidade'
      ? { label: 'Referência', valor: formatMes(atual.referencia_mes) }
      : { label: 'Evento', valor: atual.eventos?.nome ?? 'Evento' }

  const detalhe2 =
    atual._tipo === 'mensalidade'
      ? { label: 'Tipo', valor: atual.tipos_mensalidade?.nome ?? 'Mensalidade' }
      : { label: 'Data do evento', valor: atual.eventos?.data_hora ? formatData(atual.eventos.data_hora) : '—' }

  const valor =
    atual._tipo === 'mensalidade'
      ? `R$ ${atual.valor_original.toFixed(2).replace('.', ',')}`
      : `R$ ${atual.valor.toFixed(2).replace('.', ',')}`

  const dataVenc =
    atual._tipo === 'mensalidade' && atual.data_vencimento
      ? formatData(atual.data_vencimento)
      : null

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) { onRefresh(); onClose() }
      }}
    >
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header TorPIX */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="font-bold">
                Tor<span className="text-green-500">PIX</span>
              </span>
              <span className="text-muted-foreground text-sm font-normal ml-1">
                {atual._tipo === 'ingresso' ? 'Ingressos' : 'Comprovantes'}
              </span>
            </div>
            {/* Tipo pill */}
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {atual._tipo === 'ingresso'
                ? <><Ticket className="h-3 w-3" /> Ingresso</>
                : <><Receipt className="h-3 w-3" /> Mensalidade</>
              }
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Nome do sócio + status */}
        <div className="mx-5 mt-3 rounded-lg bg-muted px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate">{socioNome.toUpperCase()}</span>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[statusAtual] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABEL[statusAtual] ?? statusAtual}
          </span>
        </div>

        {/* Detalhes rápidos */}
        <div className="mx-5 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between col-span-1">
            <span>{detalhe1.label}:</span>
            <span className="font-medium text-foreground truncate ml-1">{detalhe1.valor}</span>
          </div>
          <div className="flex justify-between col-span-1">
            <span>Valor:</span>
            <span className="font-medium text-foreground">{valor}</span>
          </div>
          <div className="flex justify-between col-span-1">
            <span>{detalhe2.label}:</span>
            <span className="font-medium text-foreground truncate ml-1">{detalhe2.valor}</span>
          </div>
          {dataVenc && (
            <div className="flex justify-between col-span-1">
              <span>Vencimento:</span>
              <span className="font-medium text-foreground">{dataVenc}</span>
            </div>
          )}
        </div>

        {/* Comprovante com navegação sobreposta */}
        <div className="relative px-5 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setIndice(Math.max(0, indice - 1)); setMostrarMotivo(false); setMotivo('') }}
            disabled={indice === 0 || aprovando || reprovando}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/25 text-white hover:bg-black/45 disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {comprovanteUrl ? (
            <div className="flex flex-col items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={comprovanteUrl}
                alt="Comprovante"
                className="max-h-56 w-full object-contain rounded-lg border bg-muted/20"
              />
              <a
                href={comprovanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir em nova aba
              </a>
            </div>
          ) : (
            <div className="flex h-36 flex-col items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground text-sm gap-2">
              {statusAtual === 'pendente' ? (
                <>
                  <Clock className="h-8 w-8 opacity-30" />
                  <span>Comprovante ainda não enviado</span>
                </>
              ) : (
                <>
                  <Receipt className="h-8 w-8 opacity-30" />
                  <span>Comprovante não disponível</span>
                </>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setIndice(Math.min(total - 1, indice + 1)); setMostrarMotivo(false); setMotivo('') }}
            disabled={indice === total - 1 || aprovando || reprovando}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/25 text-white hover:bg-black/45 disabled:opacity-0 transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Contador de progresso */}
        <div className="text-center -mt-1 mb-1 space-y-0.5">
          <p className="text-xs text-muted-foreground">
            {indice + 1} de {total}
          </p>
          {aguardandoRevisao > 0 && (
            <p className="text-xs font-medium text-yellow-600">
              {aguardandoRevisao} {aguardandoRevisao === 1 ? 'comprovante aguarda' : 'comprovantes aguardam'} revisão
            </p>
          )}
        </div>

        {/* Motivo de recusa exibido (read-only) */}
        {statusAtual === 'recusado' && motiRecusa && (
          <div className="mx-5 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs font-medium text-red-700 mb-0.5">Motivo da recusa:</p>
            <p className="text-xs text-red-600">{motiRecusa}</p>
          </div>
        )}

        {/* Campo de motivo de recusa (ao recusar) */}
        {mostrarMotivo && (
          <div className="px-5 space-y-2">
            <p className="text-sm font-medium">
              Motivo da recusa <span className="text-red-500">*</span>
            </p>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da recusa para notificar o sócio..."
              rows={3}
            />
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-center gap-3 px-5 pb-5 pt-2">
          {podeAgir ? (
            mostrarMotivo ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setMostrarMotivo(false); setMotivo('') }}
                  disabled={reprovando}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleReprovar}
                  disabled={reprovando || !motivo.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {reprovando
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    : <XCircle className="h-4 w-4 mr-1" />}
                  Confirmar Recusa
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMostrarMotivo(true)}
                  disabled={aprovando}
                  className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Recusar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAprovar}
                  disabled={aprovando}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {aprovando
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    : <CheckCircle className="h-4 w-4 mr-1" />}
                  Aprovar
                </Button>
              </>
            )
          ) : (
            <p className="text-xs text-muted-foreground py-1">
              {statusAtual === 'confirmado' || statusAtual === 'aprovado'
                ? 'Pagamento já confirmado.'
                : statusAtual === 'recusado'
                ? 'Comprovante recusado — sócio pode reenviar.'
                : statusAtual === 'perdoado'
                ? 'Dívida perdoada.'
                : 'Nenhuma ação disponível.'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatMes(ref: string) {
  if (ref.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = ref.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }
  return new Date(ref).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
