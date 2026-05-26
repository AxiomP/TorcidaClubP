import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import asaasService from '@/lib/services/asaas-service'
import { PLATFORM_SUBSCRIPTION_VALUE } from '@/config/subscriptions'

/**
 * GET /api/gestores/assinatura
 * Retorna status da assinatura + invoiceUrl do Asaas.
 * Self-healing: se Asaas confirmar pagamento mas DB ainda diz 'pendente', corrige.
 * Inclui dados do PIX automático se houver autorização pendente.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, asaas_payment_id, asaas_pix_auth_id, assinatura_status, assinatura_validade')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })
    }

    let invoiceUrl: string | null = null
    let paymentStatus: string | null = null

    // Verificar cobrança de débito/crédito pendente
    if (gestor.asaas_payment_id) {
      try {
        const payment = await asaasService.getPayment(gestor.asaas_payment_id)
        invoiceUrl = payment.invoiceUrl
        paymentStatus = payment.status

        // Self-healing: Asaas já confirmou mas DB ainda está pendente
        if (
          ['RECEIVED', 'CONFIRMED'].includes(payment.status) &&
          gestor.assinatura_status === 'pendente'
        ) {
          const validade = new Date()
          validade.setDate(validade.getDate() + 30)

          await supabaseAdmin
            .from('gestores')
            .update({
              assinatura_status: 'ativa',
              assinatura_validade: validade.toISOString(),
            })
            .eq('id', gestor.id)

          return NextResponse.json({
            assinatura_status: 'ativa',
            assinatura_validade: validade.toISOString(),
            invoiceUrl,
            paymentStatus,
          })
        }
      } catch (asaasErr) {
        // Não falhar o request se a consulta ao Asaas falhar — retornar dados do DB
        console.error('Erro ao consultar pagamento Asaas:', asaasErr)
      }
    }

    return NextResponse.json({
      assinatura_status: gestor.assinatura_status,
      assinatura_validade: gestor.assinatura_validade,
      invoiceUrl,
      paymentStatus,
    })

  } catch (error) {
    console.error('Erro GET /api/gestores/assinatura:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * POST /api/gestores/assinatura
 * Gera nova cobrança de renovação no Asaas (débito, crédito ou PIX avulso).
 * Body: { modalidade?: 'debito' | 'credito' | 'pix_avulso' }
 * Sem modalidade → billingType UNDEFINED (comportamento legado).
 * Atualiza asaas_payment_id e assinatura_status = 'pendente'.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, asaas_customer_id, assinatura_status, nome_completo, email, torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })
    }

    // Ler modalidade do body
    let modalidade: string | undefined
    try {
      const body = await request.json()
      modalidade = body?.modalidade
    } catch {
      // body vazio ou inválido — usar padrão
    }

    // Mapear modalidade para billingType
    // DEBIT_CARD não é suportado nesta conta Asaas — usar UNDEFINED redireciona
    // ao checkout Asaas onde o cliente escolhe a forma de pagamento
    const billingTypeMap: Record<string, 'UNDEFINED' | 'PIX' | 'CREDIT_CARD'> = {
      debito: 'UNDEFINED',
      credito: 'CREDIT_CARD',
      pix_avulso: 'PIX',
    }
    const billingType = (modalidade && billingTypeMap[modalidade]) ? billingTypeMap[modalidade] : 'UNDEFINED'

    // Buscar nome da torcida para a descrição
    let torcidaNome = 'sua torcida'
    if (gestor.torcida_id) {
      const { data: torcida } = await supabaseAdmin
        .from('torcidas')
        .select('nome')
        .eq('id', gestor.torcida_id)
        .maybeSingle()
      if (torcida?.nome) torcidaNome = torcida.nome
    }

    let customerId = gestor.asaas_customer_id

    // Se não tem customer no Asaas ainda, criar
    if (!customerId) {
      try {
        const customer = await asaasService.createCustomer({
          name: gestor.nome_completo,
          email: gestor.email,
          externalReference: gestor.id,
        })
        customerId = customer.id

        await supabaseAdmin
          .from('gestores')
          .update({ asaas_customer_id: customerId })
          .eq('id', gestor.id)
      } catch (err) {
        console.error('Erro ao criar customer Asaas:', err)
        return NextResponse.json(
          { error: 'Erro ao processar renovação. Tente novamente.' },
          { status: 502 }
        )
      }
    }

    // Criar nova cobrança
    let payment
    try {
      payment = await asaasService.createPayment({
        customerId,
        value: PLATFORM_SUBSCRIPTION_VALUE,
        description: `Renovação Assinatura TorcidaClub® — ${torcidaNome}`,
        externalReference: gestor.id,
        billingType,
      })
    } catch (err) {
      console.error('Erro ao criar pagamento Asaas:', err)
      return NextResponse.json(
        { error: 'Erro ao gerar cobrança de renovação. Tente novamente.' },
        { status: 502 }
      )
    }

    // Persistir novo payment_id e resetar status
    await supabaseAdmin
      .from('gestores')
      .update({
        asaas_payment_id: payment.id,
        assinatura_status: 'pendente',
      })
      .eq('id', gestor.id)

    return NextResponse.json({ invoiceUrl: payment.invoiceUrl })

  } catch (error) {
    console.error('Erro POST /api/gestores/assinatura:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * DELETE /api/gestores/assinatura
 * Cancela a assinatura do gestor no Asaas e suspende a torcida imediatamente.
 */
export async function DELETE() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, asaas_pix_auth_id, assinatura_status, torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })
    }

    // Cancelar assinatura no Asaas se existir
    if (gestor.asaas_pix_auth_id) {
      try {
        await asaasService.cancelSubscription(gestor.asaas_pix_auth_id)
      } catch (err) {
        // Não bloquear o cancelamento local se Asaas falhar
        console.error('[assinatura] Erro ao cancelar assinatura Asaas:', err)
      }
    }

    const agora = new Date().toISOString()

    // Marcar assinatura como vencida
    await supabaseAdmin
      .from('gestores')
      .update({ assinatura_status: 'vencida', assinatura_validade: agora })
      .eq('id', gestor.id)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Erro DELETE /api/gestores/assinatura:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
