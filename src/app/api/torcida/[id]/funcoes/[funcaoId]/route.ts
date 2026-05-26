import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { funcaoUpdateSchema } from '@/lib/validations/funcao-schema'

/**
 * API: Função Individual
 * PUT /api/torcida/[id]/funcoes/[funcaoId] - Atualizar função
 * DELETE /api/torcida/[id]/funcoes/[funcaoId] - Excluir função
 */

interface RouteParams {
  params: Promise<{ id: string; funcaoId: string }>
}

// PUT - Atualizar função
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: torcidaId, funcaoId } = await params
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
        { error: 'Apenas administradores podem editar funções' },
        { status: 403 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validationResult = funcaoUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Atualizar função
    const { data: funcao, error: updateError } = await supabase
      .from('funcoes_socio')
      .update(validationResult.data)
      .eq('id', funcaoId)
      .eq('torcida_id', torcidaId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar função:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar função' },
        { status: 500 }
      )
    }

    if (!funcao) {
      return NextResponse.json(
        { error: 'Função não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Função atualizada com sucesso',
      funcao,
    })
  } catch (error) {
    console.error('Erro na API função PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir função
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: torcidaId, funcaoId } = await params
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
        { error: 'Apenas administradores podem excluir funções' },
        { status: 403 }
      )
    }

    // Excluir função
    const { error: deleteError } = await supabase
      .from('funcoes_socio')
      .delete()
      .eq('id', funcaoId)
      .eq('torcida_id', torcidaId)

    if (deleteError) {
      console.error('Erro ao excluir função:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir função' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Função excluída com sucesso',
    })
  } catch (error) {
    console.error('Erro na API função DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
