import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { torcidaCreateSchema } from '@/lib/validations/torcida-create-schema'
import asaasService from '@/lib/services/asaas-service'

/**
 * API: Criar Nova Torcida
 * POST /api/torcida - Criar nova torcida e vincular ao gestor
 */

// POST - Criar nova torcida
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar gestor
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id, role, nome_completo, email, asaas_customer_id')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json(
        { error: 'Gestor não encontrado. Você precisa ter uma conta de gestor para criar uma torcida.' },
        { status: 404 }
      )
    }

    // Verificar se já tem torcida vinculada
    if (gestor.torcida_id) {
      // Verificar se a torcida ainda existe no banco
      const { data: torcidaExistente } = await supabaseAdmin
        .from('torcidas')
        .select('id')
        .eq('id', gestor.torcida_id)
        .single()

      // Se torcida existe, realmente está vinculado - bloquear
      if (torcidaExistente) {
        return NextResponse.json(
          { error: 'Você já está vinculado a uma torcida. Não é possível criar outra.' },
          { status: 400 }
        )
      }

      // Se torcida foi deletada, limpar a referência órfã
      console.warn(`Limpando referência órfã: gestor ${gestor.id} referenciava torcida inexistente ${gestor.torcida_id}`)
      await supabaseAdmin
        .from('gestores')
        .update({ torcida_id: null })
        .eq('id', gestor.id)
    }

    // Parse e validar dados
    const body = await request.json()
    const cpfCnpj: string | undefined = typeof body?.cpfCnpj === 'string' ? body.cpfCnpj : undefined
    const validationResult = torcidaCreateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const torcidaData = {
      ...validationResult.data,
      status: 'pendente' as const,
      plano: 'basico' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Criar torcida (usando admin client para bypassar RLS)
    const { data: novaTorcida, error: createError } = await supabaseAdmin
      .from('torcidas')
      .insert(torcidaData)
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar torcida:', createError)

      // Verificar se é erro de slug duplicado
      if (createError.code === '23505' && createError.message.includes('slug')) {
        return NextResponse.json(
          { error: 'Este slug já está em uso. Escolha outro nome para a URL.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Erro ao criar torcida' },
        { status: 500 }
      )
    }

    // Vincular gestor à nova torcida e definir como admin (usando admin client)
    const { error: updateGestorError } = await supabaseAdmin
      .from('gestores')
      .update({
        torcida_id: novaTorcida.id,
        role: 'admin',
      })
      .eq('id', gestor.id)

    if (updateGestorError) {
      console.error('Erro ao vincular gestor:', updateGestorError)

      // Reverter criação da torcida em caso de erro (usando admin client)
      await supabaseAdmin
        .from('torcidas')
        .delete()
        .eq('id', novaTorcida.id)

      return NextResponse.json(
        { error: 'Erro ao vincular gestor à torcida' },
        { status: 500 }
      )
    }

    // Se gestor já tem customer Asaas (pagou via checkout), pular criação de cobrança —
    // a assinatura já está ativa e gerenciada pelo Asaas.
    let invoiceUrl: string | null = null
    if (!gestor.asaas_customer_id) {
      try {
        const asaasCustomer = await asaasService.createCustomer({
          name: gestor.nome_completo,
          email: gestor.email,
          externalReference: gestor.id,
          ...(cpfCnpj ? { cpfCnpj } : {}),
        })

        const asaasPayment = await asaasService.createPayment({
          customerId: asaasCustomer.id,
          value: parseFloat(process.env.ASAAS_SUBSCRIPTION_VALUE || '1.00'),
          description: `Assinatura TorcidaClub® — ${novaTorcida.nome}`,
          externalReference: gestor.id,
        })

        invoiceUrl = asaasPayment.invoiceUrl

        await supabaseAdmin
          .from('gestores')
          .update({
            asaas_customer_id: asaasCustomer.id,
            asaas_payment_id: asaasPayment.id,
          })
          .eq('id', gestor.id)

      } catch (asaasError) {
        console.error('Erro Asaas — revertendo criação da torcida:', asaasError)

        await Promise.all([
          supabaseAdmin.from('torcidas').delete().eq('id', novaTorcida.id),
          supabaseAdmin.from('gestores').update({ torcida_id: null }).eq('id', gestor.id),
        ])

        return NextResponse.json(
          { error: 'Erro ao processar pagamento da assinatura. Torcida não foi criada. Tente novamente.' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({
      message: 'Torcida criada com sucesso!',
      torcida: novaTorcida,
      invoiceUrl,
    }, { status: 201 })

  } catch (error) {
    console.error('Erro na API torcida POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
