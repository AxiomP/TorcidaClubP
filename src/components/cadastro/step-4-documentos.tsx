'use client'

/**
 * Step 4: Documentos e Validação
 * Baseado em RN003 (Menores de idade) e RN028 (Upload de arquivos)
 * Atualizado: Inclui seleção de torcida obrigatória
 */

import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/shared/file-upload'
import { SignatureCanvasPad } from '@/components/shared/signature-canvas'
import { CPFInput } from '@/components/shared/cpf-input'
import { Checkbox } from '@/components/ui/checkbox'
import { SelecaoTorcida } from './selecao-torcida'
import { TIPOS_DOCUMENTO, TIPOS_COMPROVANTE, STORAGE_BUCKETS, DOCUMENTOS_FRENTE_VERSO } from '@/lib/utils/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Shield, AlertTriangle, Eye, EyeOff, Loader2, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isMenorDeIdade } from '@/lib/utils/calculate'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { PoliticaPrivacidadeModal } from '@/components/politica-privacidade-modal'
import { TermosTorcidaModal } from './termos-torcida-modal'

interface TipoMensalidade {
  id: string
  nome: string
  valor: number
}

interface Torcida {
  id: string
  nome: string
  slug: string
  brasao_url: string | null
  cor_fundo: string | null
  frase_efeito: string | null
}

interface Step4Props {
  torcidaId?: string | null
  onUploadingChange?: (isUploading: boolean) => void
  onTorcidaChange?: (torcidaId: string) => void
}

