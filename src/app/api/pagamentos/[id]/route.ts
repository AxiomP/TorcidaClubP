import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor?.torcida_id) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 403 })
    }

    // Buscar pagamento — socios join via supabaseAdmin (bypassa RLS)
    const { data: pagamento, error } = await supabaseAdmin
      .from('pagamentos')
      .select('*, socios(id, nome_completo, apelido, whatsapp)')
      .eq('id', id)
      .eq('torcida_id', gestor.torcida_id)
      .maybeSingle()

    if (error || !pagamento) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ pagamento })
  } catch (error) {
    console.error('Erro GET /api/pagamentos/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status: statusNovo, motivo_recusa } = await request.json()

    const supabase = await createClient()

    // 1. Validar Autenticação do Gestor
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor?.torcida_id) {
      return NextResponse.json({ error: 'Gestor não encontrado ou sem permissão' }, { status: 403 })
    }

    // 2. Buscar o pagamento existente para garantir que pertence à torcida desse gestor
    const { data: pagamento, error: pagError } = await supabaseAdmin
      .from('pagamentos')
      .select('socio_id, torcida_id, referencia_mes, tipo_mensalidade_id')
      .eq('id', id)
      .eq('torcida_id', gestor.torcida_id)
      .maybeSingle()

    if (pagError || !pagamento) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    const hojeStr = new Date().toISOString().split('T')[0]

    // Se o gestor está aprovando/confirmando o pagamento
    if (statusNovo === 'confirmado') {
      // 3. Buscar as configurações de vencimento da torcida
      const { data: torcida } = await supabaseAdmin
        .from('torcidas')
        .select('dia_vencimento_mensalidade')
        .eq('id', pagamento.torcida_id)
        .maybeSingle()

      const diaVencimentoPadrao = torcida?.dia_vencimento_mensalidade || 10

      // 4. Calcular a data do próximo pagamento empurrando 1 mês à frente da referência atual
      const parts = pagamento.referencia_mes.split('-')
      const ano = parseInt(parts[0])
      const mes = parseInt(parts[1]) - 1 // Meses no JS começam em 0
      
      const dataBaseProximoMes = new Date(ano, mes, 1)
      dataBaseProximoMes.setMonth(dataBaseProximoMes.getMonth() + 1) // Avança para o mês seguinte (Maio)
      
      const ultimoDiaDoMesSeguinte = new Date(dataBaseProximoMes.getFullYear(), dataBaseProximoMes.getMonth() + 1, 0).getDate()
      const diaEfetivo = Math.min(diaVencimentoPadrao, ultimoDiaDoMesSeguinte)
      
      dataBaseProximoMes.setDate(diaEfetivo)
      
      const anoResult = dataBaseProximoMes.getFullYear()
      const mesResult = String(dataBaseProximoMes.getMonth() + 1).padStart(2, '0')
      const diaResult = String(dataBaseProximoMes.getDate()).padStart(2, '0')
      
      const dataProximoPagamentoStr = `${anoResult}-${mesResult}-${diaResult}` // ex: 2026-05-10
      const referenciaProximoMesStr = `${anoResult}-${mesResult}-01` // ex: 2026-05-01

      // 5. Atualizar o pagamento E a ficha do sócio
      await Promise.all([
        supabaseAdmin
          .from('pagamentos')
          .update({
            status: 'confirmado',
            data_pagamento: hojeStr,
            data_confirmacao: new Date().toISOString(),
            confirmado_por: gestor.id
          })
          .eq('id', id),

        supabaseAdmin
          .from('socios')
          .update({
            status: 'ativo',
            data_ultimo_pagamento: hojeStr,
            data_proximo_pagamento: dataProximoPagamentoStr,
            meses_pendentes: 0,
            valor_divida_total: 0
          })
          .eq('id', pagamento.socio_id),

        supabaseAdmin
          .from('pagamentos')
          .insert({
            socio_id: pagamento.socio_id,
            torcida_id: pagamento.torcida_id,
            tipo_mensalidade_id: pagamento.tipo_mensalidade_id,
            referencia_mes: referenciaProximoMesStr, // Vira 2026-05-01
            valor_original: 50.00, // Substitua pelo valor dinâmico se tiver a tabela tipos_mensalidade vinculada
            valor_perdoado: 0,
            data_vencimento: dataProximoPagamentoStr, // Vira 2026-05-10
            status: 'pendente',
            lembrete_7_dias_enviado: false,
            lembrete_3_dias_enviado: false,
            lembrete_dia_enviado: false
          })
      ])

    } else {
      // Caso o gestor mude para recusado ou qualquer outro status
      await supabaseAdmin
        .from('pagamentos')
        .update({
          status: statusNovo,
          motivo_recusa: motivo_recusa || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro PATCH /api/pagamentos/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}