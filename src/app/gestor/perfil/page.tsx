'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { Plus, Settings, ArrowLeft, Phone } from 'lucide-react'
import { AssinaturaSection } from '@/components/gestor/assinatura-section'

interface Torcida {
  id: string
  nome: string
  slug: string
}

interface GestorProfile {
  id: string
  nome_completo: string
  email: string
  torcida_id: string | null
  role: string
  telefone: string | null
}

export default function PerfilPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [torcidas, setTorcidas] = useState<Torcida[]>([])
  const [gestorProfile, setGestorProfile] = useState<GestorProfile | null>(null)
  const [selectedTorcida, setSelectedTorcida] = useState<string | undefined>(undefined)
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [telefone, setTelefone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const res = await fetch('/api/gestor/perfil')
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) { setError('Erro ao carregar perfil do gestor'); setLoading(false); return }

      const { gestor, torcida } = await res.json()
      setGestorProfile(gestor)
      setNomeCompleto(gestor.nome_completo || '')
      setTelefone(gestor.telefone || '')
      setSelectedTorcida(gestor.torcida_id || undefined)
      setTorcidas(torcida ? [torcida] : [])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (!nomeCompleto.trim()) {
        setError('Nome completo é obrigatório')
        return
      }

      if (!telefone.trim()) {
        setError('Telefone / WhatsApp é obrigatório')
        return
      }

      if (!gestorProfile) {
        setError('Perfil não encontrado')
        return
      }

      const res = await fetch('/api/gestor/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: nomeCompleto.trim(),
          telefone: telefone.trim() || null,
        }),
      })

      if (!res.ok) {
        setError('Erro ao salvar configurações')
        return
      }

      if (gestorProfile.torcida_id) {
        window.location.href = '/gestor/configuracoes'
      } else {
        setSuccess('Perfil atualizado com sucesso!')
        setTimeout(() => setSuccess(null), 3000)
      }

    } catch (err) {
      console.error('Erro ao salvar:', err)
      setError('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="p-4 border-green-200 bg-green-50">
          <p className="text-green-600 text-sm">{success}</p>
        </Card>
      )}

      {/* Alerta de Perfil Incompleto */}
      {gestorProfile && !gestorProfile.torcida_id && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-600 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-800">Perfil Incompleto</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Selecione uma torcida para começar a usar todas as funcionalidades do sistema.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Dados do Perfil */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome Completo</Label>
            <Input
              id="nome_completo"
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Digite seu nome completo"
              disabled={saving}
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone / WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Input
              id="telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Número exibido para os sócios no botão de Suporte
            </p>
          </div>

          {/* Email (somente leitura) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={gestorProfile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email vinculado à sua conta Google (não pode ser alterado)
            </p>
          </div>

          {/* Torcida */}
          <div className="space-y-2">
            <Label htmlFor="torcida">Torcida</Label>
            <div className="flex gap-2">
              <Select
                value={selectedTorcida}
                onValueChange={setSelectedTorcida}
                disabled={saving}
              >
                <SelectTrigger id="torcida" className="flex-1">
                  <SelectValue placeholder="Selecione uma torcida" />
                </SelectTrigger>
                <SelectContent>
                  {torcidas.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhuma torcida disponível
                    </SelectItem>
                  ) : (
                    torcidas.map((torcida) => (
                      <SelectItem key={torcida.id} value={torcida.id}>
                        {torcida.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Botão para criar nova torcida */}
              {!gestorProfile?.torcida_id && (
                <Button variant="outline" asChild>
                  <Link href="/gestor/configuracoes/criar">
                    <Plus className="h-4 w-4 mr-1" />
                    Nova
                  </Link>
                </Button>
              )}

              {/* Botão para configurar torcida existente */}
              {selectedTorcida && (
                <Button variant="outline" asChild>
                  <Link href="/gestor/configuracoes">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {torcidas.length === 0 && !gestorProfile?.torcida_id
                ? 'Crie uma nova torcida para começar'
                : gestorProfile?.torcida_id
                  ? 'Torcida vinculada ao seu perfil'
                  : 'Selecione uma torcida ou crie uma nova'}
            </p>
          </div>

          {/* Role (somente leitura) */}
          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Acesso</Label>
            <Input
              id="role"
              type="text"
              value={gestorProfile?.role || 'gestor'}
              disabled
              className="bg-muted capitalize"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Voltar
            </Button>
          </div>
        </div>
      </Card>
      {/* Assinatura */}
      <div className="border-t pt-6">
        <AssinaturaSection />
      </div>

      {/* Zona de perigo */}
      <div className="mt-8 pt-6 border-t border-red-500/20">
        <Button
          variant="outline"
          className="text-red-500 border-red-500/30 hover:bg-red-500/10"
          onClick={async () => {
            if (!window.confirm('Tem certeza? Sua torcida será suspensa e todos os seus dados removidos permanentemente.')) return
            const res = await fetch(`/api/gestores/${gestorProfile?.id}`, { method: 'DELETE' })
            if (res.ok) {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.replace('/login')
            }
          }}
        >
          Excluir Minha Conta
        </Button>
      </div>
    </div>
  )
}
