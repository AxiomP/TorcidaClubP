import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { beneficioCreateSchema } from '@/lib/validations/beneficio-schema'

/**
 * API: Benefícios da Torcida
 * GET /api/torcida/[id]/beneficios - Listar benefícios
 * POST /api/torcida/[id]/beneficios - Criar novo benefício
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Listar benefícios da torcida
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

    // Buscar benefícios
    const { data: beneficios, error: beneficiosError } = await supabase
      .from('beneficios')
      .select('*')
      .eq('torcida_id', torcidaId)
      .order('ordem', { ascending: true })

    if (beneficiosError) {
      console.error('Erro ao buscar benefícios:', beneficiosError)
      return NextResponse.json(
        { error: 'Erro ao buscar benefícios' },
        { status: 500 }
      )
    }

    return NextResponse.json(beneficios || [])
  } catch (error) {
    console.error('Erro na API benefícios GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo benefício
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
        { error: 'Apenas administradores podem criar benefícios' },
        { status: 403 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validationResult = beneficioCreateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Criar benefício
    const { data: beneficio, error: createError } = await supabase
      .from('beneficios')
      .insert({
        torcida_id: torcidaId,
        ...validationResult.data,
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar benefício:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar benefício' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Benefício criado com sucesso',
      beneficio,
    }, { status: 201 })
  } catch (error) {
    console.error('Erro na API benefícios POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
