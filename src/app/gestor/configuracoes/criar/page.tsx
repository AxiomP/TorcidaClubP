'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { torcidaCreateSchema, type TorcidaCreateData } from '@/lib/validations/torcida-create-schema'
import { ColorPresetPicker } from '@/components/shared/color-preset-picker'
import type { ColorPresetValue } from '@/lib/utils/color-presets'
import dynamic from 'next/dynamic'

const ArrowLeft = dynamic(() => import('lucide-react').then(mod => ({ default: mod.ArrowLeft })), { ssr: false })
const Building2 = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Building2 })), { ssr: false })
const Palette = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Palette })), { ssr: false })
const CreditCard = dynamic(() => import('lucide-react').then(mod => ({ default: mod.CreditCard })), { ssr: false })
const Users = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), { ssr: false })
const MessageCircle = dynamic(() => import('lucide-react').then(mod => ({ default: mod.MessageCircle })), { ssr: false })
const Sparkles = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Sparkles })), { ssr: false })

export default function CriarTorcidaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TorcidaCreateData>({
    resolver: zodResolver(torcidaCreateSchema),
    defaultValues: {
      nome: '',
      slug: '',
      frase_efeito: '',
      endereco_sede: '',
      presidente: '',
      vice_presidente: '',
      chave_pix: '',
      dia_vencimento_mensalidade: 10,
      idade_min_pagamento: 16,
      idade_min_compra_ingresso: 12,
      whatsapp_grupo: '',
      cor_fundo: 'preto_carvao',
    },
  })

  const corFundo = watch('cor_fundo')
  const slugValue = watch('slug')

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nome = e.target.value

    const currentSlug = watch('slug')
    const generatedSlug = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!currentSlug || currentSlug === generatedSlug.slice(0, -1)) {
      setValue('slug', generatedSlug)
    }
  }

  async function onSubmit(data: TorcidaCreateData) {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/torcida', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar torcida')
      }

      if (result.invoiceUrl) {
        window.location.href = result.invoiceUrl
      } else {
        window.location.href = '/gestor/configuracoes?created=true'
      }

    } catch (err) {
      console.error('Erro ao criar torcida:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar torcida')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Criar Nova Torcida
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure os dados iniciais da sua torcida organizada
          </p>
        </div>
      </div>

      {/* Alerta de erro */}
      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 border-primary/50 bg-primary/5">
        <p className="text-sm">
          <strong>Dica:</strong> Você pode completar as informações depois.
          Apenas o <strong>Nome</strong> e o <strong>Slug (URL)</strong> são obrigatórios agora.
        </p>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Identificação</h2>
              <p className="text-sm text-muted-foreground">Dados básicos da torcida</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Torcida *</Label>
              <Input
                id="nome"
                {...register('nome', {
                  onChange: handleNomeChange,
                })}
                placeholder="Ex: Torcida Jovem do Sport"
              />
              {errors.nome && (
                <p className="text-sm text-red-400">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="ex: torcida-jovem-sport"
              />
              {errors.slug && (
                <p className="text-sm text-red-400">{errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                URL: /torcida/{slugValue || 'seu-slug'}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="frase_efeito">Frase de Efeito</Label>
              <Input
                id="frase_efeito"
                {...register('frase_efeito')}
                placeholder="Ex: Unidos pela paixão!"
              />
              {errors.frase_efeito && (
                <p className="text-sm text-red-400">{errors.frase_efeito.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco_sede">Endereço da Sede</Label>
              <Input
                id="endereco_sede"
                {...register('endereco_sede')}
                placeholder="Ex: Rua do Esporte, 123 - Recife/PE"
              />
              {errors.endereco_sede && (
                <p className="text-sm text-red-400">{errors.endereco_sede.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Diretoria */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Diretoria</h2>
              <p className="text-sm text-muted-foreground">Liderança da torcida</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="presidente">Presidente</Label>
              <Input
                id="presidente"
                {...register('presidente')}
                placeholder="Nome do presidente"
              />
              {errors.presidente && (
                <p className="text-sm text-red-400">{errors.presidente.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vice_presidente">Vice-Presidente</Label>
              <Input
                id="vice_presidente"
                {...register('vice_presidente')}
                placeholder="Nome do vice-presidente"
              />
              {errors.vice_presidente && (
                <p className="text-sm text-red-400">{errors.vice_presidente.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Financeiro */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Financeiro</h2>
              <p className="text-sm text-muted-foreground">Configurações de pagamento</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="chave_pix">Chave PIX</Label>
              <Input
                id="chave_pix"
                {...register('chave_pix')}
                placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
              />
              {errors.chave_pix && (
                <p className="text-sm text-red-400">{errors.chave_pix.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idade_min_pagamento">Idade Mín. para Pagar</Label>
              <Input
                id="idade_min_pagamento"
                type="number"
                min={0}
                max={100}
                {...register('idade_min_pagamento', { valueAsNumber: true })}
              />
              {errors.idade_min_pagamento && (
                <p className="text-sm text-red-400">{errors.idade_min_pagamento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idade_min_compra_ingresso">Idade Mín. para Ingresso</Label>
              <Input
                id="idade_min_compra_ingresso"
                type="number"
                min={0}
                max={100}
                {...register('idade_min_compra_ingresso', { valueAsNumber: true })}
              />
              {errors.idade_min_compra_ingresso && (
                <p className="text-sm text-red-400">{errors.idade_min_compra_ingresso.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Comunicação */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Comunicação</h2>
              <p className="text-sm text-muted-foreground">Links de comunicação</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_grupo">Link do Grupo WhatsApp</Label>
            <Input
              id="whatsapp_grupo"
              {...register('whatsapp_grupo')}
              placeholder="https://chat.whatsapp.com/..."
            />
            {errors.whatsapp_grupo && (
              <p className="text-sm text-red-400">{errors.whatsapp_grupo.message}</p>
            )}
          </div>
        </Card>

        {/* Visual */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Palette className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Visual</h2>
              <p className="text-sm text-muted-foreground">Personalização visual</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor de Fundo</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione a cor principal da sua torcida
            </p>
            <ColorPresetPicker
              value={corFundo}
              onChange={(value) => setValue('cor_fundo', value as ColorPresetValue)}
              disabled={saving}
            />
            {errors.cor_fundo && (
              <p className="text-sm text-red-400">{errors.cor_fundo.message}</p>
            )}
          </div>
        </Card>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Criando Torcida...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Criar Torcida
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
