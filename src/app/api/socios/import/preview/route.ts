import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { parseCSV, validateCSVRows } from '@/lib/services/import-service'

/**
 * POST /api/socios/import/preview — Analisa CSV e retorna preview com validação
 */

export async function POST(request: NextRequest) {
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

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json({ error: 'Arquivo deve ser um CSV' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 10MB' },
        { status: 400 }
      )
    }

    const csvContent = await file.text()
    const { socios: csvRows, dependentes: csvDependentes, errors: parseErrors } = parseCSV(csvContent)

    if (parseErrors.length > 0 && csvRows.length === 0) {
      return NextResponse.json(
        { error: 'Erro ao processar CSV', details: parseErrors },
        { status: 400 }
      )
    }

    if (csvRows.length === 0) {
      return NextResponse.json({ error: 'Arquivo CSV está vazio' }, { status: 400 })
    }

    const { data: existingSocios, error: sociosError } = await supabaseAdmin
      .from('socios')
      .select('cpf')
      .eq('torcida_id', gestor.torcida_id)

    if (sociosError) {
      return NextResponse.json({ error: 'Erro ao verificar sócios existentes' }, { status: 500 })
    }

    const existingCpfs = new Set(
      ((existingSocios || []) as Array<{ cpf: string }>).map(s => s.cpf)
    )

    const validationResult = await validateCSVRows(csvRows, existingCpfs, csvDependentes)

    const previewRows = validationResult.rows.slice(0, 10).map(row => ({
      row: row.row,
      isValid: row.isValid,
      nome: row.data?.nome_completo || '',
      email: row.data?.email || '',
      cpf: row.data?.cpf || '',
      errors: row.errors.map(e => e.message),
      warnings: row.warnings,
    }))

    return NextResponse.json({
      parseErrors,
      validation: {
        totalRows: validationResult.totalRows,
        validRows: validationResult.validRows,
        invalidRows: validationResult.invalidRows,
        duplicateRows: validationResult.duplicateRows,
        dependentesRows: csvDependentes.length,
      },
      preview: previewRows,
      duplicateCpfs: validationResult.duplicateCpfs.slice(0, 10),
    })
  } catch (error) {
    console.error('Erro na API import preview:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
