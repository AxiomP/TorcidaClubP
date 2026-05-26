import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { linkCreateSchema } from '@/lib/validations/link-schema'

/**
 * API: Links da Torcida
 * GET /api/torcida/[id]/links - Listar links
 * POST /api/torcida/[id]/links - Criar novo link
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Listar links da torcida
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

    // Buscar links
    const { data: links, error: linksError } = await supabase
      .from('links')
      .select('*')
      .eq('torcida_id', torcidaId)
      .order('ordem', { ascending: true })

    if (linksError) {
      console.error('Erro ao buscar links:', linksError)
      return NextResponse.json(
        { error: 'Erro ao buscar links' },
        { status: 500 }
      )
    }

    return NextResponse.json(links || [])
  } catch (error) {
    console.error('Erro na API links GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo link
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
        { error: 'Apenas administradores podem criar links' },
        { status: 403 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validationResult = linkCreateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Criar link
    const { data: link, error: createError } = await supabase
      .from('links')
      .insert({
        torcida_id: torcidaId,
        ...validationResult.data,
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar link:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Link criado com sucesso',
      link,
    }, { status: 201 })
  } catch (error) {
    console.error('Erro na API links POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
