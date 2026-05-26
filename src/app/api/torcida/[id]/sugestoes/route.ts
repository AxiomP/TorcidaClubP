import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sugestaoCreateSchema } from '@/lib/validations/sugestao-schema'
import { sendEmail } from '@/lib/services/email-service'

/**
 * API: Sugestões/Feedback da Plataforma
 * POST /api/torcida/[id]/sugestoes - Enviar sugestão
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Enviar sugestão
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

    // Verificar se o gestor tem acesso a esta torcida
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor || gestor.torcida_id !== torcidaId) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esta torcida' },
        { status: 403 }
      )
    }

    // Parse e validar dados
    const body = await request.json()
    const validationResult = sugestaoCreateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // Criar sugestão (usa admin para bypassar RLS, auth já validada acima)
    const { data: sugestao, error: createError } = await supabaseAdmin
      .from('sugestoes')
      .insert({
        torcida_id: torcidaId,
        gestor_id: gestor.id,
        ...validationResult.data,
        status: 'pendente',
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao enviar sugestão:', createError)
      return NextResponse.json(
        { error: 'Erro ao enviar sugestão' },
        { status: 500 }
      )
    }

    // Enviar notificação por email (falha silenciosa para não bloquear a resposta)
    sendEmail(
      'contato@torcidacluboficial.com.br',
      `[Feedback] ${validationResult.data.tipo}: ${validationResult.data.titulo}`,
      `<p><b>Tipo:</b> ${validationResult.data.tipo}</p>
       <p><b>Torcida ID:</b> ${torcidaId}</p>
       <p><b>Gestor ID:</b> ${gestor.id}</p>
       <p><b>Título:</b> ${validationResult.data.titulo}</p>
       <p><b>Descrição:</b> ${validationResult.data.descricao}</p>`
    ).catch(err => console.error('Erro ao enviar email de feedback:', err))

    return NextResponse.json({
      message: 'Sugestão enviada com sucesso! Agradecemos seu feedback.',
      sugestao,
    }, { status: 201 })
  } catch (error) {
    console.error('Erro na API sugestões POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
