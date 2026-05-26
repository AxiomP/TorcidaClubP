import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { enviarEmailIngressoAprovado } from '@/lib/services/email-service'

function getBatchPrefix(codigo?: string | null) {
  if (!codigo) return null
  return codigo.includes('-ticket-') ? codigo.split('-ticket-')[0] : null
}

/**
 * POST /api/ingressos/[id]/aprovar
 * Aprovação de comprovante de ingresso pelo gestor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ingressoId } = await params

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor) {
      return NextResponse.json({ error: 'Usuário não é gestor' }, { status: 403 })
    }

    // Buscar ingresso
    const { data: ingresso } = await supabaseAdmin
      .from('compras_ingressos')
      .select('id, status, evento_id, socio_id, codigo_validacao')
      .eq('id', ingressoId)
      .maybeSingle()

    if (!ingresso) {
      return NextResponse.json({ error: 'Ingresso não encontrado' }, { status: 404 })
    }

    // Verificar que o evento pertence à torcida do gestor
    const { data: evento } = await supabaseAdmin
      .from('eventos')
      .select('torcida_id')
      .eq('id', ingresso.evento_id)
      .maybeSingle()

    if (!evento || evento.torcida_id !== gestor.torcida_id) {
      return NextResponse.json({ error: 'Sem permissão para este ingresso' }, { status: 403 })
    }

    if (ingresso.status !== 'comprovante_enviado') {
      return NextResponse.json(
        { error: 'Ingresso não pode ser aprovado neste status' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('compras_ingressos')
      .update({
        status: 'aprovado',
        aprovado_por: gestor.id,
      })

    const batchPrefix = getBatchPrefix(ingresso.codigo_validacao)
    
    if (batchPrefix) {
      // Atualiza todos do lote, garantindo que pertençam ao mesmo sócio e evento
      query = query
        .like('codigo_validacao', `${batchPrefix}-%`)
        .eq('socio_id', ingresso.socio_id)
        .eq('evento_id', ingresso.evento_id)
    } else {
      // Se não tiver lote, atualiza apenas o ID isolado
      query = query.eq('id', ingressoId)
    }

    const { error: updateError } = await query

    if (updateError) {
      console.error('Erro ao aprovar ingresso:', updateError)
      return NextResponse.json({ error: 'Erro ao aprovar ingresso' }, { status: 500 })
    }

    // Enviar email de confirmação (fire-and-forget)
    if (ingresso.socio_id) {
      supabaseAdmin
        .from('socios')
        .select('email, nome_completo, apelido')
        .eq('id', ingresso.socio_id)
        .maybeSingle()
        .then(({ data: socio }) => {
          if (socio?.email) {
            const nome = socio.apelido || socio.nome_completo
            enviarEmailIngressoAprovado(socio.email, { nome })
              .catch(err => console.error('Erro ao enviar email ingresso aprovado:', err))
          }
        })
    }

    return NextResponse.json({ message: 'Ingresso aprovado com sucesso!', status: 'aprovado' })
  } catch (error) {
    console.error('Erro na API aprovar ingresso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
