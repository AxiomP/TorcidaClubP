'use client'

/**
 * Step 2: Endereço e Contato
 * Baseado em RN026 (Email) e RN027 (WhatsApp)
 */

import { useFormContext, useFieldArray } from 'react-hook-form'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ESTADOS } from '@/lib/utils/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import { formatTelefone, formatCEP, removeFormatacao } from '@/lib/utils/format'
import { MapPin, Phone, User, AtSign, Plus, X } from 'lucide-react'

// Regex para detectar UUIDs colados (com hífens)
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function Step2Endereco() {
  const {
    register,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext()

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contatos_emergencia_adicionais',
  })

  const watchedCep = watch('cep')
  const [cepDisplay, setCepDisplay] = useState(watchedCep ? formatCEP(watchedCep) : '')

  // Formatar WhatsApp em tempo real (armazena APENAS dígitos)
  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Sanitização: se valor colado for UUID, limpar campo
    if (UUID_PATTERN.test(value.trim())) {
      setValue('whatsapp', '', { shouldValidate: true })
      e.target.value = ''
      return
    }

    // Remove TUDO que não é dígito (/\D/g remove letras, espaços, parênteses, traços, etc.)
    const apenasNumeros = value.replace(/\D/g, '')

    // Limita a 11 dígitos (DDD + 9 dígitos)
    const numerosTruncados = apenasNumeros.slice(0, 11)

    // Formata visualmente para o usuário
    const formatted = formatTelefone(numerosTruncados)

    // Armazena APENAS números no form (validação espera /^\d{10,11}$/)
    setValue('whatsapp', numerosTruncados, { shouldValidate: true })

    // Atualiza visualmente o input
    e.target.value = formatted
  }

  // Formatar telefone de emergência (armazena APENAS dígitos)
  const handleTelEmergenciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Sanitização: se valor colado for UUID, limpar campo
    if (UUID_PATTERN.test(value.trim())) {
      setValue('contato_emergencia_telefone', '', { shouldValidate: true })
      e.target.value = ''
      return
    }

    // Remove TUDO que não é dígito
    const apenasNumeros = value.replace(/\D/g, '')

    // Limita a 11 dígitos
    const numerosTruncados = apenasNumeros.slice(0, 11)

    // Formata visualmente
    const formatted = formatTelefone(numerosTruncados)

    // Armazena APENAS números no form
    setValue('contato_emergencia_telefone', numerosTruncados, { shouldValidate: true })

    // Atualiza visualmente
    e.target.value = formatted
  }

  // Formatar CEP
  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeros = removeFormatacao(e.target.value).slice(0, 8)
    setCepDisplay(formatCEP(numeros))
    setValue('cep', numeros, { shouldValidate: true })
  }

  // Formatar telefone de contato adicional
  const handleTelAdicionalChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Sanitização: se valor colado for UUID, limpar campo
    if (UUID_PATTERN.test(value.trim())) {
      setValue(`contatos_emergencia_adicionais.${index}.telefone`, '', { shouldValidate: true })
      e.target.value = ''
      return
    }

    const apenasNumeros = value.replace(/\D/g, '')
    const numerosTruncados = apenasNumeros.slice(0, 11)
    const formatted = formatTelefone(numerosTruncados)
    setValue(`contatos_emergencia_adicionais.${index}.telefone`, numerosTruncados, { shouldValidate: true })
    e.target.value = formatted
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Endereço e Contato</h2>
        <p className="text-sm text-muted-foreground">
          Informe seu endereço completo e formas de contato
        </p>
      </div>

      <div className="space-y-4">
        {/* Seção: Endereço */}
        <div className="space-y-4 pb-4 border-b">
          <div className="flex items-center gap-2 text-sm font-medium text-torcida-laranja">
            <MapPin className="w-4 h-4" />
            <span>Endereço</span>
          </div>

          {/* Endereço e Número */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-sm font-medium">
                Endereço <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('endereco_completo')}
                placeholder="Rua, Avenida, etc."
                className={errors.endereco_completo ? 'border-red-500' : ''}
              />
              {errors.endereco_completo && (
                <p className="text-sm text-red-600">
                  {errors.endereco_completo.message as string}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Número <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('numero')}
                placeholder="123"
                className={errors.numero ? 'border-red-500' : ''}
              />
              {errors.numero && (
                <p className="text-sm text-red-600">
                  {errors.numero.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Complemento e Bairro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Complemento</label>
              <Input
                {...register('complemento')}
                placeholder="Apto, Bloco, etc."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Bairro <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('bairro')}
                placeholder="Nome do bairro"
                className={errors.bairro ? 'border-red-500' : ''}
              />
              {errors.bairro && (
                <p className="text-sm text-red-600">
                  {errors.bairro.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Cidade, Estado e CEP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Cidade <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('cidade')}
                placeholder="Nome da cidade"
                className={errors.cidade ? 'border-red-500' : ''}
              />
              {errors.cidade && (
                <p className="text-sm text-red-600">
                  {errors.cidade.message as string}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Estado <span className="text-red-500">*</span>
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      className={errors.estado ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.estado && (
                <p className="text-sm text-red-600">
                  {errors.estado.message as string}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">CEP</label>
              <Input
                name="cep"
                placeholder="00000-000"
                value={cepDisplay}
                onChange={handleCEPChange}
                maxLength={9}
              />
            </div>
          </div>
        </div>

        {/* Seção: Contatos */}
        <div className="space-y-4 pb-4 border-b">
          <div className="flex items-center gap-2 text-sm font-medium text-torcida-laranja">
            <Phone className="w-4 h-4" />
            <span>Contatos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <Input
                name="whatsapp"
                type="tel"
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                onChange={handleWhatsAppChange}
                defaultValue={watch('whatsapp') ? formatTelefone(watch('whatsapp')) : ''}
                maxLength={15}
                className={errors.whatsapp ? 'border-red-500' : ''}
              />
              {errors.whatsapp && (
                <p className="text-sm text-red-600">
                  {errors.whatsapp.message as string}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Usaremos para enviar lembretes importantes
              </p>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="seu@email.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">
                  {errors.email.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Rede Social */}
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1">
              <AtSign className="w-3 h-3" />
              Rede Social (Instagram, etc.)
            </label>
            <Input
              {...register('rede_social')}
              placeholder="@seu_usuario"
            />
            <p className="text-xs text-muted-foreground">
              Opcional - Informe seu @ do Instagram ou outra rede social
            </p>
          </div>
        </div>

        {/* Seção: Contato de Emergência */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-torcida-laranja">
            <User className="w-4 h-4" />
            <span>Contato de Emergência</span>
          </div>

          {/* Contato principal (obrigatório) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('contato_emergencia_nome')}
                placeholder="Nome completo"
                className={errors.contato_emergencia_nome ? 'border-red-500' : ''}
              />
              {errors.contato_emergencia_nome && (
                <p className="text-sm text-red-600">
                  {errors.contato_emergencia_nome.message as string}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Telefone <span className="text-red-500">*</span>
              </label>
              <Input
                name="contato_emergencia_telefone"
                type="tel"
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                onChange={handleTelEmergenciaChange}
                defaultValue={watch('contato_emergencia_telefone') ? formatTelefone(watch('contato_emergencia_telefone')) : ''}
                maxLength={15}
                className={errors.contato_emergencia_telefone ? 'border-red-500' : ''}
              />
              {errors.contato_emergencia_telefone && (
                <p className="text-sm text-red-600">
                  {errors.contato_emergencia_telefone.message as string}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Parentesco <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('contato_emergencia_parentesco')}
                placeholder="Ex: Mãe, Pai, Irmão"
                className={errors.contato_emergencia_parentesco ? 'border-red-500' : ''}
              />
              {errors.contato_emergencia_parentesco && (
                <p className="text-sm text-red-600">
                  {errors.contato_emergencia_parentesco.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Contatos adicionais */}
          {fields.map((field, index) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fieldErrors = (errors.contatos_emergencia_adicionais as any)?.[index] as
              | { nome?: { message?: string }; telefone?: { message?: string }; parentesco?: { message?: string } }
              | undefined

            return (
              <div key={field.id} className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Remover contato"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register(`contatos_emergencia_adicionais.${index}.nome`)}
                    placeholder="Nome completo"
                    className={fieldErrors?.nome ? 'border-red-500' : ''}
                  />
                  {fieldErrors?.nome && (
                    <p className="text-sm text-red-600">
                      {fieldErrors.nome.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name={`contatos_emergencia_adicionais.${index}.telefone`}
                    type="tel"
                    inputMode="numeric"
                    placeholder="(00) 00000-0000"
                    onChange={(e) => handleTelAdicionalChange(index, e)}
                    defaultValue={watch(`contatos_emergencia_adicionais.${index}.telefone`) ? formatTelefone(watch(`contatos_emergencia_adicionais.${index}.telefone`)) : ''}
                    maxLength={15}
                    className={fieldErrors?.telefone ? 'border-red-500' : ''}
                  />
                  {fieldErrors?.telefone && (
                    <p className="text-sm text-red-600">
                      {fieldErrors.telefone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Parentesco <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register(`contatos_emergencia_adicionais.${index}.parentesco`)}
                    placeholder="Ex: Mãe, Pai, Irmão"
                    className={fieldErrors?.parentesco ? 'border-red-500' : ''}
                  />
                  {fieldErrors?.parentesco && (
                    <p className="text-sm text-red-600">
                      {fieldErrors.parentesco.message}
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {/* Botão adicionar contato */}
          {fields.length < 2 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ nome: '', telefone: '', parentesco: '' })}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar outro contato
            </Button>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <strong>📍 Importante:</strong> Certifique-se de que o endereço está
          correto. Ele será usado para envio de correspondências e validação
          de documentos.
        </p>
      </div>
    </div>
  )
}
