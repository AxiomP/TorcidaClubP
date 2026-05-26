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
import { funcaoCreateSchema, type FuncaoData } from '@/lib/validations/funcao-schema'
import { UserCog, Plus, Pencil, Trash2 } from 'lucide-react'

interface Funcao {
  id: string
  titulo: string
  descricao: string | null
  icone: string | null
  ordem: number
  ativo: boolean
}

interface TabFuncoesProps {
  torcidaId: string
  isActive?: boolean
}

const FETCH_TIMEOUT = 10000

export function TabFuncoes({ torcidaId, isActive = false }: TabFuncoesProps) {
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingFuncao, setEditingFuncao] = useState<Funcao | null>(null)
  const [deletingFuncao, setDeletingFuncao] = useState<Funcao | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FuncaoData>({
    resolver: zodResolver(funcaoCreateSchema),
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
      loadFuncoes()
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

  async function loadFuncoes() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      setError(null)
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
      const response = await fetch(`/api/torcida/${torcidaId}/funcoes`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error('Erro ao carregar funções')
      const data = await response.json()
      setFuncoes(data)
      setHasLoaded(true)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Tempo esgotado ao carregar funções. Tente novamente.')
        return
      }
      console.error('Erro ao carregar funções:', err)
      setError('Erro ao carregar funções. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingFuncao(null)
    reset({
      titulo: '',
      descricao: '',
      icone: '',
      ordem: funcoes.length,
      ativo: true,
    })
    setDialogOpen(true)
  }

  function openEditDialog(funcao: Funcao) {
    setEditingFuncao(funcao)
    reset({
      titulo: funcao.titulo,
      descricao: funcao.descricao || '',
      icone: funcao.icone || '',
      ordem: funcao.ordem,
      ativo: funcao.ativo,
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(funcao: Funcao) {
    setDeletingFuncao(funcao)
    setDeleteDialogOpen(true)
  }

  async function onSubmit(data: FuncaoData) {
    try {
      setSaving(true)
      setError(null)

      const url = editingFuncao
        ? `/api/torcida/${torcidaId}/funcoes/${editingFuncao.id}`
        : `/api/torcida/${torcidaId}/funcoes`

      const response = await fetch(url, {
        method: editingFuncao ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao salvar função')
      }

      await loadFuncoes()
      setDialogOpen(false)
    } catch (err) {
      console.error('Erro ao salvar função:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar função')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingFuncao) return

    try {
      setSaving(true)
      const response = await fetch(
        `/api/torcida/${torcidaId}/funcoes/${deletingFuncao.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao excluir função')
      }

      await loadFuncoes()
      setDeleteDialogOpen(false)
      setDeletingFuncao(null)
    } catch (err) {
      console.error('Erro ao excluir função:', err)
      setError(err instanceof Error ? err.message : 'Erro ao excluir função')
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
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Funções e Atribuições</h2>
              <p className="text-sm text-muted-foreground">
                Cargos e títulos para as fichas dos sócios
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Função
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={loadFuncoes}>
              Tentar novamente
            </Button>
          </div>
        )}

        {funcoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma função cadastrada</p>
            <p className="text-sm">Ex: Designer, Puxador de Torcida, Coordenador...</p>
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
              {funcoes.map((funcao) => (
                <TableRow key={funcao.id}>
                  <TableCell className="font-medium">{funcao.titulo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {funcao.descricao?.substring(0, 50) || '-'}
                    {funcao.descricao && funcao.descricao.length > 50 ? '...' : ''}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(funcao)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(funcao)}
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
              {editingFuncao ? 'Editar Função' : 'Nova Função'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                {...register('titulo')}
                placeholder="Ex: Designer"
              />
              {errors.titulo && (
                <p className="text-sm text-red-400">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descreva as responsabilidades desta função..."
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
                placeholder="Ex: Shield (escudo), Star (estrela), Megaphone (megafone)..."
              />
              <p className="text-xs text-muted-foreground">
                Use o nome em inglês do ícone Lucide. Ex: Shield, Trophy, Users
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
                {saving ? 'Salvando...' : editingFuncao ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Função</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a função &quot;{deletingFuncao?.titulo}&quot;?
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
