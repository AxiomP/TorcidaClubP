'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { beneficioCreateSchema, type BeneficioData } from '@/lib/validations/beneficio-schema'
import { Gift, Plus, Pencil, Trash2 } from 'lucide-react'

interface Beneficio {
  id: string
  titulo: string
  descricao: string
  icone: string | null
  ordem: number
  ativo: boolean
}

interface TabBeneficiosProps {
  torcidaId: string
  isActive?: boolean
}

const FETCH_TIMEOUT = 10000

export function TabBeneficios({ torcidaId, isActive = false }: TabBeneficiosProps) {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingBeneficio, setEditingBeneficio] = useState<Beneficio | null>(null)
  const [deletingBeneficio, setDeletingBeneficio] = useState<Beneficio | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BeneficioData>({
    resolver: zodResolver(beneficioCreateSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      icone: '',
      ordem: 0,
      ativo: true,
    },
  })

  useEffect(() => {
    if (isActive && !hasLoaded) {
      loadBeneficios()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, hasLoaded, torcidaId])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  async function loadBeneficios() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      setError(null)
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
      const response = await fetch(`/api/torcida/${torcidaId}/beneficios`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error('Erro ao carregar benefícios')
      const data = await response.json()
      setBeneficios(data)
      setHasLoaded(true)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Tempo esgotado ao carregar benefícios. Tente novamente.')
        return
      }
      console.error('Erro ao carregar benefícios:', err)
      setError('Erro ao carregar benefícios. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingBeneficio(null)
    reset({
      titulo: '',
      descricao: '',
      icone: '',
      ordem: beneficios.length,
      ativo: true,
    })
    setDialogOpen(true)
  }

  function openEditDialog(beneficio: Beneficio) {
    setEditingBeneficio(beneficio)
    reset({
      titulo: beneficio.titulo,
      descricao: beneficio.descricao,
      icone: beneficio.icone || '',
      ordem: beneficio.ordem,
      ativo: beneficio.ativo,
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(beneficio: Beneficio) {
    setDeletingBeneficio(beneficio)
    setDeleteDialogOpen(true)
  }

  async function onSubmit(data: BeneficioData) {
    try {
      setSaving(true)
      setError(null)

      const url = editingBeneficio
        ? `/api/torcida/${torcidaId}/beneficios/${editingBeneficio.id}`
        : `/api/torcida/${torcidaId}/beneficios`

      const response = await fetch(url, {
        method: editingBeneficio ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao salvar benefício')
      }

      await loadBeneficios()
      setDialogOpen(false)
    } catch (err) {
      console.error('Erro ao salvar benefício:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar benefício')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingBeneficio) return

    try {
      setSaving(true)
      const response = await fetch(
        `/api/torcida/${torcidaId}/beneficios/${deletingBeneficio.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao excluir benefício')
      }

      await loadBeneficios()
      setDeleteDialogOpen(false)
      setDeletingBeneficio(null)
    } catch (err) {
      console.error('Erro ao excluir benefício:', err)
      setError(err instanceof Error ? err.message : 'Erro ao excluir benefício')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Benefícios da Torcida</h2>
              <p className="text-sm text-muted-foreground">
                Vantagens oferecidas aos sócios-torcedores
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Benefício
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={loadBeneficios}>
              Tentar novamente
            </Button>
          </div>
        )}

        {beneficios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum benefício cadastrado</p>
            <p className="text-sm">Ex: Desconto em ingressos, Kit de boas-vindas...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficios.map((beneficio) => (
                <TableRow key={beneficio.id}>
                  <TableCell className="font-medium">{beneficio.titulo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {beneficio.descricao.substring(0, 50)}
                    {beneficio.descricao.length > 50 ? '...' : ''}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(beneficio)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(beneficio)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBeneficio ? 'Editar Benefício' : 'Novo Benefício'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                {...register('titulo')}
                placeholder="Ex: Desconto em Ingressos"
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
                placeholder="Descreva o benefício oferecido aos sócios..."
                className="min-h-[100px]"
              />
              {errors.descricao && (
                <p className="text-sm text-red-400">{errors.descricao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="icone">Ícone (opcional)</Label>
              <Input
                id="icone"
                {...register('icone')}
                placeholder="Ex: Ticket (ingresso), Percent (desconto), Gift (presente)..."
              />
              <p className="text-xs text-muted-foreground">
                Use o nome em inglês do ícone Lucide. Ex: Ticket, Star, Heart
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingBeneficio ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Benefício</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o benefício &quot;{deletingBeneficio?.titulo}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-500 hover:bg-red-600"
            >
              {saving ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
