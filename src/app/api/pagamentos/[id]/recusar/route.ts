import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { recusarPagamento } from '@/lib/services/pagamento-service'

/**
 * POST /api/pagamentos/[id]/recusar
 * RN010: Recusa de pagamento pelo gestor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pagamentoId } = await params
    const body = await request.json()
    const { motivo } = body

    // Validações
    if (!motivo || motivo.trim().length === 0) {
      return NextResponse.json(
        { error: 'Motivo da recusa é obrigatório' },
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

    // Verificar se usuário é gestor
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json(
        { error: 'Usuário não é gestor' },
        { status: 403 }
      )
    }

    // Buscar pagamento para verificar se é da torcida do gestor
    const { data: pagamento, error: pagamentoError } = await supabaseAdmin
      .from('pagamentos')
      .select('torcida_id, status')
      .eq('id', pagamentoId)
      .single()

    if (pagamentoError || !pagamento) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se pagamento pertence à torcida do gestor
    if (pagamento.torcida_id !== gestor.torcida_id) {
      return NextResponse.json(
        { error: 'Sem permissão para este pagamento' },
        { status: 403 }
      )
    }

    // Verificar se pagamento está em status válido para recusa
    if (pagamento.status !== 'comprovante_enviado') {
      return NextResponse.json(
        { error: 'Pagamento não pode ser recusado neste status' },
        { status: 400 }
      )
    }

    // Recusar pagamento usando o service
    await recusarPagamento(pagamentoId, gestor.id, motivo)

    return NextResponse.json({
      message: 'Pagamento recusado. Sócio notificado via WhatsApp.',
      status: 'recusado'
    })
  } catch (error) {
    console.error('Erro na API recusar pagamento:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
