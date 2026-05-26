import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  parseCSV,
  validateCSVRows,
  prepareSocioForInsert,
  prepareDependenteForInsert,
} from '@/lib/services/import-service'
import type { ImportResult, ImportRowResult } from '@/types/import'

/**
 * POST /api/socios/import — Executa importação de sócios + dependentes via CSV
 */

const BATCH_SIZE = 50

async function getCodigoReferenciaPrefix(torcidaId: string) {
  const { data: torcidaData, error } = await supabaseAdmin
    .from('torcidas')
    .select('slug')
    .eq('id', torcidaId)
    .single()

  if (error) {
    console.error('Erro ao buscar slug da torcida:', error)
    return 'SOC'
  }

  const rawSlug = torcidaData?.slug?.toUpperCase() || 'SOC'
  const prefix = rawSlug.split('-')[0].slice(0, 5)
  return prefix || 'SOC'
}

function formatCodigoReferencia(prefix: string, index: number) {
  return `${prefix}-${index.toString().padStart(4, '0')}`
}

export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString()
  const results: ImportRowResult[] = []

  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: gestorData, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestorData) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })
    }

    const gestor = gestorData as { id: string; torcida_id: string | null; role: string }

    if (!gestor.torcida_id) {
      return NextResponse.json(
        { error: 'Você precisa estar vinculado a uma torcida para importar sócios' },
        { status: 400 }
      )
    }

    if (gestor.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem importar sócios' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Arquivo CSV não fornecido' }, { status: 400 })
    }

    const csvContent = await file.text()
    const { socios: csvRows, dependentes: csvDependentes, errors: parseErrors } = parseCSV(csvContent)

    if (parseErrors.length > 0 && csvRows.length === 0) {
      return NextResponse.json(
        { error: 'Erro ao processar CSV', details: parseErrors },
        { status: 400 }
      )
    }

    // Buscar CPFs existentes
    const { data: existingSocios } = await supabaseAdmin
      .from('socios')
      .select('cpf')
      .eq('torcida_id', gestor.torcida_id)

    const existingCpfs = new Set(
      ((existingSocios || []) as Array<{ cpf: string }>).map(s => s.cpf)
    )

    const validation = await validateCSVRows(csvRows, existingCpfs, csvDependentes)
    const rowsToImport = validation.rows.filter(r => r.isValid && r.data)

    const countResult = await supabaseAdmin
      .from('socios')
      .select('*', { count: 'exact', head: true })
      .eq('torcida_id', gestor.torcida_id)
      .not('codigo_referencia', 'is', null)

    if (countResult.error) {
      throw new Error('Erro ao calcular sequência de matrícula')
    }

    const existingCount = countResult.count ?? 0
    const prefix = await getCodigoReferenciaPrefix(gestor.torcida_id)
    let nextCodigoIndex = existingCount + 1

    let imported = 0
    let skipped = 0
    let failed = 0

    // Mapa CPF → ID do sócio recém-importado (para vincular dependentes)
    const cpfToSocioId: Record<string, string> = {}

    // --- Importar sócios ---
    for (let i = 0; i < rowsToImport.length; i += BATCH_SIZE) {
      const batch = rowsToImport.slice(i, i + BATCH_SIZE)

      for (const rowResult of batch) {
        const socio = rowResult.data!

        try {
          // Criar usuário Auth com senha aleatória — sócio usará "esqueci a senha"
          const randomPassword =
            Math.random().toString(36).slice(2) +
            Math.random().toString(36).slice(2).toUpperCase() +
            Math.random().toString(36).slice(2)

          const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: socio.email,
            password: randomPassword,
            email_confirm: true,
            user_metadata: {
              nome_completo: socio.nome_completo,
              role: 'socio',
              torcida_id: gestor.torcida_id,
              imported: true,
            },
          })

          if (authErr) {
            if (
              authErr.message.includes('already been registered') ||
              authErr.message.includes('already exists')
            ) {
              results.push({
                row: rowResult.row,
                cpf: socio.cpf,
                nome: socio.nome_completo,
                status: 'skipped',
                error: 'Email já cadastrado no sistema de autenticação',
              })
              skipped++
              continue
            }
            throw new Error(`Erro ao criar usuário Auth: ${authErr.message}`)
          }

          const codigoReferencia =
            socio.matricula?.trim() || formatCodigoReferencia(prefix, nextCodigoIndex++)

          const authUserId = authUser.user?.id || null
          const socioData = prepareSocioForInsert(
            { ...socio, matricula: codigoReferencia },
            gestor.torcida_id,
            authUserId
          )

          const { data: insertedSocio, error: insertError } = await supabaseAdmin
            .from('socios')
            .insert(socioData as never)
            .select('id')
            .single()

          if (insertError) {
            if (authUser.user?.id) await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            throw new Error(`Erro ao inserir sócio: ${insertError.message}`)
          }

          const socioId = (insertedSocio as { id: string } | null)?.id
          if (socioId) cpfToSocioId[socio.cpf] = socioId

          results.push({
            row: rowResult.row,
            cpf: socio.cpf,
            nome: socio.nome_completo,
            status: 'success',
            authUserId: authUser.user?.id,
            socioId,
          })
          imported++
        } catch (err) {
          results.push({
            row: rowResult.row,
            cpf: socio.cpf,
            nome: socio.nome_completo,
            status: 'error',
            error: err instanceof Error ? err.message : 'Erro desconhecido',
          })
          failed++
        }
      }
    }

    // Linhas inválidas → skipped
    for (const row of validation.rows.filter(r => !r.isValid)) {
      results.push({
        row: row.row,
        cpf: row.data?.cpf || '',
        nome: row.data?.nome_completo || '',
        status: 'skipped',
        error: row.errors.map(e => e.message).join('; '),
      })
      skipped++
    }

    // --- Importar dependentes ---
    let dependentesImported = 0

    // Buscar CPFs dos sócios existentes para resolver cpf_titular → id
    const { data: allSocios } = await supabaseAdmin
      .from('socios')
      .select('id, cpf')
      .eq('torcida_id', gestor.torcida_id)

    const socioIdByCpf: Record<string, string> = {}
    for (const s of (allSocios || []) as Array<{ id: string; cpf: string }>) {
      socioIdByCpf[s.cpf] = s.id
    }
    // Também incluir os recém-importados
    for (const [cpf, id] of Object.entries(cpfToSocioId)) {
      socioIdByCpf[cpf] = id
    }

    for (const dep of validation.dependentes) {
      const titularId = socioIdByCpf[dep.cpf_titular]
      if (!titularId) continue // CPF titular não encontrado — pular
      if (!dep.cpf || !dep.nome_completo) continue

      try {
        const depData = prepareDependenteForInsert(dep, gestor.torcida_id, titularId)
        await supabaseAdmin.from('dependentes').insert(depData as never)
        dependentesImported++
      } catch {
        // Falha silenciosa para dependente individual
      }
    }

    // Auditoria
    await supabaseAdmin.from('auditoria').insert({
      usuario_id: gestor.id,
      usuario_tipo: 'gestor',
      torcida_id: gestor.torcida_id,
      acao: 'importacao_socios',
      entidade: 'socios',
      dados_novos: { total: validation.totalRows, imported, skipped, failed, dependentesImported },
    })

    const completedAt = new Date().toISOString()

    const importResult: ImportResult = {
      success: failed === 0,
      totalProcessed: validation.totalRows,
      imported,
      skipped,
      failed,
      dependentesImported,
      results,
      startedAt,
      completedAt,
    }

    return NextResponse.json(importResult)
  } catch (error) {
    console.error('Erro na API import:', error)
    const completedAt = new Date().toISOString()
    return NextResponse.json({
      success: false,
      totalProcessed: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      dependentesImported: 0,
      results,
      startedAt,
      completedAt,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    }, { status: 500 })
  }
}
