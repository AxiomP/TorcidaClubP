import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { enviarEmailComprovanteRecebido } from '@/lib/services/email-service'

/**
 * POST /api/pagamentos/[id]/comprovante
 * RN010: Upload de comprovante de pagamento pelo sócio
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pagamentoId } = await params
    const body = await request.json()
    const { comprovante_url } = body

    // Validações
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

    // Buscar pagamento
    const { data: pagamento, error: pagamentoError } = await supabaseAdmin
      .from('pagamentos')
      .select('*')
      .eq('id', pagamentoId)
      .single()

    if (pagamentoError || !pagamento) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Buscar dados do sócio dono do pagamento
    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('auth_user_id, nome_completo, apelido, email')
      .eq('id', pagamento.socio_id)
      .single()

    if (!socio) {
      return NextResponse.json({ error: 'Sem permissão para este pagamento' }, { status: 403 })
    }

    const ehDono = socio.auth_user_id === user.id

    // Se não é o dono direto, verificar se o usuário logado é o titular responsável pelo sócio
    let ehTitularResponsavel = false
    if (!ehDono && socio.auth_user_id) {
      const { data: depRecord } = await supabaseAdmin
        .from('dependentes')
        .select('socio_titular_id')
        .eq('auth_user_id', socio.auth_user_id)
        .eq('torcida_id', pagamento.torcida_id)
        .eq('status', 'ativo')
        .maybeSingle()

      if (depRecord?.socio_titular_id) {
        const { data: titular } = await supabaseAdmin
          .from('socios')
          .select('auth_user_id')
          .eq('id', depRecord.socio_titular_id)
          .maybeSingle()

        ehTitularResponsavel = titular?.auth_user_id === user.id
      }
    }

    if (!ehDono && !ehTitularResponsavel) {
      return NextResponse.json(
        { error: 'Sem permissão para este pagamento' },
        { status: 403 }
      )
    }

    // Verificar se pagamento já foi aprovado
    if (pagamento.status === 'confirmado') {
      return NextResponse.json(
        { error: 'Pagamento já foi confirmado' },
        { status: 400 }
      )
    }

    // Atualizar pagamento com comprovante (admin client para bypassar RLS após verificação manual de ownership)
    const { error: updateError } = await supabaseAdmin
      .from('pagamentos')
      .update({
        comprovante_url,
        status: 'comprovante_enviado',
        updated_at: new Date().toISOString()
      })
      .eq('id', pagamentoId)

    if (updateError) {
      console.error('Erro ao atualizar pagamento:', updateError)
      return NextResponse.json(
        { error: 'Erro ao enviar comprovante' },
        { status: 500 }
      )
    }

    // Notificar gestor via WhatsApp sobre novo comprovante
    // Nota: A tabela gestores não possui campo whatsapp atualmente
    // TODO: Adicionar campo whatsapp à tabela gestores ou buscar de outra fonte
    try {
      // Buscar gestores da torcida
      const { data: gestores } = await supabaseAdmin
        .from('gestores')
        .select('id, nome_completo, email')
        .eq('torcida_id', pagamento.torcida_id)
        .eq('ativo', true)

      if (gestores && gestores.length > 0) {
        // Log para rastrear que há gestores para notificar
        // A notificação via WhatsApp requer o campo whatsapp na tabela gestores
        console.log(`Novo comprovante: ${gestores.length} gestor(es) para notificar`)
      }
    } catch (notifyError) {
      // Não bloqueia o fluxo se notificação falhar
      console.error('Erro ao notificar gestor:', notifyError)
    }

    // Enviar email de confirmação (fire-and-forget)
    if (socio.email) {
      const nome = socio.apelido || socio.nome_completo
      enviarEmailComprovanteRecebido(socio.email, { nome })
        .catch(err => console.error('Erro ao enviar email comprovante recebido:', err))
    }

    return NextResponse.json({
      message: 'Comprovante enviado com sucesso! Aguarde a aprovação do gestor.',
      status: 'comprovante_enviado'
    })
  } catch (error) {
    console.error('Erro na API comprovante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
