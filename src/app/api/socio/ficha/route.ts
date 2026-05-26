import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/socio/ficha
 * Returns full socio + torcida data for the ficha cadastral page.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!socio) return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })

    const [torcidaRes, tipoRes] = await Promise.all([
      supabaseAdmin.from('torcidas').select('nome, brasao_url, endereco_sede, slug, presidente, vice_presidente, cor_fundo').eq('id', socio.torcida_id).maybeSingle(),
      socio.tipo_mensalidade_id
        ? supabaseAdmin.from('tipos_mensalidade').select('nome').eq('id', socio.tipo_mensalidade_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    return NextResponse.json({
      socio: { ...socio, tipo_mensalidade: tipoRes.data ?? null },
      torcida: torcidaRes.data ?? null,
    })
  } catch (error) {
    console.error('Erro GET /api/socio/ficha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
