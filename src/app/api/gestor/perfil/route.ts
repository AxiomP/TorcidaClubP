import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('id, nome_completo, email, torcida_id, role, telefone')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })

    let torcida = null
    if (gestor.torcida_id) {
      const { data } = await supabaseAdmin
        .from('torcidas')
        .select('id, nome, slug')
        .eq('id', gestor.torcida_id)
        .eq('status', 'ativo')
        .maybeSingle()
      torcida = data
    }

    return NextResponse.json({ gestor, torcida })
  } catch (error) {
    console.error('Erro GET /api/gestor/perfil:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })

    const body = await request.json()
    const allowedFields = ['nome_completo', 'telefone']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('gestores').update(updateData).eq('id', gestor.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro PATCH /api/gestor/perfil:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
