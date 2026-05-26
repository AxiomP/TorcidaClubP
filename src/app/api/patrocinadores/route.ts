import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/patrocinadores - Listar patrocinadores da torcida do gestor
 * POST /api/patrocinadores - Criar patrocinador
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Resolver torcida_id a partir do usuário autenticado (sem confiar em query param)
    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    let torcidaId: string | null | undefined
    let apenasAtivos = false

    if (gestor?.torcida_id) {
      // Gestor sempre vê somente sua própria torcida
      torcidaId = gestor.torcida_id
    } else {
      // Sócio: usa torcida_id dele; aceita query param para o popup do painel
      const { data: socio } = await supabaseAdmin
        .from('socios')
        .select('torcida_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      torcidaId = request.nextUrl.searchParams.get('torcida_id') || socio?.torcida_id
      apenasAtivos = true
    }

    if (!torcidaId) return NextResponse.json({ error: 'Torcida não encontrada' }, { status: 400 })

    const query = supabaseAdmin
      .from('patrocinadores')
      .select('*')
      .eq('torcida_id', torcidaId)
      .order('created_at', { ascending: false })

    if (apenasAtivos) {
      query.eq('ativo', true)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar patrocinadores:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { texto_curto, imagem_url, link, ativo = true } = body

    if (!texto_curto?.trim()) {
      return NextResponse.json({ error: 'Texto curto é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('patrocinadores')
      .insert({
        torcida_id: gestor.torcida_id,
        texto_curto: texto_curto.trim(),
        imagem_url: imagem_url || null,
        link: link || null,
        ativo,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar patrocinador:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
