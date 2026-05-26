import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { format, startOfMonth } from 'date-fns'
import type { Database } from '@/types/database'

/**
 * POST /api/socios/gerar-mensalidade-inicial
 * Gera a 1ª mensalidade do sócio autenticado, caso ainda não exista.
 * Usado como fallback no primeiro-acesso quando a mensalidade não foi criada na aprovação.
 */
export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar sócio pelo auth_user_id
    const { data: socio, error: socioError } = await supabaseAdmin
      .from('socios')
      .select('id, torcida_id, tipo_mensalidade_id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (socioError || !socio) {
      return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })
    }

    // Verificar se já tem pagamento pendente
    const { data: existente } = await supabaseAdmin
      .from('pagamentos')
      .select('id, valor_original, referencia_mes, data_vencimento')
      .eq('socio_id', socio.id)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(1)

    if (existente && existente.length > 0) {
      return NextResponse.json({ pagamento: existente[0] })
    }

    // Buscar dados da torcida e tipo mensalidade em paralelo
    const [torcidaResult, tipoResult] = await Promise.all([
      supabaseAdmin
        .from('torcidas')
        .select('dia_vencimento_mensalidade, chave_pix')
        .eq('id', socio.torcida_id!)
        .maybeSingle(),
      socio.tipo_mensalidade_id
        ? supabaseAdmin
            .from('tipos_mensalidade')
            .select('id, valor')
            .eq('id', socio.tipo_mensalidade_id)
            .eq('torcida_id', socio.torcida_id!)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    const torcida = torcidaResult.data
    if (!torcida) {
      return NextResponse.json({ error: 'Torcida não encontrada' }, { status: 404 })
    }

    const tipoMensalidade = tipoResult.data
    const valor = tipoMensalidade?.valor ?? 0
    const tipoId = tipoMensalidade?.id ?? null

    // Calcular data de vencimento
    const hoje = new Date()

    const dataVencimentoStr = format(hoje, 'yyyy-MM-dd')
    const referenciaMes = format(startOfMonth(hoje), 'yyyy-MM-dd')

    const { data: novoPagamento, error: insertError } = await supabaseAdmin
      .from('pagamentos')
      .insert({
        socio_id: socio.id,
        torcida_id: socio.torcida_id,
        tipo_mensalidade_id: tipoId,
        referencia_mes: referenciaMes,
        valor_original: valor,
        valor_perdoado: 0,
        data_vencimento: dataVencimentoStr,
        status: 'pendente' as const,
        lembrete_7_dias_enviado: false,
        lembrete_3_dias_enviado: false,
        lembrete_dia_enviado: false,
      } as Database['public']['Tables']['pagamentos']['Insert'])
      .select('id, valor_original, referencia_mes, data_vencimento')
      .single()

    if (insertError || !novoPagamento) {
      console.error('Erro ao criar mensalidade inicial:', insertError)
      return NextResponse.json({ error: 'Erro ao criar mensalidade' }, { status: 500 })
    }

    return NextResponse.json({ pagamento: novoPagamento })
  } catch (error) {
    console.error('Erro em gerar-mensalidade-inicial:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
