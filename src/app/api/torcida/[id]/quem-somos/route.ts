import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/torcida/[id]/quem-somos
 * Retorna nome e quem_somos da torcida — acessível por sócios e gestores.
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [torcidaRes, gestorRes] = await Promise.all([
      supabaseAdmin.from('torcidas').select('nome, quem_somos').eq('id', id).maybeSingle(),
      supabaseAdmin.from('gestores').select('telefone').eq('torcida_id', id).eq('role', 'admin').maybeSingle(),
    ])

    if (torcidaRes.error) {
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
    }

    if (!torcidaRes.data) {
      return NextResponse.json({ error: 'Torcida não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      nome: torcidaRes.data.nome,
      quem_somos: torcidaRes.data.quem_somos,
      gestor_telefone: gestorRes.data?.telefone ?? null,
    })
  } catch (error) {
    console.error('Erro GET quem-somos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
