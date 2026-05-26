import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/pagamentos
 * Lista pagamentos com filtros
 *
 * Query params:
 * - torcida_id: Filtrar por torcida (gestor)
 * - socio_id: Filtrar por sócio
 * - status: Filtrar por status
 * - mes: Filtrar por mês (YYYY-MM)
 * - limit: Limite de resultados (padrão: 50)
 * - offset: Offset para paginação (padrão: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const torcidaId = searchParams.get('torcida_id')
    const socioId = searchParams.get('socio_id')
    const status = searchParams.get('status')
    const mes = searchParams.get('mes')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar tipo de usuário
    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id, torcida_id, cpf')
      .eq('auth_user_id', user.id)
      .single()


    let query = supabaseAdmin
      .from('pagamentos')
      .select(`
        *,
        socios(id, nome_completo, apelido, cpf, whatsapp,  meses_pendentes, data_nascimento,
          torcidas(id, idade_min_pagamento)
        )
      `, { count: 'exact' })

    // Aplicar filtros baseado no tipo de usuário
    if (gestor && gestor.torcida_id) {
      // Gestor pode ver pagamentos de sua torcida
      if (torcidaId) {
        if (torcidaId !== gestor.torcida_id) {
          return NextResponse.json(
            { error: 'Sem permissão para esta torcida' },
            { status: 403 }
          )
        }
        query = query.eq('torcida_id', torcidaId)
      } else {
        query = query.eq('torcida_id', gestor.torcida_id)
      }

      // Filtrar por sócio se especificado
      if (socioId) {
        query = query.eq('socio_id', socioId)
      }
    } else if (socio) {
      // Sócio só pode ver seus próprios pagamentos
      query = query.eq('socio_id', socio.id)
    } else {
      return NextResponse.json(
        { error: 'Usuário não é gestor nem sócio' },
        { status: 403 }
      )
    }

    // Filtros adicionais
    if (status) {
      query = query.eq('status', status as 'pendente' | 'comprovante_enviado' | 'confirmado' | 'recusado' | 'perdoado')
    }

    if (mes) {
      // Filtrar por mês (YYYY-MM)
      query = query.like('referencia_mes', `${mes}%`)
    }

    // Ordenação e paginação
    query = query
      .order('data_vencimento', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar pagamentos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pagamentos' },
        { status: 500 }
      )
    }

    let listaCpfsDependentes: string[] = []
    
    if (gestor && gestor.torcida_id) {
      const torcidaConsulta = torcidaId || gestor.torcida_id
      
      const { data: depData } = await supabaseAdmin
        .from('dependentes')
        .select('cpf')
        .eq('torcida_id', torcidaConsulta)
        .neq('status', 'cancelado')

      if (depData) {
        listaCpfsDependentes = depData.map(d => d.cpf).filter(Boolean)
      }
    }

    return NextResponse.json({
      pagamentos: data || [],
      total: count || 0,
      limit,
      offset,
      listaDependentes: listaCpfsDependentes
    })
  } catch (error) {
    console.error('Erro na API pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
