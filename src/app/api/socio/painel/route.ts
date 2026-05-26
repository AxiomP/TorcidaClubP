import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/socio/painel
 * Returns all data needed for the socio dashboard page.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id, torcida_id, tipo_mensalidade_id, nome_completo, status, ranking, codigo_referencia, data_proximo_pagamento')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!socio) return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })

    const torcidaId = socio.torcida_id

    const [
      beneficiosRes,
      dependentesRes,
      pagamentoRes,
      eventosRes,
      torcidaRes,
    ] = await Promise.all([
      supabaseAdmin.from('beneficios').select('*').eq('torcida_id', torcidaId).eq('ativo', true).order('ordem'),
      supabaseAdmin.from('dependentes').select('*').eq('socio_titular_id', socio.id).neq('status', 'cancelado'),
      supabaseAdmin.from('pagamentos').select('*').eq('socio_id', socio.id).order('data_vencimento', { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from('eventos').select('*').eq('torcida_id', torcidaId).eq('status', 'ativo').gte('data_hora', new Date().toISOString()).order('data_hora').limit(5),
      supabaseAdmin.from('torcidas').select('*').eq('id', torcidaId).maybeSingle(),
    ])

    let tipoMensalidade = null
    if (socio.tipo_mensalidade_id) {
      const { data } = await supabaseAdmin.from('tipos_mensalidade').select('*').eq('id', socio.tipo_mensalidade_id).maybeSingle()
      tipoMensalidade = data
    }

    return NextResponse.json({
      socio,
      beneficios: beneficiosRes.data ?? [],
      dependentes: dependentesRes.data ?? [],
      pagamento: pagamentoRes.data ?? null,
      eventos: eventosRes.data ?? [],
      torcida: torcidaRes.data ?? null,
      tipoMensalidade,
    })
  } catch (error) {
    console.error('Erro GET /api/socio/painel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
