import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { linkUpdateSchema } from '@/lib/validations/link-schema'

/**
 * API: Link Individual
 * PUT /api/torcida/[id]/links/[linkId] - Atualizar link
 * DELETE /api/torcida/[id]/links/[linkId] - Excluir link
 */

interface RouteParams {
  params: Promise<{ id: string; linkId: string }>
}

// PUT - Atualizar link
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: torcidaId, linkId } = await params
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
        { error: 'Apenas administradores podem editar links' },
        { status: 403 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validationResult = linkUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Atualizar link
    const { data: link, error: updateError } = await supabase
      .from('links')
      .update(validationResult.data)
      .eq('id', linkId)
      .eq('torcida_id', torcidaId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar link:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar link' },
        { status: 500 }
      )
    }

    if (!link) {
      return NextResponse.json(
        { error: 'Link não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Link atualizado com sucesso',
      link,
    })
  } catch (error) {
    console.error('Erro na API link PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir link
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: torcidaId, linkId } = await params
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
        { error: 'Apenas administradores podem excluir links' },
        { status: 403 }
      )
    }

    // Excluir link
    const { error: deleteError } = await supabase
      .from('links')
      .delete()
      .eq('id', linkId)
      .eq('torcida_id', torcidaId)

    if (deleteError) {
      console.error('Erro ao excluir link:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Link excluído com sucesso',
    })
  } catch (error) {
    console.error('Erro na API link DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
