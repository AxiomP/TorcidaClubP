'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form'
import { TorcidaConfigData } from '@/lib/validations/torcida-schema'
import { Building2, Users, MessageCircle, Save, Info, Phone } from 'lucide-react'

interface TabInformacoesProps {
  register: UseFormRegister<TorcidaConfigData>
  errors: FieldErrors<TorcidaConfigData>
  watch: UseFormWatch<TorcidaConfigData>
  saving: boolean
  onSave: () => void
}

export function TabInformacoes({ register, errors, watch, saving, onSave }: TabInformacoesProps) {
  return (
    <div className="space-y-6">
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
              {...register('nome')}
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
              Usado na URL: /torcida/{watch('slug') || 'seu-slug'}
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
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
          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone de Suporte
            </Label>
            <Input
              id="telefone"
              {...register('telefone')}
              placeholder="(11) 99999-9999"
            />
            {errors.telefone && (
              <p className="text-sm text-red-400">{errors.telefone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Exibido no botão de Suporte para sócios</p>
          </div>
        </div>
      </Card>

      {/* Quem Somos */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Info className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Quem Somos</h2>
            <p className="text-sm text-muted-foreground">Texto apresentado aos sócios sobre a torcida</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quem_somos">Sobre a Torcida</Label>
          <textarea
            id="quem_somos"
            {...register('quem_somos')}
            placeholder="Conte a história da torcida, missão, valores..."
            rows={6}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.quem_somos && (
            <p className="text-sm text-red-400">{errors.quem_somos.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Este texto aparece quando o sócio clica em &quot;Quem Somos&quot; na tela de login e no painel
          </p>
        </div>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Informações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
