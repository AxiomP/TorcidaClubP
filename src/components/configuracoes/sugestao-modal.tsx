'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  sugestaoCreateSchema,
  TIPOS_SUGESTAO,
  TIPOS_SUGESTAO_LABELS,
  type SugestaoData,
} from '@/lib/validations/sugestao-schema'
import dynamic from 'next/dynamic'

const CheckCircle = dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false })

interface SugestaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  torcidaId: string
}

export function SugestaoModal({ open, onOpenChange, torcidaId }: SugestaoModalProps) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SugestaoData>({
    resolver: zodResolver(sugestaoCreateSchema),
    defaultValues: {
      tipo: 'melhoria',
      titulo: '',
      descricao: '',
    },
  })

  function handleClose() {
    if (!saving) {
      reset()
      setSuccess(false)
      setError(null)
      onOpenChange(false)
    }
  }

  async function onSubmit(data: SugestaoData) {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/torcida/${torcidaId}/sugestoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao enviar sugestão')
      }

      setSuccess(true)
      reset()

      // Fechar após 2 segundos
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (err) {
      console.error('Erro ao enviar sugestão:', err)
      setError(err instanceof Error ? err.message : 'Erro ao enviar sugestão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
          <DialogDescription>
            Ajude-nos a melhorar a plataforma! Envie suas sugestões, reporte problemas ou tire dúvidas.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Obrigado pelo seu feedback!</h3>
            <p className="text-muted-foreground">
              Sua sugestão foi enviada com sucesso. Analisaremos em breve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SUGESTAO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {TIPOS_SUGESTAO_LABELS[tipo]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipo && (
                <p className="text-sm text-red-400">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                {...register('titulo')}
                placeholder="Resumo da sua sugestão"
                disabled={saving}
              />
              {errors.titulo && (
                <p className="text-sm text-red-400">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descreva detalhadamente sua sugestão, problema ou dúvida..."
                className="min-h-[150px]"
                disabled={saving}
              />
              {errors.descricao && (
                <p className="text-sm text-red-400">{errors.descricao.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Mínimo 20 caracteres
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Enviando...' : 'Enviar Sugestão'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
