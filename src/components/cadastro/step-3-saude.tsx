'use client'

/**
 * Step 3: Informações de Saúde
 * Opcional mas recomendado para segurança do sócio em eventos
 */

import { useFormContext, Controller } from 'react-hook-form'
import { Heart, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

export function Step3Saude() {
  const {
    register,
    control,
    watch,
  } = useFormContext()

  const necessidadesEspeciais = watch('necessidades_especiais')
  const temAlergias = watch('tem_alergias')
  const usaMedicacao = watch('usa_medicacao')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Informações de Saúde</h2>
        <p className="text-sm text-muted-foreground">
          Essas informações são opcionais mas ajudam a garantir sua segurança em eventos
        </p>
      </div>

      <div className="space-y-6">
        {/* Info box inicial */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Por que pedimos essas informações?</p>
              <p>
                Estas informações nos ajudam a prestar melhor assistência em caso de
                emergência durante eventos da torcida. Todos os dados são mantidos em
                sigilo.
              </p>
            </div>
          </div>
        </div>

        {/* Necessidades Especiais */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Controller
              name="necessidades_especiais"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="necessidades_especiais"
                />
              )}
            />
            <div className="space-y-1 flex-1">
              <label
                htmlFor="necessidades_especiais"
                className="text-sm font-medium cursor-pointer"
              >
                Possui necessidades especiais?
              </label>
              <p className="text-xs text-muted-foreground">
                Ex: Cadeirante, deficiência visual, auditiva, etc.
              </p>
            </div>
          </div>

          {necessidadesEspeciais && (
            <div className="space-y-1 ml-7">
              <label className="text-sm font-medium">
                Descreva suas necessidades
              </label>
              <Textarea
                {...register('descricao_necessidades')}
                placeholder="Descreva suas necessidades especiais para que possamos melhor atendê-lo em eventos..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Isso nos ajuda a garantir acessibilidade adequada nos eventos
              </p>
            </div>
          )}
        </div>

        {/* Alergias */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Controller
              name="tem_alergias"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="tem_alergias"
                />
              )}
            />
            <div className="space-y-1 flex-1">
              <label
                htmlFor="tem_alergias"
                className="text-sm font-medium cursor-pointer"
              >
                Possui alergias?
              </label>
              <p className="text-xs text-muted-foreground">
                Alergias a medicamentos, alimentos, materiais, etc.
              </p>
            </div>
          </div>

          {temAlergias && (
            <div className="space-y-1 ml-7">
              <label className="text-sm font-medium">
                Quais alergias?
              </label>
              <Textarea
                {...register('alergias')}
                placeholder="Ex: Alergia a amendoim, penicilina, látex, etc."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Liste quaisquer alergias conhecidas, especialmente a medicamentos
              </p>
            </div>
          )}
        </div>

        {/* Medicação */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Controller
              name="usa_medicacao"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="usa_medicacao"
                />
              )}
            />
            <div className="space-y-1 flex-1">
              <label
                htmlFor="usa_medicacao"
                className="text-sm font-medium cursor-pointer"
              >
                Faz uso contínuo de medicamentos?
              </label>
              <p className="text-xs text-muted-foreground">
                Medicamentos de uso regular (hipertensão, diabetes, etc.)
              </p>
            </div>
          </div>

          {usaMedicacao && (
            <div className="space-y-1 ml-7">
              <label className="text-sm font-medium">
                Quais medicamentos?
              </label>
              <Textarea
                {...register('medicacao_detalhes')}
                placeholder="Liste os medicamentos de uso contínuo, dosagens e horários..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Importante em caso de atendimento médico de emergência
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info box final */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-900 dark:text-green-100">
            <p className="font-medium mb-1">Privacidade garantida</p>
            <p>
              Todas as informações de saúde são confidenciais e só serão acessadas
              por pessoal autorizado em caso de emergência.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
