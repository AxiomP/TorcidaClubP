import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/torcidas/buscar
 * Busca torcidas ativas por nome
 * Query params:
 *   - q: termo de busca (opcional)
 *   - limit: limite de resultados (padrão: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const id = searchParams.get('id')

    const _supabase = await createClient()

    // Buscar por ID específico
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('torcidas')
        .select('id, nome, slug, brasao_url, cor_fundo, frase_efeito')
        .eq('id', id)
        .maybeSingle()
      if (error) return NextResponse.json({ error: 'Erro ao buscar torcida' }, { status: 500 })
      return NextResponse.json({ torcidas: data ? [data] : [], total: data ? 1 : 0 })
    }

    // Buscar torcidas ativas
    let dbQuery = supabaseAdmin
      .from('torcidas')
      .select('id, nome, slug, brasao_url, cor_fundo, frase_efeito')
      .eq('status', 'ativo')
      .order('nome', { ascending: true })
      .limit(limit)

    // Aplicar filtro de busca se fornecido
    if (query.trim()) {
      dbQuery = dbQuery.ilike('nome', `%${query}%`)
    }

    const { data: torcidas, error } = await dbQuery

    if (error) {
      console.error('Erro ao buscar torcidas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar torcidas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      torcidas: torcidas || [],
      total: torcidas?.length || 0,
    })
  } catch (error) {
    console.error('Erro na API buscar torcidas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
