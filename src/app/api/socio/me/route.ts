import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/socio/me
 * Retorna dados do sócio autenticado + torcida + pagamentos pendentes.
 * Usa supabaseAdmin para bypassar RLS (broken due to deleted_at removal).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: socio, error: socioError } = await supabaseAdmin
      .from('socios')
      .select('id, torcida_id, status, primeiro_acesso_feito, nome_completo')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (socioError || !socio) {
      return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })
    }

    // Buscar torcida
    let torcida = null
    if (socio.torcida_id) {
      const { data } = await supabaseAdmin
        .from('torcidas')
        .select('nome, brasao_url, cor_fundo, chave_pix')
        .eq('id', socio.torcida_id)
        .maybeSingle()
      torcida = data
    }

    // Buscar pagamento pendente mais recente
    const { data: pagamentos } = await supabaseAdmin
      .from('pagamentos')
      .select('id, valor_original, referencia_mes, data_vencimento, status, motivo_recusa')
      .eq('socio_id', socio.id)
      .in('status', ['pendente', 'comprovante_enviado', 'recusado'])
      .order('created_at', { ascending: false })
      .limit(1)

    const pagamento = pagamentos && pagamentos.length > 0 ? pagamentos[0] : null

    return NextResponse.json({ socio, torcida, pagamento })
  } catch (error) {
    console.error('Erro GET /api/socio/me:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
