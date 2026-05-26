'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { TorcidaConfigData } from '@/lib/validations/torcida-schema'
import { Shield, FileText, Users, Save } from 'lucide-react'

interface TabRegrasProps {
  register: UseFormRegister<TorcidaConfigData>
  errors: FieldErrors<TorcidaConfigData>
  saving: boolean
  onSave: () => void
}

export function TabRegras({ register, errors, saving, onSave }: TabRegrasProps) {
  return (
    <div className="space-y-6">
      {/* Políticas */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Política de Privacidade</h2>
            <p className="text-sm text-muted-foreground">Política de privacidade da sua torcida</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="politica_privacidade">Texto da Política</Label>
          <Textarea
            id="politica_privacidade"
            {...register('politica_privacidade')}
            placeholder="Insira aqui a política de privacidade da sua torcida..."
            className="min-h-[200px]"
          />
          {errors.politica_privacidade && (
            <p className="text-sm text-red-400">{errors.politica_privacidade.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Este texto será exibido aos sócios durante o cadastro
          </p>
        </div>
      </Card>

      {/* Termos de Uso */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Termos e Condições</h2>
            <p className="text-sm text-muted-foreground">Termos de uso da sua torcida</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="termos_uso">Texto dos Termos</Label>
          <Textarea
            id="termos_uso"
            {...register('termos_uso')}
            placeholder="Insira aqui os termos e condições de uso da sua torcida..."
            className="min-h-[200px]"
          />
          {errors.termos_uso && (
            <p className="text-sm text-red-400">{errors.termos_uso.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Este texto será exibido aos sócios durante o cadastro
          </p>
        </div>
      </Card>

      {/* Termos de Compra de Ingresso */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Termos de Compra de Ingresso</h2>
            <p className="text-sm text-muted-foreground">Regras para compra de ingressos</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="termos_compra_ingresso">Texto dos Termos de Ingresso</Label>
          <Textarea
            id="termos_compra_ingresso"
            {...register('termos_compra_ingresso')}
            placeholder="Insira aqui os termos de compra de ingresso..."
            className="min-h-[200px]"
          />
          {errors.termos_compra_ingresso && (
            <p className="text-sm text-red-400">{errors.termos_compra_ingresso.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Este texto será exibido durante a compra de ingressos
          </p>
        </div>
      </Card>

      {/* Idades Mínimas */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Regras de Idade</h2>
            <p className="text-sm text-muted-foreground">Idades mínimas para pagamento e ingresso</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="idade_min_pagamento">Idade Mín. para Pagar Mensalidade</Label>
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
            <p className="text-xs text-muted-foreground">
              Sócios abaixo dessa idade não pagam mensalidade
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idade_min_compra_ingresso">Idade Mín. para Comprar Ingresso</Label>
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
            <p className="text-xs text-muted-foreground">
              Sócios abaixo dessa idade não precisam de ingresso
            </p>
          </div>
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
              Salvar Regras
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
