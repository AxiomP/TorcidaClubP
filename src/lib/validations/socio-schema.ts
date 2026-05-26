/**
 * Schema Zod para validação do formulário de cadastro de sócio
 * Baseado nas regras de negócio RN001-RN004
 */

import { z } from 'zod'
import { validarCPF } from './cpf-validator'
import { PATTERNS } from '@/lib/utils/constants'
import { isMenorDeIdade } from '@/lib/utils/calculate'

// ============================================================================
// STEP 1: DADOS PESSOAIS
// ============================================================================

export const step1Schema = z.object({
  // CPF (RN001)
  cpf: z
    .string()
    .min(11, 'CPF deve ter 11 dígitos')
    .max(14, 'CPF inválido')
    .refine(
      (val) => PATTERNS.CPF.test(val.replace(/\D/g, '')),
      'CPF deve ter 11 dígitos'
    )
    .refine(
      (val) => validarCPF(val),
      'CPF inválido'
    ),

  // Nome completo
  nome_completo: z
    .string()
    .min(3, 'Nome muito curto')
    .max(255, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  // Apelido
  apelido: z
    .string()
    .min(2, 'Apelido muito curto')
    .max(100, 'Apelido muito longo')
    .optional()
    .or(z.literal('')),

  // Data de nascimento (RN029)
  data_nascimento: z.preprocess(
    (val) => {
      // Se é undefined ou null, retornar como está para falhar na validação required
      if (val === undefined || val === null) return undefined

      // Se já é Date e é válida, retornar
      if (val instanceof Date) {
        return isNaN(val.getTime()) ? undefined : val
      }

      // Se é string, tentar converter para Date
      if (typeof val === 'string' && val.trim() !== '') {
        // Detectar DD-MM-YYYY e converter para YYYY-MM-DD
        const ddmmyyyy = val.match(/^(\d{2})-(\d{2})-(\d{4})$/)
        const dateStr = ddmmyyyy ? `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}` : val
        const date = new Date(dateStr)
        return isNaN(date.getTime()) ? undefined : date
      }

      return undefined
    },
    z
      .date({
        message: 'Data de nascimento é obrigatória',
      })
      .max(new Date(), 'Data não pode ser futura')
      .refine(
        (date) => {
          const hoje = new Date()
          const idade = hoje.getFullYear() - date.getFullYear()
          const mesAtual = hoje.getMonth()
          const mesNascimento = date.getMonth()
          const diaAtual = hoje.getDate()
          const diaNascimento = date.getDate()

          // Ajustar idade se ainda não fez aniversário este ano
          const idadeReal =
            mesAtual < mesNascimento ||
            (mesAtual === mesNascimento && diaAtual < diaNascimento)
              ? idade - 1
              : idade

          return idadeReal >= 0 && idadeReal <= 120
        },
        'Data de nascimento inválida'
      )
  ),

  // Gênero
  genero: z.enum(['masculino', 'feminino', 'outro', 'prefiro_nao_informar'], {
    message: 'Selecione um gênero',
  }),

  // Estado Civil
  estado_civil: z.enum([
    'solteiro',
    'casado',
    'divorciado',
    'viuvo',
    'uniao_estavel',
  ]).optional().or(z.literal('')),

  // Número do RG
  numero_rg: z
    .string()
    .max(20, 'Número do RG muito longo')
    .optional()
    .or(z.literal('')),

  // Escolaridade
  escolaridade: z.enum([
    'fundamental_incompleto',
    'fundamental_completo',
    'medio_incompleto',
    'medio_completo',
    'superior_incompleto',
    'superior_completo',
    'pos_graduacao',
    'mestrado',
    'doutorado',
  ]).optional().or(z.literal('')),

  // Profissão
  profissao: z
    .string()
    .max(100, 'Profissão muito longa')
    .optional()
    .or(z.literal('')),

  // Nome da mãe
  nome_mae: z
    .string()
    .min(3, 'Nome da mãe muito curto')
    .max(255, 'Nome da mãe muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras')
    .optional()
    .or(z.literal('')),

  // Nome do pai
  nome_pai: z
    .string()
    .max(255, 'Nome do pai muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]*$/, 'Nome deve conter apenas letras')
    .optional()
    .or(z.literal('')),
})

export type Step1Data = z.infer<typeof step1Schema>

// ============================================================================
// STEP 2: ENDEREÇO E CONTATO
// ============================================================================

export const step2Schema = z.object({
  // Endereço
  endereco_completo: z
    .string()
    .min(5, 'Endereço muito curto')
    .max(255, 'Endereço muito longo'),

  numero: z
    .string()
    .min(1, 'Número é obrigatório')
    .max(10, 'Número muito longo'),

  complemento: z
    .string()
    .max(100, 'Complemento muito longo')
    .optional()
    .or(z.literal('')),

  bairro: z
    .string()
    .min(2, 'Bairro muito curto')
    .max(100, 'Bairro muito longo'),

  cidade: z
    .string()
    .min(2, 'Cidade muito curta')
    .max(100, 'Cidade muito longa'),

  estado: z
    .string()
    .length(2, 'Estado deve ter 2 letras')
    .regex(/^[A-Z]{2}$/, 'Estado inválido'),

  cep: z
    .string()
    .regex(PATTERNS.CEP, 'CEP inválido')
    .optional()
    .or(z.literal('')),

  // Contatos (RN027)
  // NOTA: O campo já armazena apenas dígitos (sem formatação) graças ao handleWhatsAppChange
  whatsapp: z
    .string()
    .min(1, 'WhatsApp é obrigatório')
    .regex(PATTERNS.TELEFONE, 'WhatsApp inválido')
    .refine(
      (num) => {
        // Validar DDD (deve estar entre 11 e 99)
        if (num.length < 2) return false
        const ddd = parseInt(num.substring(0, 2))
        return ddd >= 11 && ddd <= 99
      },
      'DDD inválido'
    )
    .refine(
      (num) => {
        // Números com 11 dígitos (celular) devem começar com 9 após o DDD
        if (num.length === 11) {
          return num.charAt(2) === '9'
        }
        return true
      },
      'Número de celular deve começar com 9'
    ),

  // Email (RN026)
  email: z
    .string()
    .email('Email inválido')
    .min(5, 'Email muito curto')
    .max(255, 'Email muito longo')
    .toLowerCase()
    .trim(),

  // Rede Social (opcional - @usuario)
  rede_social: z
    .string()
    .max(100, 'Rede social muito longa')
    .optional()
    .or(z.literal('')),

  // Contato de emergência (obrigatório)
  contato_emergencia_nome: z
    .string()
    .min(3, 'Nome do contato é obrigatório')
    .max(255, 'Nome muito longo'),

  contato_emergencia_telefone: z
    .string()
    .min(1, 'Telefone do contato é obrigatório')
    .regex(PATTERNS.TELEFONE, 'Telefone inválido'),

  contato_emergencia_parentesco: z
    .string()
    .min(1, 'Parentesco é obrigatório')
    .max(50, 'Parentesco muito longo'),

  // Contatos de emergência adicionais (até 2)
  contatos_emergencia_adicionais: z
    .array(
      z.object({
        nome: z.string().min(3, 'Nome muito curto').max(255, 'Nome muito longo'),
        telefone: z.string().min(1, 'Telefone é obrigatório').regex(PATTERNS.TELEFONE, 'Telefone inválido'),
        parentesco: z.string().min(1, 'Parentesco é obrigatório').max(50, 'Parentesco muito longo'),
      })
    )
    .max(2, 'Máximo de 2 contatos adicionais')
    .optional()
    .default([]),
})

export type Step2Data = z.infer<typeof step2Schema>

// ============================================================================
// STEP 3: INFORMAÇÕES DE SAÚDE
// ============================================================================

export const step3Schema = z.object({
  // Necessidades especiais
  necessidades_especiais: z.boolean().default(false),

  descricao_necessidades: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),

  // Alergias (toggle + texto)
  tem_alergias: z.boolean().default(false),

  alergias: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),

  // Medicação
  usa_medicacao: z.boolean().default(false),

  medicacao_detalhes: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),
})

