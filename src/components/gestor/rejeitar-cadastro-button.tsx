'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { XCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface RejeitarCadastroButtonProps {
  socioId: string
}

export function RejeitarCadastroButton({ socioId }: RejeitarCadastroButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [motivo, setMotivo] = useState('')

  const handleRejeitar = async () => {
    if (!motivo.trim()) {
      toast.error('Por favor, informe o motivo da rejeição')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/cadastro/${socioId}/rejeitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao rejeitar cadastro')
      }

      toast.success('Cadastro rejeitado')
      setOpen(false)
      router.push('/gestor/cadastros')
    } catch (error) {
      console.error('Erro ao rejeitar:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao rejeitar cadastro'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="border-red-600 text-red-600 hover:bg-red-50">
          <XCircle className="w-5 h-5 mr-2" />
          Rejeitar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar Cadastro</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição. O candidato receberá um email com esta justificativa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="motivo">Motivo da Rejeição *</Label>
          <Textarea
            id="motivo"
            placeholder="Ex: Documento de identificação ilegível, CPF inválido, etc."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Seja claro e objetivo para que o candidato possa corrigir e tentar novamente.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRejeitar}
            disabled={loading || !motivo.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rejeitando...
              </>
            ) : (
              'Rejeitar Cadastro'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
