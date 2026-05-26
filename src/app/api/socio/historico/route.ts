import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/socio/historico
 * Returns payment history for the authenticated socio.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!socio) return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })

    const { data: pagamentos } = await supabaseAdmin
      .from('pagamentos')
      .select('id, referencia_mes, valor_original, status, data_pagamento, created_at')
      .eq('socio_id', socio.id)
      .order('created_at', { ascending: false })
      .limit(12)

    return NextResponse.json({ pagamentos: pagamentos ?? [] })
  } catch (error) {
    console.error('Erro GET /api/socio/historico:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
