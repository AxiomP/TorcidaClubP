import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor?.torcida_id) return NextResponse.json({ error: 'Gestor sem torcida' }, { status: 400 })

    const body = await request.json()
    const { texto_curto, imagem_url, link, ativo } = body

    const { data, error } = await supabaseAdmin
      .from('patrocinadores')
      .update({ texto_curto, imagem_url, link, ativo })
      .eq('id', id)
      .eq('torcida_id', gestor.torcida_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao atualizar patrocinador:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor?.torcida_id) return NextResponse.json({ error: 'Gestor sem torcida' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('patrocinadores')
      .delete()
      .eq('id', id)
      .eq('torcida_id', gestor.torcida_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar patrocinador:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
