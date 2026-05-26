import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/socio/dependentes
 * Returns dependentes + tipo_mensalidade for the socio.
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

    const { data: dependentes } = await supabaseAdmin
      .from('dependentes')
      .select('*')
      .eq('socio_titular_id', socio.id)
      .neq('status', 'cancelado')
      .order('created_at', { ascending: false })

    return NextResponse.json({ dependentes: dependentes ?? [] })
  } catch (error) {
    console.error('Erro GET /api/socio/dependentes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * PATCH /api/socio/dependentes
 * Updates a dependente's status (e.g., cancelado).
 * Body: { dependente_id, status }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { dependente_id, status } = await request.json()
    if (!dependente_id || !status) return NextResponse.json({ error: 'dependente_id e status são obrigatórios' }, { status: 400 })

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!socio) return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })

    const { error } = await supabaseAdmin
      .from('dependentes')
      .update({ status })
      .eq('id', dependente_id)
      .eq('socio_titular_id', socio.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro PATCH /api/socio/dependentes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
