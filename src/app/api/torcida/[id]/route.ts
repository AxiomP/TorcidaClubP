import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { torcidaUpdateSchema } from '@/lib/validations/torcida-schema'

/**
 * API: Configurações da Torcida
 * GET /api/torcida/[id] - Buscar dados da torcida
 * PUT /api/torcida/[id] - Atualizar dados da torcida
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar dados da torcida
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
      .select('torcida_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json(
        { error: 'Gestor não encontrado' },
        { status: 404 }
      )
    }

    if (gestor.torcida_id !== id) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esta torcida' },
        { status: 403 }
      )
    }

    // Buscar dados da torcida (usando admin client para bypassar RLS)
    const { data: torcida, error: torcidaError } = await supabaseAdmin
      .from('torcidas')
      .select('*')
      .eq('id', id)
      .single()

    if (torcidaError) {
      console.error('Erro ao buscar torcida:', torcidaError)

      // Torcida não encontrada (0 rows) - erro PGRST116
      if (torcidaError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Torcida não encontrada. Pode ter sido removida do sistema.' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Erro ao buscar dados da torcida' },
        { status: 500 }
      )
    }

    if (!torcida) {
      return NextResponse.json(
        { error: 'Torcida não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(torcida)
  } catch (error) {
    console.error('Erro na API torcida GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar dados da torcida
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
      .select('torcida_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json(
        { error: 'Gestor não encontrado' },
        { status: 404 }
      )
    }

    if (gestor.torcida_id !== id) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta torcida' },
        { status: 403 }
      )
    }

    // Apenas admin pode editar configurações
    if (gestor.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem editar as configurações' },
        { status: 403 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validationResult = torcidaUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    }

    // Atualizar torcida (usando admin client pois permissões já foram validadas acima)
    const { data: torcida, error: updateError } = await supabaseAdmin
      .from('torcidas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar torcida:', updateError)

      // Verificar se é erro de slug duplicado
      if (updateError.code === '23505' && updateError.message.includes('slug')) {
        return NextResponse.json(
          { error: 'Este slug já está em uso por outra torcida' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Erro ao atualizar dados da torcida' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Configurações atualizadas com sucesso',
      torcida,
    })
  } catch (error) {
    console.error('Erro na API torcida PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
