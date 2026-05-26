import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { beneficioUpdateSchema } from '@/lib/validations/beneficio-schema'

/**
 * API: Benefício Individual
 * PUT /api/torcida/[id]/beneficios/[beneficioId] - Atualizar benefício
 * DELETE /api/torcida/[id]/beneficios/[beneficioId] - Excluir benefício
 */

interface RouteParams {
  params: Promise<{ id: string; beneficioId: string }>
}

// PUT - Atualizar benefício
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: torcidaId, beneficioId } = await params
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
        { error: 'Apenas administradores podem editar benefícios' },
        { status: 403 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validationResult = beneficioUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Atualizar benefício
    const { data: beneficio, error: updateError } = await supabase
      .from('beneficios')
      .update(validationResult.data)
      .eq('id', beneficioId)
      .eq('torcida_id', torcidaId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar benefício:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar benefício' },
        { status: 500 }
      )
    }

    if (!beneficio) {
      return NextResponse.json(
        { error: 'Benefício não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Benefício atualizado com sucesso',
      beneficio,
    })
  } catch (error) {
    console.error('Erro na API benefício PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir benefício
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: torcidaId, beneficioId } = await params
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
        { error: 'Apenas administradores podem excluir benefícios' },
        { status: 403 }
      )
    }

    // Excluir benefício
    const { error: deleteError } = await supabase
      .from('beneficios')
      .delete()
      .eq('id', beneficioId)
      .eq('torcida_id', torcidaId)

    if (deleteError) {
      console.error('Erro ao excluir benefício:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir benefício' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Benefício excluído com sucesso',
    })
  } catch (error) {
    console.error('Erro na API benefício DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
