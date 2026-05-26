import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import asaasService from '@/lib/services/asaas-service'
import { PLATFORM_SUBSCRIPTION_VALUE } from '@/config/subscriptions'

/**
 * POST /api/gestores/assinatura/pix-automatico
 * Cria uma assinatura recorrente mensal via PIX no Asaas.
 * Body: { cpfCnpj: string } — obrigatório (Asaas exige CPF/CNPJ para cobranças PIX).
 * Retorna { invoiceUrl } para o gestor realizar o primeiro pagamento.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Ler e validar CPF/CNPJ do body
    let cpfCnpj: string
    try {
      const body = await request.json()
      const raw: string = (body?.cpfCnpj ?? '').replace(/\D/g, '')
      if (raw.length !== 11 && raw.length !== 14) {
        return NextResponse.json(
          { error: 'CPF (11 dígitos) ou CNPJ (14 dígitos) inválido.' },
          { status: 422 }
        )
      }
      cpfCnpj = raw
    } catch {
      return NextResponse.json({ error: 'Body inválido. Envie { cpfCnpj }.' }, { status: 400 })
    }

    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, asaas_customer_id, nome_completo, email, torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })
    }

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

    if (!customerId) {
      // Criar novo customer com CPF/CNPJ
      try {
        const customer = await asaasService.createCustomer({
          name: gestor.nome_completo,
          email: gestor.email,
          externalReference: gestor.id,
          cpfCnpj,
        })
        customerId = customer.id

        await supabaseAdmin
          .from('gestores')
          .update({ asaas_customer_id: customerId })
          .eq('id', gestor.id)
      } catch (err) {
        console.error('[pix-automatico] Erro ao criar customer Asaas:', err)
        return NextResponse.json(
          { error: 'Erro ao criar cliente no sistema de pagamentos. Tente novamente.' },
          { status: 502 }
        )
      }
    } else {
      // Customer já existe — atualizar com CPF/CNPJ antes de criar assinatura
      try {
        await asaasService.updateCustomer(customerId, { cpfCnpj })
      } catch (err) {
        console.error('[pix-automatico] Erro ao atualizar customer Asaas com CPF/CNPJ:', err)
        return NextResponse.json(
          { error: 'Erro ao atualizar dados do cliente. Tente novamente.' },
          { status: 502 }
        )
      }
    }

    // Data de vencimento da primeira cobrança: hoje + 3 dias
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const nextDueDate = dueDate.toISOString().split('T')[0]

    // Criar assinatura recorrente mensal via PIX
    let subscription
    try {
      subscription = await asaasService.createSubscription({
        customerId,
        value: PLATFORM_SUBSCRIPTION_VALUE,
        nextDueDate,
        cycle: 'MONTHLY',
        billingType: 'PIX',
        description: `Assinatura TorcidaClub® — ${torcidaNome}`,
        externalReference: gestor.id,
      })
    } catch (err) {
      console.error('[pix-automatico] Erro ao criar assinatura Asaas:', err)
      return NextResponse.json(
        { error: 'Erro ao criar assinatura. Tente novamente.' },
        { status: 502 }
      )
    }

    // Buscar primeiro pagamento gerado pela assinatura para obter invoiceUrl
    let invoiceUrl: string | null = null
    let firstPaymentId: string | null = null
    try {
      const payments = await asaasService.getSubscriptionPayments(subscription.id, 1)
      if (payments.data.length > 0) {
        firstPaymentId = payments.data[0].id
        invoiceUrl = payments.data[0].invoiceUrl
      }
    } catch (err) {
      // Não fatal — Asaas envia link por SMS/WhatsApp
      console.error('[pix-automatico] Erro ao buscar primeiro pagamento:', err)
    }

    // Persistir: subscription ID em asaas_pix_auth_id, primeiro payment ID em asaas_payment_id
    await supabaseAdmin
      .from('gestores')
      .update({
        asaas_pix_auth_id: subscription.id,
        asaas_payment_id: firstPaymentId,
        assinatura_status: 'pendente',
      })
      .eq('id', gestor.id)

    return NextResponse.json({ invoiceUrl })

  } catch (error) {
    console.error('[pix-automatico] Erro POST:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * GET /api/gestores/assinatura/pix-automatico
 * Consulta status do primeiro pagamento da assinatura (polling no frontend).
 * Self-healing: se RECEIVED/CONFIRMED mas DB = 'pendente' → ativa assinatura.
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
      .select('id, asaas_payment_id, assinatura_status')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })
    }

    if (!gestor.asaas_payment_id) {
      return NextResponse.json({ error: 'Nenhum pagamento pendente' }, { status: 404 })
    }

    let payment
    try {
      payment = await asaasService.getPayment(gestor.asaas_payment_id)
    } catch (err) {
      console.error('[pix-automatico] Erro ao consultar pagamento:', err)
      return NextResponse.json({ error: 'Erro ao consultar Asaas' }, { status: 502 })
    }

    // Self-healing: pagamento confirmado mas DB ainda pendente
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

      console.log(`[pix-automatico] Assinatura ativada via polling — gestor ${gestor.id}`)
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      invoiceUrl: payment.invoiceUrl,
    })

  } catch (error) {
    console.error('[pix-automatico] Erro GET:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
