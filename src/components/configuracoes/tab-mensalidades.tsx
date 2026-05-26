'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { CreditCard, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'

interface TipoMensalidade {
  id: string
  nome: string
  valor: number
  permite_dependentes: boolean
  qtd_max_dependentes: number | null
  permite_ingressos_adicionais: boolean
  qtd_max_ingressos_adicionais: number | null
  beneficios: string[]
  ativo: boolean
  ordem: number
}

interface TabMensalidadesProps {
  torcidaId: string
  isActive?: boolean
}

const defaultFormData = {
  nome: '',
  valor: '',
  permite_dependentes: false,
  qtd_max_dependentes: '',
  permite_ingressos_adicionais: false,
  qtd_max_ingressos_adicionais: '',
  beneficios: '',
  ordem: 0,
}

const FETCH_TIMEOUT = 15000 // 15 segundos

export function TabMensalidades({ torcidaId, isActive = false }: TabMensalidadesProps) {
  const [mensalidades, setMensalidades] = useState<TipoMensalidade[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const isFetchingRef = useRef(false)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingMensalidade, setEditingMensalidade] = useState<TipoMensalidade | null>(null)
  const [deletingMensalidade, setDeletingMensalidade] = useState<TipoMensalidade | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadMensalidades = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const response = await fetch(`/api/tipos-mensalidade?torcida_id=${torcidaId}`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao carregar tipos de mensalidade')
      }

      const data = await response.json()
      setMensalidades(data.tipos || [])
      setHasLoaded(true)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tempo limite excedido. Clique para tentar novamente.')
      } else {
        console.error('Erro ao carregar tipos de mensalidade:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar tipos de mensalidade')
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [torcidaId])

  // Effect 1: Trigger fetch quando aba ativa e dados não carregados
  useEffect(() => {
    if (isActive && !hasLoaded) {
      loadMensalidades()
    }
  }, [isActive, hasLoaded, loadMensalidades])

  // Effect 2: Cleanup apenas no unmount real
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      isFetchingRef.current = false
    }
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    loadMensalidades()
  }, [loadMensalidades])

  function openCreateDialog() {
    setEditingMensalidade(null)
    setFormData({
      ...defaultFormData,
      ordem: mensalidades.length,
    })
    setDialogOpen(true)
  }

  function openEditDialog(mensalidade: TipoMensalidade) {
    setEditingMensalidade(mensalidade)
    setFormData({
      nome: mensalidade.nome,
      valor: mensalidade.valor.toString(),
      permite_dependentes: mensalidade.permite_dependentes,
      qtd_max_dependentes: mensalidade.qtd_max_dependentes?.toString() || '',
      permite_ingressos_adicionais: mensalidade.permite_ingressos_adicionais,
      qtd_max_ingressos_adicionais: mensalidade.qtd_max_ingressos_adicionais?.toString() || '',
      beneficios: Array.isArray(mensalidade.beneficios) ? mensalidade.beneficios.join(', ') : '',
      ordem: mensalidade.ordem,
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(mensalidade: TipoMensalidade) {
    setDeletingMensalidade(mensalidade)
    setDeleteDialogOpen(true)
  }

  function handleChange(field: string, value: string | boolean | number) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.nome || !formData.valor) {
      setError('Nome e valor são obrigatórios')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        id: editingMensalidade?.id,
        torcida_id: torcidaId,
        nome: formData.nome,
        valor: parseFloat(formData.valor),
        permite_dependentes: formData.permite_dependentes,
        qtd_max_dependentes: formData.qtd_max_dependentes ? parseInt(formData.qtd_max_dependentes) : null,
        permite_ingressos_adicionais: formData.permite_ingressos_adicionais,
        qtd_max_ingressos_adicionais: formData.qtd_max_ingressos_adicionais ? parseInt(formData.qtd_max_ingressos_adicionais) : null,
        beneficios: formData.beneficios ? formData.beneficios.split(',').map(b => b.trim()).filter(Boolean) : [],
        ordem: formData.ordem,
      }

      const response = await fetch('/api/tipos-mensalidade', {
        method: editingMensalidade ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao salvar tipo de mensalidade')
      }

      await loadMensalidades()
      setDialogOpen(false)
    } catch (err) {
      console.error('Erro ao salvar tipo de mensalidade:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar tipo de mensalidade')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingMensalidade) return

    try {
      setSaving(true)
      const response = await fetch(
        `/api/tipos-mensalidade?id=${deletingMensalidade.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao excluir tipo de mensalidade')
      }

      await loadMensalidades()
      setDeleteDialogOpen(false)
      setDeletingMensalidade(null)
    } catch (err) {
      console.error('Erro ao excluir tipo de mensalidade:', err)
      setError(err instanceof Error ? err.message : 'Erro ao excluir tipo de mensalidade')
    } finally {
      setSaving(false)
    }
  }

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Loading apenas quando está carregando ativamente
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Erro de carregamento com botão de retry
  if (error && !hasLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Card className="p-4 border-red-500/50 bg-red-500/10 max-w-md text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Tipos de Mensalidade</h2>
              <p className="text-sm text-muted-foreground">
                Configure os planos de mensalidade disponíveis para os sócios
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {mensalidades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum tipo de mensalidade cadastrado</p>
            <p className="text-sm">Ex: Plano Básico, Plano Família, Plano VIP...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Ordem</TableHead>
                <TableHead className="w-[100px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mensalidades.map((mensalidade) => (
                <TableRow key={mensalidade.id}>
                  <TableCell className="font-medium">{mensalidade.nome}</TableCell>
                  <TableCell className="text-right">{formatCurrency(mensalidade.valor)}</TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {mensalidade.ordem + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(mensalidade)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(mensalidade)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMensalidade ? 'Editar Tipo de Mensalidade' : 'Novo Tipo de Mensalidade'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Ex: Plano Basico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor Mensal (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                placeholder="Ex: 50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem de Exibicao</Label>
              <Input
                id="ordem"
                type="number"
                min="0"
                value={formData.ordem}
                onChange={(e) => handleChange('ordem', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Define a ordem de exibicao dos planos (menor numero aparece primeiro)
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
                {saving ? 'Salvando...' : editingMensalidade ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tipo de Mensalidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo de mensalidade &quot;{deletingMensalidade?.nome}&quot;?
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