export function Step4Documentos({ torcidaId: initialTorcidaId, onUploadingChange, onTorcidaChange }: Step4Props) {
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tiposMensalidade, setTiposMensalidade] = useState<TipoMensalidade[]>([])
  const [isLoadingTipos, setIsLoadingTipos] = useState(false)
  const [uploadsEmProgresso, setUploadsEmProgresso] = useState(0)
  const [selectedTorcidaId, setSelectedTorcidaId] = useState<string | null>(initialTorcidaId || null)
  const [isSearchingCpf, setIsSearchingCpf] = useState(false)
  const [responsavelEncontrado, setResponsavelEncontrado] = useState<{ id: string; nome_completo: string } | null>(null)
  const [responsavelNaoEncontrado, setResponsavelNaoEncontrado] = useState(false)
  const [torcidaNome, setTorcidaNome] = useState<string>('')

  // Watch data de nascimento para determinar se é menor
  const dataNascimento = watch('data_nascimento')
  const eMenor = dataNascimento ? isMenorDeIdade(dataNascimento) : false
  const cpfResponsavel = watch('cpf_responsavel')

  const formatarCPF = (cpf: string) => {
    const c = cpf.replace(/\D/g, '')
    if (c.length !== 11) return cpf
    return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  // Watch tipo de documento para mostrar campos de frente/verso
  const tipoDocumento = watch('tipo_documento')
  const requerFrenteVerso = tipoDocumento && DOCUMENTOS_FRENTE_VERSO.includes(tipoDocumento as 'rg' | 'cnh' | 'cni')

  // Watch tipo de mensalidade selecionado para mostrar valor + PIX
  const tipoMensalidadeId = watch('tipo_mensalidade_id')
  const selectedTipo = tiposMensalidade.find(t => t.id === tipoMensalidadeId) || null

  // Callbacks para rastrear uploads
  const handleUploadStart = () => setUploadsEmProgresso((prev) => prev + 1)
  const handleUploadEnd = () => setUploadsEmProgresso((prev) => Math.max(0, prev - 1))

  // Callback unificado para FileUpload
  const handleUploadingChange = (isUploading: boolean) => {
    if (isUploading) {
      handleUploadStart()
    } else {
      handleUploadEnd()
    }
  }

  // Buscar nome da torcida quando ela vem pré-selecionada via prop
  useEffect(() => {
    if (!initialTorcidaId || torcidaNome) return
    fetch(`/api/torcidas/buscar?id=${initialTorcidaId}`)
      .then(r => r.json())
      .then(d => {
        const t = d.torcidas?.[0]
        if (t) setTorcidaNome(t.nome)
      })
      .catch(() => {})
  }, [initialTorcidaId, torcidaNome])

  // Notificar componente pai quando houver mudança nos uploads
  useEffect(() => {
    onUploadingChange?.(uploadsEmProgresso > 0)
  }, [uploadsEmProgresso, onUploadingChange])

  // Callback para quando uma torcida é selecionada
  const handleTorcidaSelect = (torcidaId: string, torcida: Torcida) => {
    setSelectedTorcidaId(torcidaId)
    setTorcidaNome(torcida.nome)
    setValue('torcida_id', torcidaId)
    onTorcidaChange?.(torcidaId)
    // Limpar tipo de mensalidade anterior ao trocar de torcida
    setValue('tipo_mensalidade_id', '')
  }

  const handleBuscarResponsavel = async () => {
    if (!cpfResponsavel || !selectedTorcidaId) {
      toast.error('Digite o CPF do responsável e selecione uma torcida')
      return
    }
    setIsSearchingCpf(true)
    setResponsavelEncontrado(null)
    setResponsavelNaoEncontrado(false)
    try {
      const cpfLimpo = cpfResponsavel.replace(/\D/g, '')
      const res = await fetch(`/api/cadastro/buscar-responsavel?cpf=${cpfLimpo}&torcida_id=${selectedTorcidaId}`)
      const data = await res.json()
      if (res.ok && data.responsavel) {
        setResponsavelEncontrado(data.responsavel)
        setValue('nome_responsavel', data.responsavel.nome_completo)
        setValue('responsavel_id', data.responsavel.id)
      } else {
        setResponsavelNaoEncontrado(true)
      }
    } catch {
      setResponsavelNaoEncontrado(true)
    } finally {
      setIsSearchingCpf(false)
    }
  }

  // Buscar tipos de mensalidade da API quando torcida é selecionada
  useEffect(() => {
    const fetchTiposMensalidade = async () => {
      // Se não há torcida selecionada, limpar tipos
      if (!selectedTorcidaId) {
        setTiposMensalidade([])
        return
      }

      setIsLoadingTipos(true)

      try {
        const tiposRes = await fetch(`/api/tipos-mensalidade?torcida_id=${selectedTorcidaId}`)

        if (!tiposRes.ok) {
          throw new Error('Erro ao carregar tipos de mensalidade')
        }

        const data = await tiposRes.json()
        const tipos = data.tipos || []
        setTiposMensalidade(tipos)
        // Auto-selecionar primeiro tipo se campo estiver vazio
        if (tipos.length > 0 && !getValues('tipo_mensalidade_id')) {
          setValue('tipo_mensalidade_id', tipos[0].id)
        }
      } catch (error) {
        console.error('Erro ao buscar tipos de mensalidade:', error)
        toast.error('Erro ao carregar tipos de mensalidade. Tente recarregar a página.')
      } finally {
        setIsLoadingTipos(false)
      }
    }

    fetchTiposMensalidade()
  }, [selectedTorcidaId, getValues, setValue])

  // Sincronizar quando initialTorcidaId mudar (ex: carregamento assíncrono do parent)
  useEffect(() => {
    if (initialTorcidaId && initialTorcidaId !== selectedTorcidaId) {
      setSelectedTorcidaId(initialTorcidaId)
      setValue('torcida_id', initialTorcidaId)
    }
  }, [initialTorcidaId, selectedTorcidaId, setValue])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Documentos e Validação</h2>
        <p className="text-sm text-muted-foreground">
          Última etapa! Envie seus documentos e crie sua senha de acesso
        </p>
      </div>

      <div className="space-y-6">
        {/* Alerta se for menor de idade */}
        {eMenor && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium mb-1">Menor de 18 anos detectado</p>
                <p>
                  Como você é menor de idade, será necessário o preenchimento de
                  dados adicionais do responsável legal e envio do termo de
                  menoridade assinado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Seção: Seleção de Torcida */}
        <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
          <div className="flex items-center gap-2 text-sm font-medium text-torcida-laranja">
            <Users className="w-4 h-4" />
            <span>Escolha sua Torcida</span>
          </div>

          <Controller
            name="torcida_id"
            control={control}
            render={({ field }) => (
              <SelecaoTorcida
                value={field.value || selectedTorcidaId || undefined}
                onSelect={handleTorcidaSelect}
                onClear={() => {
                  setSelectedTorcidaId('')
                  setValue('torcida_id', '')
                  setValue('tipo_mensalidade_id', '')
                }}
                error={errors.torcida_id?.message as string | undefined}
              />
            )}
          />
        </div>

        {/* Seção: Tipo de Mensalidade (só aparece após selecionar torcida) */}
        {selectedTorcidaId && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-torcida-laranja">
              <FileText className="w-4 h-4" />
              <span>Tipo de Mensalidade</span>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Escolha seu tipo de mensalidade <span className="text-red-500">*</span>
              </label>
              {isLoadingTipos ? (
                <div className="flex items-center justify-center p-4 border rounded-md bg-muted">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Carregando tipos de mensalidade...</span>
                </div>
              ) : tiposMensalidade.length === 0 ? (
                <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    Nenhum tipo de mensalidade disponivel para esta torcida.
                  </p>
                </div>
              ) : (
                <Controller
                  name="tipo_mensalidade_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className={errors.tipo_mensalidade_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposMensalidade.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nome} - R$ {tipo.valor.toFixed(2)}/mes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.tipo_mensalidade_id && (
                <p className="text-sm text-red-600">
                  {errors.tipo_mensalidade_id.message as string}
                </p>
              )}
            </div>

            {/* Resumo do valor */}
            {selectedTipo && (
              <div className="mt-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    {selectedTipo.nome}
                  </span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    R$ {selectedTipo.valor.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  O pagamento da mensalidade será realizado no seu primeiro acesso à plataforma.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Seção: Documentos */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-torcida-laranja">
            <FileText className="w-4 h-4" />
            <span>Documentos</span>
          </div>

          {/* Tipo de Documento */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Tipo de Documento <span className="text-red-500">*</span>
            </label>
            <Controller
              name="tipo_documento"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {requerFrenteVerso && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Este documento requer upload da frente e do verso
              </p>
            )}
          </div>

          {/* Upload Documento - Frente */}
          <Controller
            name="documento_frente_url"
            control={control}
            render={({ field }) => (
              <FileUpload
                tipo="imagem"
                bucket={STORAGE_BUCKETS.DOCUMENTOS_IDENTIDADE}
                label={requerFrenteVerso ? "Documento de Identificação - FRENTE *" : "Documento de Identificação *"}
                onUpload={field.onChange}
                onRemove={() => field.onChange('')}
                onUploadingChange={handleUploadingChange}
                valor={field.value}
              />
            )}
          />
          {errors.documento_frente_url && (
            <p className="text-sm text-red-600">
              {errors.documento_frente_url.message as string}
            </p>
          )}

          {/* Upload Documento - Verso (apenas para RG, CNH, CNI) */}
          {requerFrenteVerso && (
            <>
              <Controller
                name="documento_verso_url"
                control={control}
                render={({ field }) => (
                  <FileUpload
                    tipo="imagem"
                    bucket={STORAGE_BUCKETS.DOCUMENTOS_IDENTIDADE}
                    label="Documento de Identificação - VERSO *"
                    onUpload={field.onChange}
                    onRemove={() => field.onChange('')}
                    onUploadingChange={handleUploadingChange}
                    valor={field.value}
                  />
                )}
              />
              {errors.documento_verso_url && (
                <p className="text-sm text-red-600">
                  {errors.documento_verso_url.message as string}
                </p>
              )}
            </>
          )}

          {/* Tipo de Comprovante */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Tipo de Comprovante de Endereço
            </label>
            <Controller
              name="tipo_comprovante"
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
                    {TIPOS_COMPROVANTE.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Upload Comprovante */}
          <Controller
            name="comprovante_endereco_url"
            control={control}
            render={({ field }) => (
              <FileUpload
                tipo="imagem"
                bucket={STORAGE_BUCKETS.COMPROVANTES_ENDERECO}
                label="Comprovante de Endereço (PDF ou Imagem) *"
                onUpload={field.onChange}
                onRemove={() => field.onChange('')}
                onUploadingChange={handleUploadingChange}
                valor={field.value}
              />
            )}
          />
          {errors.comprovante_endereco_url && (
            <p className="text-sm text-red-600">
              {errors.comprovante_endereco_url.message as string}
            </p>
          )}

          {/* Upload Selfie */}
          <Controller
            name="selfie_url"
            control={control}
            render={({ field }) => (
              <FileUpload
                tipo="imagem"
                bucket={STORAGE_BUCKETS.SELFIES}
                label="Selfie (Foto do Rosto) *"
                onUpload={field.onChange}
                onRemove={() => field.onChange('')}
                onUploadingChange={handleUploadingChange}
                valor={field.value}
              />
            )}
          />
          {errors.selfie_url && (
            <p className="text-sm text-red-600">
              {errors.selfie_url.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Tire uma foto clara do seu rosto para validação de identidade
          </p>
        </div>

        {/* Seção: Assinatura Digital - apenas para maiores de idade */}
        {!eMenor && (
          <div className="space-y-4">
            <Controller
              name="assinatura_url"
              control={control}
              render={({ field }) => (
                <SignatureCanvasPad
                  onSave={field.onChange}
                  valor={field.value}
                />
              )}
            />
            {errors.assinatura_url && (
              <p className="text-sm text-red-600">
                {errors.assinatura_url.message as string}
              </p>
            )}
          </div>
        )}

        {/* Seção CONDICIONAL: Dados do Responsável (se menor) */}
        {eMenor && (
          <div className="space-y-4 p-4 border-2 border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/50">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <Shield className="w-4 h-4" />
              <span>Dados do Responsável Legal</span>
            </div>

            {/* Campos ocultos preenchidos automaticamente */}
            <input type="hidden" {...register('nome_responsavel')} />
            <input type="hidden" {...register('responsavel_id')} />

            <div className="space-y-4">
              {/* CPF do Responsável com busca */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  CPF do Responsável <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Controller
                      name="cpf_responsavel"
                      control={control}
                      render={({ field }) => (
                        <CPFInput
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val)
                            setResponsavelEncontrado(null)
                            setResponsavelNaoEncontrado(false)
                          }}
                          label=""
                          showValidation
                        />
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleBuscarResponsavel}
                    disabled={isSearchingCpf || !selectedTorcidaId}
                    size="sm"
                    className="mb-0.5"
                  >
                    {isSearchingCpf ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Search className="h-4 w-4 mr-1" />
                    )}
                    Buscar
                  </Button>
                </div>
                {errors.cpf_responsavel && (
                  <p className="text-sm text-red-600">
                    {errors.cpf_responsavel.message as string}
                  </p>
                )}
                {responsavelNaoEncontrado && (
                  <p className="text-sm text-red-600">
                    Responsável não encontrado. O CPF deve pertencer a um sócio ativo desta torcida.
                  </p>
                )}
              </div>

              {/* Responsável encontrado: Termo + Assinatura */}
              {responsavelEncontrado && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      ✓ Responsável encontrado: <strong>{responsavelEncontrado.nome_completo}</strong>
                    </p>
                  </div>

                  {/* Termo de Autorização */}
                  <div className="border border-amber-300 dark:border-amber-600 rounded-lg p-4 bg-white dark:bg-gray-900">
                    <p className="text-sm font-bold text-center mb-4 uppercase tracking-wide">
                      Termo de Autorização
                    </p>
                    <p className="text-sm text-justify leading-relaxed">
                      Eu, <strong>{responsavelEncontrado.nome_completo}</strong>, PORTADOR DO CPF
                      NÚMERO <strong>{formatarCPF(cpfResponsavel || '')}</strong>, AUTORIZO E APOIO
                      A PARTICIPAÇÃO DO(A) MENOR DE IDADE{' '}
                      <strong>{getValues('nome_completo') || '___________________'}</strong>,
                      PORTADOR DO CPF NÚMERO{' '}
                      <strong>{formatarCPF(getValues('cpf') || '')}</strong> NA TORCIDA ORGANIZADA{' '}
                      <strong>{torcidaNome || '___________________'}</strong> A PARTIR DA DATA DE
                      APROVAÇÃO DESTE CADASTRO.
                    </p>
                  </div>

                  {/* Assinatura do Responsável */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Assinatura do Responsável <span className="text-red-500">*</span>
                    </p>
                    <Controller
                      name="assinatura_url"
                      control={control}
                      render={({ field }) => (
                        <SignatureCanvasPad
                          onSave={field.onChange}
                          valor={field.value}
                        />
                      )}
                    />
                    {errors.assinatura_url && (
                      <p className="text-sm text-red-600">
                        {errors.assinatura_url.message as string}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seção: Criar Senha */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-torcida-laranja">
            <Shield className="w-4 h-4" />
            <span>Criar Senha de Acesso</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Senha */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  {...register('senha')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className={errors.senha ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-sm text-red-600">
                  {errors.senha.message as string}
                </p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  {...register('confirmar_senha')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  className={errors.confirmar_senha ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmar_senha && (
                <p className="text-sm text-red-600">
                  {errors.confirmar_senha.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Sua senha deve conter:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Mínimo 8 caracteres</li>
              <li>Letra maiúscula e minúscula</li>
              <li>Pelo menos um número</li>
              <li>Pelo menos um caractere especial (@$!%*?&#)</li>
            </ul>
          </div>
        </div>

        {/* Termos de Uso */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Controller
              name="aceita_termos"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="aceita_termos"
                  className="mt-1"
                />
              )}
            />
            <label
              htmlFor="aceita_termos"
              className="text-sm cursor-pointer flex-1"
            >
              Li e aceito os{' '}
              {selectedTorcidaId ? (
                <TermosTorcidaModal
                  torcidaId={selectedTorcidaId}
                  tipoTermo="termos_uso"
                >
                  <button
                    type="button"
                    className="text-torcida-laranja underline hover:text-torcida-laranja/80"
                  >
                    Termos de Uso
                  </button>
                </TermosTorcidaModal>
              ) : (
                <a
                  href="/termos"
                  target="_blank"
                  className="text-torcida-laranja underline hover:text-torcida-laranja/80"
                >
                  Termos de Uso
                </a>
              )}{' '}
              e a{' '}
              {selectedTorcidaId ? (
                <TermosTorcidaModal
                  torcidaId={selectedTorcidaId}
                  tipoTermo="politica_privacidade"
                >
                  <button
                    type="button"
                    className="text-torcida-laranja underline hover:text-torcida-laranja/80"
                  >
                    Politica de Privacidade
                  </button>
                </TermosTorcidaModal>
              ) : (
                <PoliticaPrivacidadeModal>
                  <button
                    type="button"
                    className="text-torcida-laranja underline hover:text-torcida-laranja/80"
                  >
                    Politica de Privacidade
                  </button>
                </PoliticaPrivacidadeModal>
              )}
            </label>
          </div>
          {errors.aceita_termos && (
            <p className="text-sm text-red-600">
              {errors.aceita_termos.message as string}
            </p>
          )}

          {/* Termos de Compra de Ingresso (apenas se torcida selecionada) */}
          {selectedTorcidaId && (
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Controller
                name="aceita_termos_ingresso"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="aceita_termos_ingresso"
                    className="mt-1"
                  />
                )}
              />
              <label
                htmlFor="aceita_termos_ingresso"
                className="text-sm cursor-pointer flex-1"
              >
                Li e aceito os{' '}
                <TermosTorcidaModal
                  torcidaId={selectedTorcidaId}
                  tipoTermo="termos_compra_ingresso"
                >
                  <button
                    type="button"
                    className="text-torcida-laranja underline hover:text-torcida-laranja/80"
                  >
                    Termos de Compra de Ingresso
                  </button>
                </TermosTorcidaModal>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de uploads em progresso */}
      {uploadsEmProgresso > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Aguarde!</strong> {uploadsEmProgresso} arquivo{uploadsEmProgresso > 1 ? 's' : ''} sendo enviado{uploadsEmProgresso > 1 ? 's' : ''}...
            </p>
          </div>
        </div>
      )}

      {/* Info final */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-sm text-green-900 dark:text-green-100">
          <strong>✓ Quase lá!</strong> Após enviar o cadastro, aguarde a aprovação
          do gestor da torcida. Você receberá um email quando seu cadastro for
          aprovado.
        </p>
      </div>
    </div>
  )
}
