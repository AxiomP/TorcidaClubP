'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Star, ExternalLink, Save, X } from 'lucide-react'

interface Patrocinador {
  id: string
  texto_curto: string
  imagem_url: string | null
  link: string | null
  ativo: boolean
  created_at: string
}

interface FormData {
  texto_curto: string
  imagem_url: string
  link: string
  ativo: boolean
}

const emptyForm: FormData = { texto_curto: '', imagem_url: '', link: '', ativo: true }

export default function PatrocinadoresPage() {
  const [patrocinadores, setPatrocinadores] = useState<Patrocinador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  useEffect(() => {
    fetchPatrocinadores()
  }, [])

  async function fetchPatrocinadores() {
    setLoading(true)
    const res = await fetch('/api/patrocinadores')
    if (res.ok) {
      const data = await res.json()
      setPatrocinadores(data)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!form.texto_curto.trim()) {
      toast.error('Texto curto é obrigatório')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/patrocinadores/${editingId}` : '/api/patrocinadores'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success(editingId ? 'Patrocinador atualizado!' : 'Patrocinador criado!')
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchPatrocinadores()
    } catch {
      toast.error('Erro ao salvar patrocinador')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(p: Patrocinador) {
    const res = await fetch(`/api/patrocinadores/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, ativo: !p.ativo }),
    })
    if (res.ok) {
      setPatrocinadores(prev => prev.map(x => x.id === p.id ? { ...x, ativo: !x.ativo } : x))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir patrocinador?')) return
    const res = await fetch(`/api/patrocinadores/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPatrocinadores(prev => prev.filter(p => p.id !== id))
      toast.success('Patrocinador removido')
    }
  }

  function startEdit(p: Patrocinador) {
    setForm({ texto_curto: p.texto_curto, imagem_url: p.imagem_url || '', link: p.link || '', ativo: p.ativo })
    setEditingId(p.id)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-7 w-7 text-yellow-500" />
            Patrocinadores
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie pop-ups de patrocinadores exibidos para os sócios após o login
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Patrocinador
          </Button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Editar Patrocinador' : 'Novo Patrocinador'}</h2>
            <Button variant="ghost" size="sm" onClick={cancelForm}><X className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="texto_curto">Texto Curto <span className="text-red-500">*</span></Label>
              <textarea
                id="texto_curto"
                value={form.texto_curto}
                onChange={e => setForm(prev => ({ ...prev, texto_curto: e.target.value }))}
                placeholder="Mensagem curta sobre o patrocinador (ex: Patrocinado por XYZ — clique para saber mais!)"
                rows={3}
                maxLength={300}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">{form.texto_curto.length}/300 caracteres</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imagem_url">URL da Imagem</Label>
                <Input
                  id="imagem_url"
                  value={form.imagem_url}
                  onChange={e => setForm(prev => ({ ...prev, imagem_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link do Patrocinador</Label>
                <Input
                  id="link"
                  value={form.link}
                  onChange={e => setForm(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={e => setForm(prev => ({ ...prev, ativo: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Ativo (exibir para sócios)</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={cancelForm}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : patrocinadores.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum patrocinador cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Crie pop-ups de patrocinadores para exibir aos sócios após o login.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Patrocinador
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {patrocinadores.map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {p.imagem_url && (
                  <div className="relative w-16 h-16 shrink-0">
                    <Image
                      src={p.imagem_url}
                      alt="Patrocinador"
                      fill
                      className="object-cover rounded-lg border"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium">{p.texto_curto}</p>
                    <Badge className={p.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {p.link}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(p)} title={p.ativo ? 'Desativar' : 'Ativar'}>
                    {p.ativo ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Como funciona:</strong> Patrocinadores ativos são exibidos como pop-up para o sócio uma vez por sessão,
          ao acessar o painel pela primeira vez. Cada patrocinador pode ter um texto, imagem e link.
        </p>
      </Card>
    </div>
  )
}
