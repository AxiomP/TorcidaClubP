'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { linkCreateSchema, type LinkData } from '@/lib/validations/link-schema'
import { Link2, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'

interface Link {
  id: string
  titulo: string
  url: string
  icone: string | null
  ordem: number
  ativo: boolean
}

interface TabLinksProps {
  torcidaId: string
  isActive?: boolean
}

const FETCH_TIMEOUT = 10000

export function TabLinks({ torcidaId, isActive = false }: TabLinksProps) {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [deletingLink, setDeletingLink] = useState<Link | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkData>({
    resolver: zodResolver(linkCreateSchema),
    defaultValues: {
      titulo: '',
      url: '',
      icone: '',
      ordem: 0,
      ativo: true,
    },
  })

  useEffect(() => {
    if (isActive && !hasLoaded) {
      loadLinks()
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

  async function loadLinks() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      setError(null)
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
      const response = await fetch(`/api/torcida/${torcidaId}/links`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error('Erro ao carregar links')
      const data = await response.json()
      setLinks(data)
      setHasLoaded(true)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Tempo esgotado ao carregar links. Tente novamente.')
        return
      }
      console.error('Erro ao carregar links:', err)
      setError('Erro ao carregar links. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingLink(null)
    reset({
      titulo: '',
      url: '',
      icone: '',
      ordem: links.length,
      ativo: true,
    })
    setDialogOpen(true)
  }

  function openEditDialog(link: Link) {
    setEditingLink(link)
    reset({
      titulo: link.titulo,
      url: link.url,
      icone: link.icone || '',
      ordem: link.ordem,
      ativo: link.ativo,
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(link: Link) {
    setDeletingLink(link)
    setDeleteDialogOpen(true)
  }

  async function onSubmit(data: LinkData) {
    try {
      setSaving(true)
      setError(null)

      const url = editingLink
        ? `/api/torcida/${torcidaId}/links/${editingLink.id}`
        : `/api/torcida/${torcidaId}/links`

      const response = await fetch(url, {
        method: editingLink ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao salvar link')
      }

      await loadLinks()
      setDialogOpen(false)
    } catch (err) {
      console.error('Erro ao salvar link:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar link')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingLink) return

    try {
      setSaving(true)
      const response = await fetch(
        `/api/torcida/${torcidaId}/links/${deletingLink.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao excluir link')
      }

      await loadLinks()
      setDeleteDialogOpen(false)
      setDeletingLink(null)
    } catch (err) {
      console.error('Erro ao excluir link:', err)
      setError(err instanceof Error ? err.message : 'Erro ao excluir link')
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
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Links Externos</h2>
              <p className="text-sm text-muted-foreground">
                Links para redes sociais e sites da torcida
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Link
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={loadLinks}>
              Tentar novamente
            </Button>
          </div>
        )}

        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum link cadastrado</p>
            <p className="text-sm">Clique em &quot;Adicionar Link&quot; para começar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.titulo}</TableCell>
                  <TableCell>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:underline"
                    >
                      {link.url.substring(0, 40)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(link)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(link)}
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
              {editingLink ? 'Editar Link' : 'Novo Link'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                {...register('titulo')}
                placeholder="Ex: Instagram"
              />
              {errors.titulo && (
                <p className="text-sm text-red-400">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                {...register('url')}
                placeholder="https://instagram.com/sua-torcida"
              />
              {errors.url && (
                <p className="text-sm text-red-400">{errors.url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="icone">Ícone (opcional)</Label>
              <Input
                id="icone"
                {...register('icone')}
                placeholder="Ex: Instagram, Facebook, Globe..."
              />
              <p className="text-xs text-muted-foreground">
                Nome do ícone do Lucide (opcional)
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
                {saving ? 'Salvando...' : editingLink ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Link</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o link &quot;{deletingLink?.titulo}&quot;?
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