export type Step3Data = z.infer<typeof step3Schema>

// ============================================================================
// STEP 4: DOCUMENTOS E VALIDAÇÃO
// ============================================================================

export const step4BaseSchema = z.object({
  // Tipo de mensalidade (RN004)
  tipo_mensalidade_id: z
    .string()
    .min(1, 'Selecione um tipo de mensalidade')
    .uuid('Tipo de mensalidade inválido'),

  // Tipo de documento
  tipo_documento: z
    .string()
    .min(1, 'Selecione o tipo de documento')
    .refine(
      (val) => ['rg', 'cnh', 'cni', 'passaporte'].includes(val),
      'Tipo de documento inválido'
    ),

  // URLs dos documentos (preenchidos após upload)
  // Frente do documento (obrigatório para todos)
  documento_frente_url: z
    .string()
    .refine(
      (val) => val === '' || z.string().url().safeParse(val).success,
      'Faça upload da frente do documento'
    )
    .refine((val) => val !== '', 'Faça upload da frente do documento'),

  // Verso do documento (obrigatório para RG, CNH, CNI; opcional para Passaporte)
  documento_verso_url: z
    .string()
    .refine(
      (val) => val === '' || z.string().url().safeParse(val).success,
      'Faça upload do verso do documento'
    )
    .optional()
    .or(z.literal('')),

  comprovante_endereco_url: z
    .string()
    .refine(
      (val) => val === '' || z.string().url().safeParse(val).success,
      'Faça upload do comprovante de endereço'
    )
    .refine((val) => val !== '', 'Faça upload do comprovante de endereço'),

  selfie_url: z
    .string()
    .refine(
      (val) => val === '' || z.string().url().safeParse(val).success,
      'Tire/envie uma selfie'
    )
    .refine((val) => val !== '', 'Tire/envie uma selfie'),

  assinatura_url: z
    .string()
    .refine(
      (val) => val === '' || z.string().url().safeParse(val).success,
      'Desenhe sua assinatura'
    )
    .refine((val) => val !== '', 'Desenhe sua assinatura'),

  // Tipo de comprovante
  tipo_comprovante: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum([
      'conta_luz',
      'conta_agua',
      'conta_telefone',
      'extrato_bancario',
      'contrato_aluguel',
    ]).optional()
  ),

  // Senha para login
  senha: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha muito longa')
    .regex(/[a-z]/, 'Deve conter letra minúscula')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número')
    .regex(/[@$!%*?&#]/, 'Deve conter caractere especial (@$!%*?&#)'),

  confirmar_senha: z.string(),

  // Aceite de termos
  aceita_termos: z
    .boolean()
    .refine((val) => val === true, 'Você deve aceitar os termos'),
})

// Schema para menores de idade (RN003)
export const step4MenorSchema = step4BaseSchema.extend({
  // CPF do responsável
  cpf_responsavel: z
    .string()
    .min(11, 'CPF deve ter 11 dígitos')
    .refine(
      (val) => PATTERNS.CPF.test(val.replace(/\D/g, '')),
      'CPF deve ter 11 dígitos'
    )
    .refine(
      (val) => validarCPF(val),
      'CPF inválido'
    ),

  nome_responsavel: z
    .string()
    .min(3, 'Nome muito curto')
    .max(255, 'Nome muito longo'),

  // ID do responsável encontrado no banco (preenchido automaticamente pelo lookup)
  responsavel_id: z.string().uuid().optional(),

  // Estes campos agora são opcionais — o responsável assina o termo digital
  documento_responsavel_url: z.string().optional().or(z.literal('')),
  termo_menoridade_url: z.string().optional().or(z.literal('')),
})

// Refinamento para validar senhas iguais
const step4SchemaComValidacao = step4BaseSchema.refine(
  (data) => data.senha === data.confirmar_senha,
  {
    message: 'As senhas não conferem',
    path: ['confirmar_senha'],
  }
)

const step4MenorSchemaComValidacao = step4MenorSchema.refine(
  (data) => data.senha === data.confirmar_senha,
  {
    message: 'As senhas não conferem',
    path: ['confirmar_senha'],
  }
)

export type Step4Data = z.infer<typeof step4BaseSchema>
export type Step4MenorData = z.infer<typeof step4MenorSchema>

// ============================================================================
// SCHEMA COMPLETO
// ============================================================================

export const socioCompletoSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4BaseSchema)

export const socioMenorCompletoSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4MenorSchema)

export type SocioCompletoData = z.infer<typeof socioCompletoSchema>
export type SocioMenorCompletoData = z.infer<typeof socioMenorCompletoSchema>

// ============================================================================
// FUNÇÃO HELPER PARA VALIDAÇÃO CONDICIONAL
// ============================================================================

/**
 * Retorna o schema correto baseado se é menor ou não
 */
export function getStep4Schema(dataNascimento: Date | string) {
  const eMenor = isMenorDeIdade(dataNascimento)
  return eMenor ? step4MenorSchemaComValidacao : step4SchemaComValidacao
}

/**
 * Retorna o schema completo baseado se é menor ou não
 */
export function getSocioSchema(dataNascimento: Date | string) {
  const eMenor = isMenorDeIdade(dataNascimento)
  const schema = eMenor ? socioMenorCompletoSchema : socioCompletoSchema
  return schema.refine(
    (data) => data.senha === data.confirmar_senha,
    { message: 'As senhas não conferem', path: ['confirmar_senha'] }
  )
}
