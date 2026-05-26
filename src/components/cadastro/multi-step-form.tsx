'use client'

/**
 * Formulário multi-etapa para cadastro de sócios
 * Integra todos os 4 steps com validação e navegação
 */

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  getSocioSchema,
} from '@/lib/validations/socio-schema'
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import { Step1DadosPessoais } from './step-1-dados-pessoais'
import { Step2Endereco } from './step-2-endereco'
import { Step3Saude } from './step-3-saude'
import { Step4Documentos } from './step-4-documentos'
import { ProgressBar } from './progress-bar'
import { FormNavigation } from './form-navigation'
import { Card } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'

const STEPS = [
  { number: 1, title: 'Dados Pessoais', description: 'Informações básicas' },
  { number: 2, title: 'Endereço', description: 'Localização e contato' },
  { number: 3, title: 'Saúde', description: 'Informações médicas' },
  { number: 4, title: 'Documentos', description: 'Validação final' },
]

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [torcidaId, setTorcidaId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Capturar torcida_id da URL (opcional - usuário pode selecionar no Step 4)
  // Aceita tanto ?torcida_id= quanto ?torcida= (link de compartilhamento do gestor)
  useEffect(() => {
    const id = searchParams.get('torcida_id') || searchParams.get('torcida')
    setTorcidaId(id || null)
    if (id) {
      console.log('[Cadastro] torcida_id pré-selecionada:', id)
    }
  }, [searchParams])

  // Criar resolver dinâmico que escolhe o schema baseado na data de nascimento
  const dynamicResolver: Resolver<FieldValues> = async (data, context, options) => {
    // Determinar qual schema usar baseado na data de nascimento
    let schema
    if (data.data_nascimento && data.data_nascimento instanceof Date) {
      schema = getSocioSchema(data.data_nascimento)
    } else {
      // Usar schema padrão para adulto se não houver data
      schema = getSocioSchema(new Date('2000-01-01'))
    }

    // Usar zodResolver com o schema apropriado
    const resolver = zodResolver(schema)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return resolver(data as any, context, options as any)
  }

  const methods = useForm({
    resolver: dynamicResolver,
    mode: 'onChange',
    defaultValues: {
      // Step 1
      cpf: '',
      nome_completo: '',
      apelido: '',
      data_nascimento: undefined as Date | undefined,
      genero: '',
      numero_rg: '',
      estado_civil: '',
      escolaridade: '',
      profissao: '',
      nome_mae: '',
      nome_pai: '',

      // Step 2
      endereco_completo: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      whatsapp: '',
      email: '',
      rede_social: '',
      contato_emergencia_nome: '',
      contato_emergencia_telefone: '',
      contato_emergencia_parentesco: '',
      contatos_emergencia_adicionais: [],

      // Step 3
      necessidades_especiais: false,
      descricao_necessidades: '',
      tem_alergias: false,
      alergias: '',
      usa_medicacao: false,
      medicacao_detalhes: '',

      // Step 4
      tipo_mensalidade_id: '',
      tipo_documento: '' as string, // Será validado como enum quando preenchido
      documento_frente_url: '',
      documento_verso_url: '',
      tipo_comprovante: '',
      comprovante_endereco_url: '',
      selfie_url: '',
      assinatura_url: '',
      senha: '',
      confirmar_senha: '',
      aceita_termos: false,
      aceita_termos_ingresso: false,
      torcida_id: '',

      // Step 4 - Menor de idade (condicional)
      nome_responsavel: '',
      cpf_responsavel: '',
      documento_responsavel_url: '',
      termo_menoridade_url: '',
    },
  })

  const { trigger, getValues, handleSubmit } = methods

  // Validar step atual antes de avançar
  const validateStep = async (step: number): Promise<boolean> => {
    let fields: string[] = []

    switch (step) {
      case 1:
        fields = [
          'cpf',
          'numero_rg',
          'nome_completo',
          'data_nascimento',
          'genero',
          'estado_civil',
          'apelido',
          'escolaridade',
          'profissao',
          'nome_mae',
          'nome_pai',
        ]
        break

      case 2:
        fields = [
          'endereco_completo',
          'numero',
          'complemento',
          'bairro',
          'cidade',
          'estado',
          'cep',
          'whatsapp',
          'email',
          'rede_social',
          'contato_emergencia_nome',
          'contato_emergencia_telefone',
          'contato_emergencia_parentesco',
          'contatos_emergencia_adicionais',
        ]
        break

      case 3:
        fields = [
          'necessidades_especiais',
          'descricao_necessidades',
          'tem_alergias',
          'alergias',
          'usa_medicacao',
          'medicacao_detalhes',
        ]
        break

      case 4:
        // Step 4 tem validação condicional baseada na idade
        const dataNascimento = getValues('data_nascimento')
        if (!dataNascimento) {
          toast.error('Data de nascimento não encontrada')
          return false
        }

        fields = [
          'tipo_mensalidade_id',
          'tipo_documento',
          'documento_frente_url',
          'documento_verso_url',
          'comprovante_endereco_url',
          'selfie_url',
          'assinatura_url',
          'senha',
          'confirmar_senha',
          'aceita_termos',
          // Campos condicionais são validados pelo schema
          'nome_responsavel',
          'cpf_responsavel',
          'documento_responsavel_url',
          'termo_menoridade_url',
        ]
        break

      default:
        return true
    }

    // Trigger validação apenas dos campos do step atual
    const isValid = await trigger(fields as string[])

    if (!isValid) {
      toast.error('Por favor, corrija os erros antes de continuar')
    }

    return isValid
  }

  // Navegar para próximo step
  const handleNext = async () => {
    // Só bloqueia se for step 4 E tiver upload em progresso
    if (currentStep === 4 && isUploading) {
      toast.error('Aguarde o término dos uploads antes de continuar')
      return
    }

    try {
      const isValid = await validateStep(currentStep)
      if (isValid) {
        setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
        window.scrollTo(0, 0)
      }
    } catch (err) {
      console.error('[Cadastro] Erro ao avançar step:', err)
      toast.error('Erro inesperado. Tente novamente.')
    }
  }

  // Navegar para step anterior
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  // Mapeamento de campo → step para navegação em caso de erro
  const fieldToStep: Record<string, number> = {
    // Step 1
    cpf: 1, nome_completo: 1, apelido: 1, data_nascimento: 1, genero: 1,
    numero_rg: 1, estado_civil: 1, escolaridade: 1, profissao: 1, nome_mae: 1, nome_pai: 1,
    // Step 2
    endereco_completo: 2, numero: 2, complemento: 2, bairro: 2, cidade: 2,
    estado: 2, cep: 2, whatsapp: 2, email: 2, rede_social: 2,
    contato_emergencia_nome: 2, contato_emergencia_telefone: 2,
    contato_emergencia_parentesco: 2, contatos_emergencia_adicionais: 2,
    // Step 3
    necessidades_especiais: 3, descricao_necessidades: 3, tem_alergias: 3,
    alergias: 3, usa_medicacao: 3, medicacao_detalhes: 3,
    // Step 4
    tipo_mensalidade_id: 4, torcida_id: 4, tipo_documento: 4,
    documento_frente_url: 4, documento_verso_url: 4, tipo_comprovante: 4,
    comprovante_endereco_url: 4, selfie_url: 4, assinatura_url: 4,
    senha: 4, confirmar_senha: 4, aceita_termos: 4, aceita_termos_ingresso: 4,
    nome_responsavel: 4, cpf_responsavel: 4, documento_responsavel_url: 4,
    termo_menoridade_url: 4,
  }

  // Handler para quando a validação do formulário falha
  const onInvalid = (errors: FieldErrors<FieldValues>) => {
    console.error('[Cadastro] Erros de validação:', errors)

    // Encontrar o primeiro campo com erro e seu step
    const errorFields = Object.keys(errors)
    let targetStep = currentStep
    let firstErrorMessage = 'Por favor, corrija os erros no formulário'

    if (errorFields.length > 0) {
      // Encontrar o step do primeiro erro
      const steps = errorFields.map((field) => fieldToStep[field] || 4)
      targetStep = Math.min(...steps)

      // Pegar a mensagem do primeiro erro
      const firstField = errorFields.find((f) => (fieldToStep[f] || 4) === targetStep) || errorFields[0]
      const fieldError = errors[firstField]
      if (fieldError && typeof fieldError.message === 'string') {
        firstErrorMessage = fieldError.message
      }
    }

    // Navegar para o step com erro
    if (targetStep !== currentStep) {
      setCurrentStep(targetStep)
      window.scrollTo(0, 0)
    }

    toast.error(`Etapa ${targetStep}: ${firstErrorMessage}`)
  }

  // Submit final
  const onSubmit = async (data: FieldValues) => {
    // Verificar se há uploads em progresso
    if (isUploading) {
      toast.error('Aguarde o término dos uploads antes de enviar')
      return
    }

    // Verificar se torcida e tipo_mensalidade foram selecionados
    if (!data.tipo_mensalidade_id) {
      toast.error('Selecione uma torcida e um tipo de mensalidade na Etapa 4')
      setCurrentStep(4)
      window.scrollTo(0, 0)
      return
    }

    // Validar TODOS os steps antes de enviar
    for (let step = 1; step <= 4; step++) {
      const isValid = await validateStep(step)
      if (!isValid) {
        toast.error(`Por favor, preencha corretamente a etapa ${step}`)
        setCurrentStep(step) // Volta para a etapa com erro
        window.scrollTo(0, 0)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Validar schema completo
      const dataNascimento = data.data_nascimento
      const schema = getSocioSchema(dataNascimento)

      const validatedData = schema.parse(data)

      // Enviar para API
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Erro ao criar cadastro')
      }

      const result = await response.json()

      // Sucesso!
      toast.success('Cadastro enviado com sucesso!')

      // Redirecionar para página de confirmação
      router.push(`/cadastro/confirmacao?id=${result.id}`)
    } catch (error) {
      console.error('Erro ao enviar cadastro:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao enviar cadastro. Tente novamente.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar step atual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1DadosPessoais />
      case 2:
        return <Step2Endereco />
      case 3:
        return <Step3Saude />
      case 4:
        return <Step4Documentos torcidaId={torcidaId} onUploadingChange={setIsUploading} />
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="w-full max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar
            currentStep={currentStep}
            totalSteps={STEPS.length}
            steps={STEPS}
          />
        </div>

        {/* Step Content */}
        <Card className="p-6 sm:p-8">
          {renderStep()}

          {/* Navigation */}
          <FormNavigation
            currentStep={currentStep}
            totalSteps={STEPS.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isFirstStep={currentStep === 1}
            isLastStep={currentStep === STEPS.length}
            isSubmitting={isSubmitting}
            canProceed={!(currentStep === 4 && isUploading)}
          />
        </Card>

        {/* Informações adicionais */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Dúvidas? Entre em contato com a torcida através do WhatsApp ou email
          </p>
        </div>
      </form>
    </FormProvider>
  )
}
