'use client'

/**
 * Step 1: Dados Pessoais
 * Baseado em RN001 (Validação de CPF) e schema step1
 */

import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { CPFInput } from '@/components/shared/cpf-input'
import { DatePicker } from '@/components/shared/date-picker'
import { GENEROS, ESCOLARIDADES, ESTADOS_CIVIS } from '@/lib/utils/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function Step1DadosPessoais() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Dados Pessoais</h2>
        <p className="text-sm text-muted-foreground">
          Preencha seus dados pessoais para começar o cadastro
        </p>
      </div>

      <div className="space-y-4">
        {/* CPF e Número do RG - Grid 2 colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CPF */}
          <div>
            <Controller
              name="cpf"
              control={control}
              render={({ field }) => (
                <CPFInput
                  value={field.value}
                  onChange={field.onChange}
                  showValidation
                  checkDuplicate
                  label="CPF"
                />
              )}
            />
            {errors.cpf && (
              <p className="text-sm text-red-600">{errors.cpf.message as string}</p>
            )}
          </div>

          {/* Número do RG */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Número do RG</label>
            <Input
              {...register('numero_rg')}
              placeholder="Ex: 12.345.678-9"
            />
            {errors.numero_rg && (
              <p className="text-sm text-red-600">
                {errors.numero_rg.message as string}
              </p>
            )}
          </div>
        </div>

        {/* Nome Completo */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('nome_completo')}
            placeholder="Ex: João da Silva Santos"
            className={errors.nome_completo ? 'border-red-500' : ''}
          />
          {errors.nome_completo && (
            <p className="text-sm text-red-600">
              {errors.nome_completo.message as string}
            </p>
          )}
        </div>

        {/* Apelido */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Apelido (como prefere ser chamado)
          </label>
          <Input
            {...register('apelido')}
            placeholder="Ex: João, Joãozinho"
          />
          {errors.apelido && (
            <p className="text-sm text-red-600">
              {errors.apelido.message as string}
            </p>
          )}
        </div>

        {/* Data de Nascimento, Gênero e Estado Civil */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Data de Nascimento */}
          <Controller
            name="data_nascimento"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Data de Nascimento"
                value={field.value}
                onChange={field.onChange}
                showAge
                maxDate={new Date()}
              />
            )}
          />
          {errors.data_nascimento && (
            <p className="text-sm text-red-600 col-span-3">
              {errors.data_nascimento.message as string}
            </p>
          )}

          {/* Gênero */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Gênero <span className="text-red-500">*</span>
            </label>
            <Controller
              name="genero"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    className={errors.genero ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENEROS.map((genero) => (
                      <SelectItem key={genero.value} value={genero.value}>
                        {genero.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.genero && (
              <p className="text-sm text-red-600">
                {errors.genero.message as string}
              </p>
            )}
          </div>

          {/* Estado Civil */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Estado Civil</label>
            <Controller
              name="estado_civil"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CIVIS.map((ec) => (
                      <SelectItem key={ec.value} value={ec.value}>
                        {ec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Escolaridade e Profissão - Grid 2 colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Escolaridade */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Escolaridade</label>
            <Controller
              name="escolaridade"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESCOLARIDADES.map((esc) => (
                      <SelectItem key={esc.value} value={esc.value}>
                        {esc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Profissão */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Profissão</label>
            <Input
              {...register('profissao')}
              placeholder="Ex: Estudante, Engenheiro"
            />
          </div>
        </div>

        {/* Nome da Mãe e Pai - Grid 2 colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nome da Mãe */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome da Mãe</label>
            <Input
              {...register('nome_mae')}
              placeholder="Nome completo da mãe"
            />
            {errors.nome_mae && (
              <p className="text-sm text-red-600">
                {errors.nome_mae.message as string}
              </p>
            )}
          </div>

          {/* Nome do Pai */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome do Pai</label>
            <Input
              {...register('nome_pai')}
              placeholder="Nome completo do pai (opcional)"
            />
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>ℹ️ Importante:</strong> Todos os campos marcados com{' '}
          <span className="text-red-500">*</span> são obrigatórios. Certifique-se
          de preencher corretamente para evitar problemas na aprovação do cadastro.
        </p>
      </div>
    </div>
  )
}
