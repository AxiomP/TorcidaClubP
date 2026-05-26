import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { aprovarPagamento } from '@/lib/services/pagamento-service'

/**
 * POST /api/pagamentos/[id]/aprovar
 * RN010: Aprovação de pagamento pelo gestor
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pagamentoId } = await params

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

    // Verificar se pagamento está em status válido para aprovação
    if (pagamento.status !== 'comprovante_enviado' && pagamento.status !== 'recusado') {
      return NextResponse.json(
        { error: 'Pagamento não pode ser aprovado neste status' },
        { status: 400 }
      )
    }

    // Aprovar pagamento usando o service
    await aprovarPagamento(pagamentoId, gestor.id)

    // Liberar primeiro acesso se for o primeiro pagamento do sócio
    const { data: pag } = await supabaseAdmin
      .from('pagamentos')
      .select('socio_id')
      .eq('id', pagamentoId)
      .single()

    if (pag?.socio_id) {
      const { data: socio } = await supabaseAdmin
        .from('socios')
        .select('primeiro_acesso_feito')
        .eq('id', pag.socio_id)
        .single()

      if (socio?.primeiro_acesso_feito === false) {
        await supabaseAdmin
          .from('socios')
          .update({ primeiro_acesso_feito: true })
          .eq('id', pag.socio_id)
      }
    }

    return NextResponse.json({
      message: 'Pagamento aprovado com sucesso!',
      status: 'confirmado'
    })
  } catch (error) {
    console.error('Erro na API aprovar pagamento:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
