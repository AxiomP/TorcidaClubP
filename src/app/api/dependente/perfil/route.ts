import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/dependente/perfil
 * Returns the authenticated dependent's profile data plus titular's codigo_referencia
 * for display as "N° de Associado".
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: dependente } = await supabaseAdmin
      .from('dependentes')
      .select('id, socio_titular_id, torcida_id, nome_completo, cpf, data_nascimento, email, status, selfie_url, created_at')
      .eq('auth_user_id', user.id)
      .eq('status', 'ativo')
      .maybeSingle()

    if (!dependente) return NextResponse.json({ error: 'Dependente não encontrado' }, { status: 404 })

    const [torcidaRes, titularRes] = await Promise.all([
      supabaseAdmin
        .from('torcidas')
        .select('chave_pix, whatsapp_grupo')
        .eq('id', dependente.torcida_id)
        .maybeSingle(),
      supabaseAdmin
        .from('socios')
        .select('codigo_referencia, nome_completo')
        .eq('id', dependente.socio_titular_id)
        .maybeSingle(),
    ])

    const titularCodigo = titularRes.data?.codigo_referencia ?? null
    const numeroAssociado = titularCodigo ? `${titularCodigo}-DEP` : null

    return NextResponse.json({
      dependente,
      numeroAssociado,
      titularNome: titularRes.data?.nome_completo ?? null,
      chavePix: torcidaRes.data?.chave_pix ?? null,
      whatsappGrupo: torcidaRes.data?.whatsapp_grupo ?? null,
    })
  } catch (error) {
    console.error('Erro GET /api/dependente/perfil:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
