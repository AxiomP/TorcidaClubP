'use client'

import { useState } from 'react'
import { Pagamento } from '@/types/pagamento'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface FilaValidacaoProps {
  pagamentos: Pagamento[]
  open: boolean
  onClose: () => void
  onRefresh: () => void
  initialIndex?: number
}

export function FilaValidacao({ pagamentos, open, onClose, onRefresh, initialIndex = 0 }: FilaValidacaoProps) {
  const [indice, setIndice] = useState(initialIndex)
  const [aprovando, setAprovando] = useState(false)
  const [reprovando, setReprovando] = useState(false)
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  const [motivo, setMotivo] = useState('')

  // Fila local — remove itens conforme são processados
  const [fila, setFila] = useState<Pagamento[]>(pagamentos)

  const atual = fila[indice] ?? null
  const total = fila.length

  const avancar = (filaAtualizada: Pagamento[]) => {
    if (filaAtualizada.length === 0) {
      onRefresh()
      onClose()
      return
    }
    const novoIndice = Math.min(indice, filaAtualizada.length - 1)
    setIndice(novoIndice)
  }

  const removerAtual = () => {
    const novaFila = fila.filter((_, i) => i !== indice)
    setFila(novaFila)
    avancar(novaFila)
  }

  const handleAprovar = async () => {
    if (!atual) return
    setAprovando(true)
    try {
      const res = await fetch(`/api/pagamentos/${atual.id}/aprovar`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aprovar')
      }
      toast.success('Pagamento aprovado!')
      removerAtual()
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
      const res = await fetch(`/api/pagamentos/${atual.id}/recusar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao recusar')
      }
      toast.success('Pagamento recusado. Sócio notificado.')
      setMostrarMotivo(false)
      setMotivo('')
      removerAtual()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao recusar')
    } finally {
      setReprovando(false)
    }
  }

  if (!atual) return null

  const socioNome = atual.socios?.nome_completo || atual.socios?.apelido || 'Sócio'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onRefresh(); onClose() } }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header com branding TorPix */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="font-bold">
                Tor<span className="text-green-500">PIX</span>
              </span>
            </div>
            <span className="text-muted-foreground text-sm font-normal">Comprovantes</span>
          </DialogTitle>
        </DialogHeader>

        {/* Sub-header: nome do sócio */}
        <div className="mx-5 mt-3 rounded-lg bg-muted px-4 py-2 text-center text-sm font-medium text-foreground">
          Sócio-Torcedor: {socioNome.toUpperCase()}
        </div>

        {/* Comprovante com navegação lateral */}
        <div className="relative flex items-center gap-2 px-3 py-3">
          {/* Seta esquerda */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndice(Math.max(0, indice - 1))}
            disabled={indice === 0 || aprovando || reprovando}
            className="shrink-0 h-9 w-9 border-orange-400 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Imagem do comprovante */}
          <div className="flex-1">
            {atual.comprovante_url ? (
              <div className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={atual.comprovante_url}
                  alt="Comprovante"
                  className="max-h-64 w-full object-contain rounded-lg border bg-muted/20"
                />
                <a
                  href={atual.comprovante_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir em nova aba
                </a>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground text-sm">
                Comprovante não disponível
              </div>
            )}
          </div>

          {/* Seta direita */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndice(Math.min(total - 1, indice + 1))}
            disabled={indice === total - 1 || aprovando || reprovando}
            className="shrink-0 h-9 w-9 border-orange-400 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Badge de progresso */}
        <p className="text-center text-xs text-muted-foreground -mt-1 mb-1">
          {indice + 1} de {total}
        </p>

        {/* Motivo de recusa (inline) */}
        {mostrarMotivo && (
          <div className="px-5 space-y-2">
            <p className="text-sm font-medium">Motivo da recusa <span className="text-red-500">*</span></p>
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
          {mostrarMotivo ? (
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
                {reprovando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
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
                Revisar
              </Button>
              <Button
                size="sm"
                onClick={handleAprovar}
                disabled={aprovando}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {aprovando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Aprovar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
