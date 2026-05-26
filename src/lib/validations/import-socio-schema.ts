/**
 * Schema de validação para sócios importados
 */

import { z } from 'zod'

function isValidCPFFormat(cpf: string): boolean {
  return cpf.replace(/\D/g, '').length === 11
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const importedSocioSchema = z.object({
  // Obrigatórios
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  email: z.string().min(1, 'Email é obrigatório').refine(isValidEmail, 'Email inválido'),
  cpf: z.string().min(1, 'CPF é obrigatório').refine(isValidCPFFormat, 'CPF deve ter 11 dígitos'),
  whatsapp: z
    .string()
    .min(1, 'WhatsApp é obrigatório')
    .transform(val => val.replace(/\D/g, ''))
    .transform(val => (val.startsWith('55') && val.length > 11 ? val.slice(2) : val))
    .refine(val => /^\d{10,11}$/.test(val), 'WhatsApp deve ter 10 ou 11 dígitos'),

  // Identificação opcional
  apelido: z.string().max(100).nullable(),
  numero_rg: z.string().max(30).nullable(),
  tipo_documento: z.string().max(20).nullable(),

  // Dados pessoais
  data_nascimento: z.string().nullable(),
  genero: z.enum(['masculino', 'feminino', 'outro']).nullable(),
  estado_civil: z.string().max(30).nullable(),
  nome_pai: z.string().max(255).nullable(),
  nome_mae: z.string().max(255).nullable(),

  // Contato emergência
  contato_emergencia_nome: z.string().max(255).nullable(),
  contato_emergencia_telefone: z
    .string()
    .transform(val => val.replace(/\D/g, ''))
    .transform(val => (val.startsWith('55') && val.length > 11 ? val.slice(2) : val))
    .refine(val => val === '' || /^\d{10,11}$/.test(val), 'Telefone inválido')
    .nullable(),

  // Endereço
  endereco_completo: z.string().max(500).default(''),
  numero: z.string().max(20).nullable(),
  complemento: z.string().max(100).nullable(),
  bairro: z.string().max(100).nullable(),
  cidade: z.string().max(100).default(''),
  estado: z.string().max(2).default(''),
  cep: z.string().max(10).nullable(),

  // Profissional
  profissao: z.string().max(100).nullable(),

  // Saúde
  necessidades_especiais: z.boolean().default(false),
  descricao_necessidades: z.string().max(500).nullable(),
  usa_medicacao: z.boolean().default(false),
  medicacao_detalhes: z.string().max(500).nullable(),
  alergias: z.string().max(500).nullable(),

  // Status
  status: z
    .enum(['pendente', 'ativo', 'inadimplente', 'bloqueado', 'cancelado'])
    .default('ativo'),
  ranking: z.string().max(50).nullable(),
  meses_pendentes: z.number().int().min(0).default(0),
  valor_divida_total: z.number().min(0).default(0),
  data_aprovacao: z.string().nullable(),
  membro_desde: z.string().nullable(),

  // Metadata
  origem: z.string().max(100).nullable(),
  tipo_mensalidade_nome: z.string().max(100).nullable(),
})

export type ImportedSocioValidated = z.infer<typeof importedSocioSchema>

export function validateImportedSocio(
  data: unknown,
  _rowNumber?: number
): { success: true; data: ImportedSocioValidated } | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = importedSocioSchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return {
    success: false,
    errors: result.error.issues.map(err => ({ field: err.path.join('.'), message: err.message })),
  }
}
