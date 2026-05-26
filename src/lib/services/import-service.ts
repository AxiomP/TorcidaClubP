/**
 * Serviço de importação de sócios via CSV
 */

import Papa from 'papaparse'
import type {
  CSVRawRow,
  CSVDependenteRow,
  ImportedSocio,
  ImportedDependente,
  ValidationResult,
  RowValidationResult,
  ValidationError,
} from '@/types/import'
import {
  mapCSVRowToSocio,
  mapCSVDependenteRow,
  validateCSVColumns,
} from '@/lib/utils/csv-field-mapper'
import { validateImportedSocio } from '@/lib/validations/import-socio-schema'

/**
 * Divide o conteúdo CSV nas seções === SÓCIOS === e === DEPENDENTES ===
 */
function splitCSVSections(csvContent: string): {
  sociosSection: string
  dependentesSection: string
} {
  const content = csvContent.replace(/^\uFEFF/, '') // remove BOM
  const SOCIOS_SEP = '=== SÓCIOS ==='
  const DEPS_SEP = '=== DEPENDENTES ==='

  const sociosIdx = content.indexOf(SOCIOS_SEP)
  const depsIdx = content.indexOf(DEPS_SEP)

  if (sociosIdx === -1) {
    // Formato sem marcadores de seção — assume que o conteúdo inteiro é sócios
    return { sociosSection: content.trim(), dependentesSection: '' }
  }

  const sociosStart = sociosIdx + SOCIOS_SEP.length
  const sociosEnd = depsIdx !== -1 ? depsIdx : content.length
  const sociosSection = content.slice(sociosStart, sociosEnd).trim()

  const dependentesSection =
    depsIdx !== -1
      ? content.slice(depsIdx + DEPS_SEP.length).trim()
      : ''

  return { sociosSection, dependentesSection }
}

/**
 * Faz o parse do CSV no formato padrão de exportação.
 * Retorna sócios, dependentes e eventuais erros de parsing.
 */
export function parseCSV(csvContent: string): {
  socios: CSVRawRow[]
  dependentes: ImportedDependente[]
  errors: string[]
} {
  const errors: string[] = []
  const { sociosSection, dependentesSection } = splitCSVSections(csvContent)

  // --- Parse da seção de sócios ---
  const sociosResult = Papa.parse<CSVRawRow>(sociosSection, {
    header: true,
    skipEmptyLines: true,
  })

  sociosResult.errors.forEach(err => {
    if (err.row !== undefined) errors.push(`Linha ${err.row + 2}: ${err.message}`)
  })

  const headers = sociosResult.meta.fields || []
  const columnValidation = validateCSVColumns(headers)
  if (!columnValidation.valid) {
    errors.push(`Colunas obrigatórias faltando: ${columnValidation.missing.join(', ')}`)
  }

  // --- Parse da seção de dependentes (opcional) ---
  let dependentes: ImportedDependente[] = []
  if (dependentesSection) {
    const depsResult = Papa.parse<CSVDependenteRow>(dependentesSection, {
      header: true,
      skipEmptyLines: true,
    })
    dependentes = depsResult.data
      .filter(row => row['CPF Dependente']?.trim() && row['Nome Dependente']?.trim())
      .map(mapCSVDependenteRow)
  }

  return { socios: sociosResult.data, dependentes, errors }
}

/**
 * Valida todas as linhas de sócios do CSV
 */
export async function validateCSVRows(
  rows: CSVRawRow[],
  existingCpfs: Set<string>,
  dependentes: ImportedDependente[] = []
): Promise<ValidationResult> {
  const results: RowValidationResult[] = []
  const duplicateCpfs: string[] = []
  const seenCpfs = new Set<string>()

  let validRows = 0
  let invalidRows = 0
  let duplicateRows = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // +2 porque linha 1 é header

    const mappedData = mapCSVRowToSocio(row)
    const errors: ValidationError[] = []
    const warnings: string[] = []

    const cpf = mappedData.cpf

    if (existingCpfs.has(cpf)) {
      duplicateRows++
      duplicateCpfs.push(cpf)
      results.push({
        row: rowNumber,
        isValid: false,
        data: mappedData,
        errors: [{ row: rowNumber, field: 'cpf', message: 'CPF já cadastrado no sistema', value: cpf }],
        warnings: [`CPF ${cpf} já existe e será ignorado`],
      })
      continue
    }

    if (seenCpfs.has(cpf)) {
      errors.push({ row: rowNumber, field: 'cpf', message: 'CPF duplicado no arquivo CSV', value: cpf })
    } else {
      seenCpfs.add(cpf)
    }

    const validation = validateImportedSocio(mappedData, rowNumber)
    if (!validation.success) {
      validation.errors.forEach(err => {
        errors.push({ row: rowNumber, field: err.field, message: err.message })
      })
    }

    if (!mappedData.data_nascimento) warnings.push('Data de nascimento não identificada')
    if (!mappedData.endereco_completo) warnings.push('Endereço não informado')

    const isValid = errors.length === 0
    if (isValid) validRows++
    else invalidRows++

    results.push({ row: rowNumber, isValid, data: mappedData, errors, warnings })
  }

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicateRows,
    rows: results,
    duplicateCpfs,
    dependentes,
  }
}

/**
 * Prepara dados do sócio para inserção no banco
 */
export function prepareSocioForInsert(
  socio: ImportedSocio,
  torcidaId: string,
  authUserId: string | null
) {
  return {
    torcida_id: torcidaId,
    auth_user_id: authUserId,
    codigo_referencia: socio.matricula,
    cpf: socio.cpf,
    nome_completo: socio.nome_completo,
    apelido: socio.apelido,
    email: socio.email,
    data_nascimento: socio.data_nascimento || new Date().toISOString().split('T')[0],
    genero: socio.genero,
    estado_civil: socio.estado_civil,
    whatsapp: socio.whatsapp,
    endereco_completo: socio.endereco_completo,
    numero: socio.numero,
    complemento: socio.complemento,
    bairro: socio.bairro,
    cidade: socio.cidade,
    estado: socio.estado,
    cep: socio.cep,
    status: socio.status,
    ranking: socio.ranking,
    membro_desde: socio.membro_desde || new Date().toISOString(),
    data_aprovacao: socio.data_aprovacao,
    meses_pendentes: socio.meses_pendentes,
    valor_divida_total: socio.valor_divida_total,
    numero_rg: socio.numero_rg,
    tipo_documento: socio.tipo_documento,
    profissao: socio.profissao,
    nome_mae: socio.nome_mae,
    nome_pai: socio.nome_pai,
    contato_emergencia_nome: socio.contato_emergencia_nome,
    contato_emergencia_telefone: socio.contato_emergencia_telefone,
    necessidades_especiais: socio.necessidades_especiais,
    descricao_necessidades: socio.descricao_necessidades,
    usa_medicacao: socio.usa_medicacao,
    medicacao_detalhes: socio.medicacao_detalhes,
    alergias: socio.alergias,
    origem: socio.origem,
    importado: true,
    data_importacao: new Date().toISOString(),
  }
}

/**
 * Prepara dados do dependente para inserção no banco
 */
export function prepareDependenteForInsert(
  dep: ImportedDependente,
  torcidaId: string,
  socioTitularId: string
) {
  return {
    torcida_id: torcidaId,
    socio_titular_id: socioTitularId,
    nome_completo: dep.nome_completo,
    cpf: dep.cpf,
    data_nascimento: dep.data_nascimento || new Date().toISOString().split('T')[0],
    e_menor: dep.e_menor,
    status: dep.status,
    email: dep.email,
  }
}
