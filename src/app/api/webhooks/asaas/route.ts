import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/webhooks/asaas
 * Recebe eventos do Asaas e atualiza o status de assinatura do gestor.
 *
 * Eventos tratados:
 *   PAYMENT_RECEIVED / PAYMENT_CONFIRMED            → assinatura_status = 'ativa' (+ 30 dias)
 *   PAYMENT_OVERDUE                                 → assinatura_status = 'vencida'
 *   PIX_AUTOMATIC_AUTHORIZATION_AUTHORIZED          → assinatura_status = 'ativa' (+ 30 dias)
 *   PIX_AUTOMATIC_AUTHORIZATION_REFUSED/CANCELLED   → assinatura_status = 'vencida', limpa auth_id
 *   PIX_AUTOMATIC_PAYMENT_CONFIRMED/RECEIVED        → estende assinatura_validade em +30 dias
 *
 * Sempre retorna 200 — o Asaas não deve receber 4xx/5xx para não retentar.
 */
export async function POST(request: NextRequest) {
  try {
    // Validar token de acesso
    const token = request.headers.get('asaas-access-token')
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

    if (!expectedToken || token !== expectedToken) {
      console.warn('[asaas-webhook] Token inválido recebido:', token)
      // Retornar 200 mesmo assim para evitar retentativas do Asaas
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const body = await request.json()
    const event: string = body?.event ?? ''

    // ── Eventos de pagamento normal (débito/crédito/PIX avulso) ──────────────

    if (['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event)) {
      const payment = body?.payment ?? {}
      const gestorId: string | undefined = payment?.externalReference

      if (!gestorId) {
        console.warn('[asaas-webhook] PAYMENT evento sem externalReference:', event)
        return NextResponse.json({ received: true }, { status: 200 })
      }

      const validade = new Date()
      validade.setDate(validade.getDate() + 30)

      const { data: gestorAtualizado, error } = await supabaseAdmin
        .from('gestores')
        .update({
          assinatura_status: 'ativa',
          assinatura_validade: validade.toISOString(),
        })
        .eq('id', gestorId)
        .select('torcida_id')
        .maybeSingle()

      if (error) {
        console.error('[asaas-webhook] Erro ao ativar assinatura:', error)
      } else {
        console.log(`[asaas-webhook] Assinatura ativada — gestor ${gestorId}`)
        // Restaurar torcida para ativo se estava suspensa
        if (gestorAtualizado?.torcida_id) {
          await supabaseAdmin
            .from('torcidas')
            .update({ status: 'ativo' })
            .eq('id', gestorAtualizado.torcida_id)
            .eq('status', 'suspenso')
        }
      }

    } else if (event === 'PAYMENT_OVERDUE') {
      const payment = body?.payment ?? {}
      const gestorId: string | undefined = payment?.externalReference

      if (!gestorId) {
        console.warn('[asaas-webhook] PAYMENT_OVERDUE sem externalReference')
        return NextResponse.json({ received: true }, { status: 200 })
      }

      const { data: gestorVencido, error } = await supabaseAdmin
        .from('gestores')
        .update({ assinatura_status: 'vencida' })
        .eq('id', gestorId)
        .select('torcida_id')
        .maybeSingle()

      if (error) {
        console.error('[asaas-webhook] Erro ao marcar assinatura vencida:', error)
      } else {
        console.log(`[asaas-webhook] Assinatura vencida — gestor ${gestorId}`)
        // Suspender torcida automaticamente
        if (gestorVencido?.torcida_id) {
          await supabaseAdmin
            .from('torcidas')
            .update({ status: 'suspenso' })
            .eq('id', gestorVencido.torcida_id)
          console.log(`[asaas-webhook] Torcida ${gestorVencido.torcida_id} suspensa por inadimplência`)
        }
      }

    // ── Eventos de autorização PIX automático ────────────────────────────────

    } else if (event === 'PIX_AUTOMATIC_AUTHORIZATION_AUTHORIZED') {
      const authorization = body?.authorization ?? {}
      const gestorId: string | undefined = authorization?.externalReference

      if (!gestorId) {
        console.warn('[asaas-webhook] PIX_AUTH_AUTHORIZED sem externalReference')
        return NextResponse.json({ received: true }, { status: 200 })
      }

      const validade = new Date()
      validade.setDate(validade.getDate() + 30)

      const { data: gestorPix, error } = await supabaseAdmin
        .from('gestores')
        .update({
          assinatura_status: 'ativa',
          assinatura_validade: validade.toISOString(),
        })
        .eq('id', gestorId)
        .select('torcida_id')
        .maybeSingle()

      if (error) {
        console.error('[asaas-webhook] Erro ao ativar assinatura PIX automático:', error)
      } else {
        console.log(`[asaas-webhook] Assinatura ativada via PIX automático — gestor ${gestorId}`)
        if (gestorPix?.torcida_id) {
          await supabaseAdmin
            .from('torcidas')
            .update({ status: 'ativo' })
            .eq('id', gestorPix.torcida_id)
            .eq('status', 'suspenso')
        }
      }

    } else if (
      event === 'PIX_AUTOMATIC_AUTHORIZATION_REFUSED' ||
      event === 'PIX_AUTOMATIC_AUTHORIZATION_CANCELLED'
    ) {
      const authorization = body?.authorization ?? {}
      const gestorId: string | undefined = authorization?.externalReference

      if (!gestorId) {
        console.warn(`[asaas-webhook] ${event} sem externalReference`)
        return NextResponse.json({ received: true }, { status: 200 })
      }

      const { data: gestorRecusado, error } = await supabaseAdmin
        .from('gestores')
        .update({
          assinatura_status: 'vencida',
          asaas_pix_auth_id: null,
        })
        .eq('id', gestorId)
        .select('torcida_id')
        .maybeSingle()

      if (error) {
        console.error(`[asaas-webhook] Erro ao processar ${event}:`, error)
      } else {
        console.log(`[asaas-webhook] ${event} — gestor ${gestorId}`)
        if (gestorRecusado?.torcida_id) {
          await supabaseAdmin
            .from('torcidas')
            .update({ status: 'suspenso' })
            .eq('id', gestorRecusado.torcida_id)
        }
      }

    // ── Eventos de cobrança via PIX automático (recorrência) ─────────────────

    } else if (
      event === 'PIX_AUTOMATIC_PAYMENT_CONFIRMED' ||
      event === 'PIX_AUTOMATIC_PAYMENT_RECEIVED'
    ) {
      const payment = body?.payment ?? {}
      const gestorId: string | undefined = payment?.externalReference

      if (!gestorId) {
        console.warn(`[asaas-webhook] ${event} sem externalReference`)
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // Buscar validade atual para estender (em vez de resetar do zero)
      const { data: gestor } = await supabaseAdmin
        .from('gestores')
        .select('assinatura_validade')
        .eq('id', gestorId)
        .maybeSingle()

      // Estender a partir da validade atual (ou de hoje se não tiver)
      const base = gestor?.assinatura_validade
        ? new Date(gestor.assinatura_validade)
        : new Date()
      base.setDate(base.getDate() + 30)

      const { error } = await supabaseAdmin
        .from('gestores')
        .update({
          assinatura_status: 'ativa',
          assinatura_validade: base.toISOString(),
        })
        .eq('id', gestorId)

      if (error) {
        console.error(`[asaas-webhook] Erro ao estender assinatura ${event}:`, error)
      } else {
        console.log(`[asaas-webhook] Assinatura estendida via ${event} — gestor ${gestorId}`)
      }

    } else {
      console.log(`[asaas-webhook] Evento ignorado: ${event}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('[asaas-webhook] Erro inesperado:', error)
    // Retornar 200 para evitar retentativas do Asaas
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
