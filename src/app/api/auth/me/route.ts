import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile (gestor, socio, or dependente).
 * Auth via cookie client; data via supabaseAdmin (bypasses broken RLS).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [gestorResult, socioResult, dependenteResult] = await Promise.all([
      supabaseAdmin
        .from('gestores')
        .select('id, torcida_id, email, nome_completo, role, ativo, telefone')
        .eq('auth_user_id', user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('socios')
        .select('id, torcida_id, nome_completo, email, status, codigo_referencia, tipo_mensalidade_id, ranking, primeiro_acesso_feito, e_menor')
        .eq('auth_user_id', user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('dependentes')
        .select('id, torcida_id, socio_titular_id, nome_completo, email, status, data_nascimento')
        .eq('auth_user_id', user.id)
        .maybeSingle(),
    ])

    const socio = socioResult.data
    const dependente = dependenteResult.data

    // Qualquer usuário com vínculo ativo em dependentes é tratado como dependente,
    // independente de e_menor. Isso garante que restrições de mensalidade e ingressos
    // sejam aplicadas corretamente enquanto o vínculo estiver ativo.
    const hasActiveDependency = dependente?.status === 'ativo'

    return NextResponse.json({
      gestor: gestorResult.data ?? null,
      socio: hasActiveDependency ? null : socio ?? null,
      dependente: dependente ?? null,
    })
  } catch (error) {
    console.error('Erro GET /api/auth/me:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
