import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/torcida/slug/[slug]
 * Busca dados públicos de uma torcida pelo slug
 * Retorna: torcida + beneficios + links (apenas ativos)
 * Sem autenticação (endpoint público)
 */

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar torcida pelo slug
    const { data: torcida, error: torcidaError } = await supabaseAdmin
      .from('torcidas')
      .select(`
        id,
        nome,
        slug,
        brasao_url,
        cor_fundo,
        frase_efeito,
        endereco_sede,
        presidente,
        vice_presidente,
        whatsapp_grupo,
        status,
        plano
      `)
      .eq('slug', slug)
      .single()

    if (torcidaError || !torcida) {
      return NextResponse.json(
        { error: 'Torcida não encontrada' },
        { status: 404 }
      )
    }

    // Buscar benefícios ativos da torcida
    const { data: beneficios } = await supabase
      .from('beneficios')
      .select('id, titulo, descricao, icone, ordem')
      .eq('torcida_id', torcida.id)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    // Buscar links ativos da torcida
    const { data: links } = await supabase
      .from('links')
      .select('id, titulo, url, icone, ordem')
      .eq('torcida_id', torcida.id)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    // Determinar se a torcida está ativa (pode mostrar ações)
    const isAtiva = torcida.status === 'ativo'

    return NextResponse.json({
      torcida: {
        ...torcida,
        isAtiva,
      },
      beneficios: beneficios || [],
      links: links || [],
    })
  } catch (error) {
    console.error('Erro na API torcida por slug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
