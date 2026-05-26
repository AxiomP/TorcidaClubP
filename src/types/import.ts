/**
 * Tipos para importação de sócios via CSV
 */

// Colunas do CSV de exportação padrão (=== SÓCIOS ===)
export interface CSVRawRow {
  'Matrícula': string
  'Nome Completo': string
  'CPF': string
  'Email': string
  'WhatsApp': string
  'Data Nascimento': string
  'Gênero': string
  'Estado Civil': string
  'Profissão': string
  'Endereço': string
  'Número': string
  'Complemento': string
  'Bairro': string
  'Cidade': string
  'Estado': string
  'CEP': string
  'Status': string
  'Ranking': string
  'Membro Desde': string
  'Data Cadastro': string
  'Data Aprovação': string
  'Meses Pendentes': string
  'Valor Dívida': string
  'Necessidades Especiais': string
  'Desc. Necessidades': string
  'Usa Medicação': string
  'Detalhes Medicação': string
  'Alergias': string
  'Nome Mãe': string
  'Nome Pai': string
  'Contato Emergência': string
  'Tel. Emergência': string
  'Tipo Documento': string
  'Número RG': string
  'Origem': string
  'Importado': string
  [key: string]: string
}

// Colunas da seção de dependentes (=== DEPENDENTES ===)
export interface CSVDependenteRow {
  'CPF Titular': string
  'Nome Dependente': string
  'CPF Dependente': string
  'Data Nascimento': string
  'É Menor': string
  'Status': string
  'Email': string
  [key: string]: string
}

// Dados normalizados após parsing — sócio
export interface ImportedSocio {
  // Identificação
  matricula: string | null
  nome_completo: string
  apelido: string | null
  email: string
  // senha removida — senha aleatória gerada no momento da importação
  cpf: string
  numero_rg: string | null
  tipo_documento: string | null

  // Dados pessoais
  data_nascimento: string | null
  genero: 'masculino' | 'feminino' | 'outro' | null
  estado_civil: string | null
  nome_pai: string | null
  nome_mae: string | null

  // Contato
  whatsapp: string
  contato_emergencia_nome: string | null
  contato_emergencia_telefone: string | null

  // Endereço
  endereco_completo: string
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string
  estado: string
  cep: string | null

  // Profissional
  profissao: string | null

  // Saúde
  necessidades_especiais: boolean
  descricao_necessidades: string | null
  usa_medicacao: boolean
  medicacao_detalhes: string | null
  alergias: string | null

  // Financeiro / Status
  status: 'pendente' | 'ativo' | 'inadimplente' | 'bloqueado' | 'cancelado'
  ranking: string | null
  meses_pendentes: number
  valor_divida_total: number
  data_aprovacao: string | null
  membro_desde: string | null

  // Metadata
  origem: string | null
  tipo_mensalidade_nome: string | null
}

// Dados normalizados após parsing — dependente
export interface ImportedDependente {
  cpf_titular: string
  nome_completo: string
  cpf: string
  data_nascimento: string | null
  e_menor: boolean
  status: 'ativo' | 'inativo' | 'cancelado'
  email: string | null
}

// Erro de validação por linha
export interface ValidationError {
  row: number
  field: string
  message: string
  value?: string
}

// Resultado da validação de uma linha
export interface RowValidationResult {
  row: number
  isValid: boolean
  data: ImportedSocio | null
  errors: ValidationError[]
  warnings: string[]
}

// Resultado geral da validação
export interface ValidationResult {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
  rows: RowValidationResult[]
  duplicateCpfs: string[]
  dependentes: ImportedDependente[]
}

// Status de um item durante importação
export type ImportItemStatus = 'pending' | 'importing' | 'success' | 'error' | 'skipped'

// Resultado da importação de uma linha
export interface ImportRowResult {
  row: number
  cpf: string
  nome: string
  status: ImportItemStatus
  error?: string
  authUserId?: string
  socioId?: string
}

// Resultado final da importação
export interface ImportResult {
  success: boolean
  totalProcessed: number
  imported: number
  skipped: number
  failed: number
  dependentesImported: number
  results: ImportRowResult[]
  startedAt: string
  completedAt: string
}

// Progresso da importação (para UI)
export interface ImportProgress {
  phase: 'parsing' | 'validating' | 'importing' | 'completed' | 'error'
  current: number
  total: number
  message: string
}
