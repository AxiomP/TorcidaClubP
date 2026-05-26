import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/socio/ingressos
 * Returns all data needed for the socio ingressos page.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id, torcida_id, ranking')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!socio) return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })

    const now = new Date().toISOString()

    const [torcidaRes, dependentesRes, ativosRes, historicoRes, eventosRes] = await Promise.all([
      supabaseAdmin.from('torcidas').select('chave_pix').eq('id', socio.torcida_id).maybeSingle(),
      supabaseAdmin.from('dependentes').select('id, nome_completo').eq('socio_titular_id', socio.id).eq('status', 'ativo').order('nome_completo'),
      supabaseAdmin.from('compras_ingressos')
        .select('*, evento:eventos(nome_evento, data_hora, local)')
        .eq('socio_id', socio.id)
        .in('status', ['aprovado', 'pendente', 'comprovante_enviado'])
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('compras_ingressos')
        .select('*, evento:eventos(nome_evento, data_hora, local)')
        .eq('socio_id', socio.id)
        .in('status', ['usado', 'recusado'])
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin.from('eventos')
        .select('id, nome_evento, data_hora, local, valor_socio, valor_dependente, valor_adicional, ranking_minimo, qtd_ingressos_disponiveis, qtd_ingressos_total, qtd_ingressos_vendidos, permite_dependentes, permite_adicionais, data_fim_vendas')
        .eq('torcida_id', socio.torcida_id)
        .eq('status', 'ativo')
        .gte('data_hora', now)
        .order('data_hora', { ascending: true }),
    ])

    return NextResponse.json({
      chavePix: torcidaRes.data?.chave_pix ?? null,
      dependentes: dependentesRes.data ?? [],
      ingressosAtivos: ativosRes.data ?? [],
      historicoIngressos: historicoRes.data ?? [],
      eventosDisponiveis: eventosRes.data ?? [],
    })
  } catch (error) {
    console.error('Erro GET /api/socio/ingressos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
