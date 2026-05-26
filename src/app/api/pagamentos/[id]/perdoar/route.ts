import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { perdoarDivida } from '@/lib/services/pagamento-service'

/**
 * POST /api/pagamentos/[id]/perdoar
 * RN009: Perdão de dívida pelo gestor
 *
 * Nota: Perdoa TODA a dívida do sócio, não apenas um pagamento específico
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // O id aqui na verdade é o ID do sócio, não do pagamento
    const { id: socioId } = await params

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

    // Buscar sócio para verificar se é da torcida do gestor
    const { data: socio, error: socioError } = await supabaseAdmin
      .from('socios')
      .select('torcida_id, nome_completo, meses_pendentes, valor_divida_total')
      .eq('id', socioId)
      .single()

    if (socioError || !socio) {
      return NextResponse.json(
        { error: 'Sócio não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se sócio pertence à torcida do gestor
    if (socio.torcida_id !== gestor.torcida_id) {
      return NextResponse.json(
        { error: 'Sem permissão para este sócio' },
        { status: 403 }
      )
    }

    // Verificar se há dívida para perdoar
    if (socio.meses_pendentes === 0 || socio.valor_divida_total === 0) {
      return NextResponse.json(
        { error: 'Sócio não possui dívidas pendentes' },
        { status: 400 }
      )
    }

    // Perdoar dívida usando o service
    await perdoarDivida(socioId, gestor.id)

    return NextResponse.json({
      message: `Dívida de ${socio.nome_completo} foi perdoada com sucesso!`,
      meses_perdoados: socio.meses_pendentes,
      valor_perdoado: socio.valor_divida_total
    })
  } catch (error) {
    console.error('Erro na API perdoar dívida:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
