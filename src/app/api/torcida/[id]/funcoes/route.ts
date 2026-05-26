import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { funcaoCreateSchema } from '@/lib/validations/funcao-schema'

/**
 * API: Funções/Cargos da Torcida
 * GET /api/torcida/[id]/funcoes - Listar funções
 * POST /api/torcida/[id]/funcoes - Criar nova função
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Listar funções da torcida
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: torcidaId } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o gestor tem acesso a esta torcida
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor || gestor.torcida_id !== torcidaId) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esta torcida' },
        { status: 403 }
      )
    }

    // Buscar funções
    const { data: funcoes, error: funcoesError } = await supabase
      .from('funcoes_socio')
      .select('*')
      .eq('torcida_id', torcidaId)
      .order('ordem', { ascending: true })

    if (funcoesError) {
      console.error('Erro ao buscar funções:', funcoesError)
      return NextResponse.json(
        { error: 'Erro ao buscar funções' },
        { status: 500 }
      )
    }

    return NextResponse.json(funcoes || [])
  } catch (error) {
    console.error('Erro na API funções GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova função
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: torcidaId } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o gestor tem acesso e é admin
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor || gestor.torcida_id !== torcidaId) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esta torcida' },
        { status: 403 }
      )
    }

    if (gestor.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar funções' },
        { status: 403 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validationResult = funcaoCreateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Criar função
    const { data: funcao, error: createError } = await supabase
      .from('funcoes_socio')
      .insert({
        torcida_id: torcidaId,
        ...validationResult.data,
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar função:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar função' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Função criada com sucesso',
      funcao,
    }, { status: 201 })
  } catch (error) {
    console.error('Erro na API funções POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
