import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/dependente/painel
 * Returns data for the dependente dashboard (events, benefits, torcida info).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Try dependentes table first (regular dependentes)
    let torcidaId: string | null = null
    let titularNome: string | null = null

    const { data: dep } = await supabaseAdmin
      .from('dependentes')
      .select('id, torcida_id, socio_titular_id, status')
      .eq('auth_user_id', user.id)
      .eq('status', 'ativo')
      .maybeSingle()

    if (dep) {
      torcidaId = dep.torcida_id
      const { data: titular } = await supabaseAdmin
        .from('socios')
        .select('nome_completo')
        .eq('id', dep.socio_titular_id)
        .maybeSingle()
      titularNome = titular?.nome_completo ?? null
    } else {
      // Self-registered minor: has socios record with e_menor=true
      const { data: socio } = await supabaseAdmin
        .from('socios')
        .select('torcida_id')
        .eq('auth_user_id', user.id)
        .eq('e_menor', true)
        .maybeSingle()
      if (socio) torcidaId = socio.torcida_id
    }

    if (!torcidaId) return NextResponse.json({ error: 'Dependente não encontrado' }, { status: 404 })

    const [beneficiosRes, eventosRes, torcidaRes] = await Promise.all([
      supabaseAdmin.from('beneficios').select('*').eq('torcida_id', torcidaId).eq('ativo', true).order('ordem'),
      supabaseAdmin.from('eventos').select('id, nome_evento, data_hora, local, valor_dependente, status').eq('torcida_id', torcidaId).eq('status', 'ativo').gte('data_hora', new Date().toISOString()).order('data_hora').limit(5),
      supabaseAdmin.from('torcidas').select('nome, logo_url').eq('id', torcidaId).maybeSingle(),
    ])

    return NextResponse.json({
      beneficios: beneficiosRes.data ?? [],
      eventos: eventosRes.data ?? [],
      torcida: torcidaRes.data ?? null,
      titularNome,
    })
  } catch (error) {
    console.error('Erro GET /api/dependente/painel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
