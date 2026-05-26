/**
 * Utilitário para mapeamento de campos CSV para o formato do banco de dados
 * Compatível com o formato de exportação padrão (socios_YYYY-MM-DD.csv)
 */

import type { CSVRawRow, CSVDependenteRow, ImportedSocio, ImportedDependente } from '@/types/import'

/**
 * Limpa CPF removendo pontuação
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Formata telefone para padrão brasileiro
 */
export function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) {
    return digits.slice(2)
  }
  return digits
}

/**
 * Converte string de data para formato ISO (YYYY-MM-DD)
 */
export function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null

  // ISO já formatado
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return isoMatch[0]

  // DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (brMatch) {
    const [, day, month, year] = brMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}

/**
 * Converte gênero para o formato do banco
 */
export function mapGender(genero: string): 'masculino' | 'feminino' | 'outro' | null {
  const n = genero.toUpperCase().trim()
  if (n === 'MASCULINO' || n === 'M' || n === 'MASC') return 'masculino'
  if (n === 'FEMININO' || n === 'F' || n === 'FEM') return 'feminino'
  if (n === 'OUTRO' || n === 'O') return 'outro'
  return null
}

/**
 * Converte status do CSV para o formato do banco
 */
export function mapStatus(
  value: string
): 'pendente' | 'ativo' | 'inadimplente' | 'bloqueado' | 'cancelado' {
  const n = value.toLowerCase().trim()
  if (n === 'ativo') return 'ativo'
  if (n === 'pendente') return 'pendente'
  if (n === 'inadimplente') return 'inadimplente'
  if (n === 'bloqueado') return 'bloqueado'
  if (n === 'cancelado') return 'cancelado'
  return 'ativo'
}

/**
 * Converte valor booleano do CSV (Sim/Não)
 */
export function mapBoolean(value: string): boolean {
  const n = value.toUpperCase().trim()
  return n === 'SIM' || n === 'S' || n === 'TRUE' || n === '1'
}

/**
 * Mapeia uma linha do CSV de exportação para o formato ImportedSocio
 */
export function mapCSVRowToSocio(row: CSVRawRow): ImportedSocio {
  const cpf = cleanCPF(row['CPF'] || '')
  const cidade = row['Cidade']?.trim() || ''
  const estado = row['Estado']?.trim() || ''

  return {
    // Identificação
    matricula: row['Matrícula']?.trim() || null,
    nome_completo: row['Nome Completo']?.trim() || '',
    apelido: null,
    email: row['Email']?.toLowerCase().trim() || '',
    cpf,
    numero_rg: row['Número RG']?.trim() || null,
    tipo_documento: row['Tipo Documento']?.trim() || null,

    // Dados pessoais
    data_nascimento: parseDate(row['Data Nascimento'] || ''),
    genero: mapGender(row['Gênero'] || ''),
    estado_civil: row['Estado Civil']?.trim() || null,
    nome_pai: row['Nome Pai']?.trim() || null,
    nome_mae: row['Nome Mãe']?.trim() || null,

    // Contato
    whatsapp: cleanPhone(row['WhatsApp'] || ''),
    contato_emergencia_nome: row['Contato Emergência']?.trim() || null,
    contato_emergencia_telefone: cleanPhone(row['Tel. Emergência'] || '') || null,

    // Endereço
    endereco_completo: row['Endereço']?.trim() || '',
    numero: row['Número']?.trim() || null,
    complemento: row['Complemento']?.trim() || null,
    bairro: row['Bairro']?.trim() || null,
    cidade,
    estado: estado.length === 2 ? estado.toUpperCase() : '',
    cep: row['CEP']?.trim() || null,

    // Profissional
    profissao: row['Profissão']?.trim() || null,

    // Saúde
    necessidades_especiais: mapBoolean(row['Necessidades Especiais'] || 'Não'),
    descricao_necessidades: row['Desc. Necessidades']?.trim() || null,
    usa_medicacao: mapBoolean(row['Usa Medicação'] || 'Não'),
    medicacao_detalhes: row['Detalhes Medicação']?.trim() || null,
    alergias: row['Alergias']?.trim() || null,

    // Financeiro / Status
    status: mapStatus(row['Status'] || 'ativo'),
    ranking: row['Ranking']?.trim() || null,
    meses_pendentes: parseInt(row['Meses Pendentes'] || '0', 10) || 0,
    valor_divida_total: parseFloat(row['Valor Dívida'] || '0') || 0,
    data_aprovacao: parseDate(row['Data Aprovação'] || ''),
    membro_desde: parseDate(row['Membro Desde'] || ''),

    // Metadata
    origem: row['Origem']?.trim() || null,
    tipo_mensalidade_nome: null,
  }
}

/**
 * Mapeia uma linha da seção de dependentes para ImportedDependente
 */
export function mapCSVDependenteRow(row: CSVDependenteRow): ImportedDependente {
  const statusRaw = row['Status']?.toLowerCase().trim()
  const status: ImportedDependente['status'] =
    statusRaw === 'cancelado' ? 'cancelado' :
    statusRaw === 'inativo' ? 'inativo' : 'ativo'

  return {
    cpf_titular: cleanCPF(row['CPF Titular'] || ''),
    nome_completo: row['Nome Dependente']?.trim() || '',
    cpf: cleanCPF(row['CPF Dependente'] || ''),
    data_nascimento: parseDate(row['Data Nascimento'] || ''),
    e_menor: mapBoolean(row['É Menor'] || 'Não'),
    status,
    email: row['Email']?.toLowerCase().trim() || null,
  }
}

/**
 * Colunas obrigatórias no CSV de exportação
 */
export const REQUIRED_CSV_COLUMNS = [
  'Nome Completo',
  'CPF',
  'Email',
  'WhatsApp',
] as const

/**
 * Verifica se o CSV tem todas as colunas obrigatórias
 */
export function validateCSVColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_CSV_COLUMNS.filter(col => !headers.includes(col))
  return { valid: missing.length === 0, missing }
}
