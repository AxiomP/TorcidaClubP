import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { enviarEmailComprovanteRecusado } from '@/lib/services/email-service'

function getBatchPrefix(codigo?: string | null) {
  if (!codigo) return null
  return codigo.includes('-ticket-') ? codigo.split('-ticket-')[0] : null
}

/**
 * POST /api/ingressos/[id]/recusar
 * Recusa de comprovante de ingresso pelo gestor
 * Envia notificação por email para o sócio
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ingressoId } = await params
    const body = await request.json()
    const { motivo } = body

    if (!motivo || motivo.trim().length === 0) {
      return NextResponse.json({ error: 'Motivo da recusa é obrigatório' }, { status: 400 })
    }

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

    const { data: ingresso } = await supabaseAdmin
      .from('compras_ingressos')
      .select('id, status, evento_id, socio_id, dependente_id, tipo_ingresso, nome_adicional, codigo_validacao')
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
        { error: 'Ingresso não pode ser recusado neste status' },
        { status: 400 }
      )
    }

    const query = supabaseAdmin
      .from('compras_ingressos')
      .update({
        status: 'recusado',
        motivo_recusa: motivo.trim(),
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
      console.error('Erro ao recusar ingresso:', updateError)
      return NextResponse.json({ error: 'Erro ao recusar ingresso' }, { status: 500 })
    }

    // Enviar email de recusa (fire-and-forget — não bloqueia a resposta)
    try {
      let emailDestino: string | null = null
      let nomeSocio: string | null = null

      // Buscar email do sócio titular ou dependente responsável
      if (ingresso.socio_id) {
        const { data: socio } = await supabaseAdmin
          .from('socios')
          .select('email, nome_completo')
          .eq('id', ingresso.socio_id)
          .maybeSingle()

        if (socio) {
          emailDestino = socio.email
          nomeSocio = socio.nome_completo
        }
      } else if (ingresso.dependente_id) {
        const { data: dependente } = await supabaseAdmin
          .from('dependentes')
          .select('email, nome_completo, socio_titular_id')
          .eq('id', ingresso.dependente_id)
          .maybeSingle()

        if (dependente) {
          emailDestino = dependente.email
          nomeSocio = dependente.nome_completo

          // Se dependente não tem email, tentar buscar do titular
          if (!emailDestino && dependente.socio_titular_id) {
            const { data: titular } = await supabaseAdmin
              .from('socios')
              .select('email, nome_completo')
              .eq('id', dependente.socio_titular_id)
              .maybeSingle()

            if (titular) {
              emailDestino = titular.email
              nomeSocio = titular.nome_completo
            }
          }
        }
      }

      // Enviar email se temos destinatário
      if (emailDestino && nomeSocio) {
        enviarEmailComprovanteRecusado(emailDestino, {
          nome: nomeSocio,
          motivo: motivo.trim(),
        }).catch((error) => {
          console.error('Erro ao enviar email de recusa de ingresso:', error)
        })
      }
    } catch (error) {
      console.error('Erro ao preparar email de recusa:', error)
      // Não retornar erro aqui - a recusa já foi feita com sucesso
    }

    return NextResponse.json({ message: 'Ingresso recusado.', status: 'recusado' })
  } catch (error) {
    console.error('Erro na API recusar ingresso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
