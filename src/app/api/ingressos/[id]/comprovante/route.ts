import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function getBatchPrefix(codigo?: string | null) {
  if (!codigo) return null
  return codigo.includes('-ticket-') ? codigo.split('-ticket-')[0] : null
}

/**
 * POST /api/ingressos/[id]/comprovante
 * Envia comprovante de pagamento para um ingresso (compras_ingressos)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ingressoId } = await params
    const body = await request.json()
    const { comprovante_url } = body

    if (!comprovante_url) {
      return NextResponse.json(
        { error: 'Comprovante é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar ingresso
    const { data: ingresso, error: ingressoError } = await supabaseAdmin
      .from('compras_ingressos')
      .select('*, codigo_validacao')
      .eq('id', ingressoId)
      .single()

    if (ingressoError || !ingresso) {
      return NextResponse.json(
        { error: 'Ingresso não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o sócio é dono do ingresso
    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('auth_user_id')
      .eq('id', ingresso.socio_id)
      .single()

    if (!socio || socio.auth_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para este ingresso' },
        { status: 403 }
      )
    }

    // Verificar se ingresso já foi aprovado
    if (ingresso.status === 'aprovado') {
      return NextResponse.json(
        { error: 'Ingresso já foi aprovado' },
        { status: 400 }
      )
    }

    // Atualizar todos os ingressos do lote, se houver lote definido
    const query = supabaseAdmin.from('compras_ingressos').update({
      comprovante_url,
      status: 'comprovante_enviado',
    })

    const batchPrefix = getBatchPrefix(ingresso.codigo_validacao)
    if (batchPrefix) {
      query.like('codigo_validacao', `${batchPrefix}-%`)
        .eq('socio_id', ingresso.socio_id)
        .eq('evento_id', ingresso.evento_id)
        .in('status', ['pendente', 'comprovante_enviado'])
    } else {
      query.eq('id', ingressoId)
    }

    const { error: updateError } = await query

    if (updateError) {
      console.error('Erro ao atualizar ingresso:', updateError)
      return NextResponse.json(
        { error: 'Erro ao enviar comprovante' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Comprovante enviado com sucesso! Aguarde a aprovação do gestor.',
      status: 'comprovante_enviado',
    })
  } catch (error) {
    console.error('Erro na API comprovante ingresso:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
