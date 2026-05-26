import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * API Route para CRUD de eventos
 * Gerencia jogos, festas e atividades da torcida
 *
 * Schema da tabela eventos:
 * - nome_evento (VARCHAR)
 * - time_casa, time_visitante (VARCHAR)
 * - data_hora (TIMESTAMPTZ)
 * - qtd_ingressos_total, qtd_ingressos_vendidos (INT)
 * - status: 'ativo' | 'encerrado' | 'cancelado'
 */

function aplicarTimezoneBrasilia(dataString: unknown): string | null {
  if (!dataString || typeof dataString !== 'string') return null
  
  // Se a string já tiver informação de fuso (Z ou -03:00), retorna ela mesma
  if (dataString.includes('Z') || /[-+]\d{2}:\d{2}$/.test(dataString)) {
    return dataString
  }
  
  // Se for apenas data pura (YYYY-MM-DD), anexa o início do dia no fuso correto
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
    return `${dataString}T00:00:00-03:00`
  }

  // Se for data e hora (YYYY-MM-DDTHH:mm), anexa o fuso de Brasília
  return `${dataString}-03:00`
}

/**
 * GET /api/eventos?torcida_id=xxx
 * Lista todos os eventos de uma torcida
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const torcidaId = searchParams.get('torcida_id')
    const filter = searchParams.get('filter') // 'todos', 'futuros', 'passados'

    // Validar torcida_id
    if (!torcidaId) {
      return NextResponse.json(
        { error: 'torcida_id e obrigatorio' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Validar que o usuário autenticado pertence à torcida solicitada
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (gestor) {
      if (gestor.torcida_id !== torcidaId) {
        return NextResponse.json({ error: 'Sem permissão para esta torcida' }, { status: 403 })
      }
    } else {
      const { data: socio } = await supabaseAdmin
        .from('socios')
        .select('torcida_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      if (!socio || socio.torcida_id !== torcidaId) {
        return NextResponse.json({ error: 'Sem permissão para esta torcida' }, { status: 403 })
      }
    }

    // Buscar eventos da torcida — supabaseAdmin contorna política RLS com deleted_at removido
    let query = supabaseAdmin
      .from('eventos')
      .select('*')
      .eq('torcida_id', torcidaId)
      .order('data_hora', { ascending: true })

    // Aplicar filtro de data
    const now = new Date().toISOString()
    if (filter === 'futuros') {
      query = query.gte('data_hora', now)
    } else if (filter === 'passados') {
      query = query.lt('data_hora', now)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar eventos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar eventos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      eventos: data || []
    })
  } catch (error) {
    console.error('Erro na API eventos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/eventos
 * Cria um novo evento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      torcida_id,
      nome,
      nome_evento,
      data_evento,
      data_hora,
      local,
      time_casa,
      time_visitante,
      capacidade_total,
      qtd_ingressos_total,
      status = 'ativo',
      valor_socio,
      valor_dependente,
      valor_adicional,
      data_fim_vendas,
      pagar_ate,
      ranking_minimo,
      permite_dependentes = true,
      permite_adicionais = true,
    } = body

    // Usar nomes corretos do schema (com fallback para nomes antigos)
    const nomeEvento = nome_evento || nome
    const dataHoraRaw = data_hora || data_evento
    const qtdIngressosTotal = qtd_ingressos_total || capacidade_total

    // Validacoes
    if (!torcida_id || !nomeEvento || !dataHoraRaw || !local) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: torcida_id, nome_evento, data_hora, local' },
        { status: 400 }
      )
    }

    if (!qtdIngressosTotal || qtdIngressosTotal <= 0) {
      return NextResponse.json(
        { error: 'qtd_ingressos_total deve ser maior que 0' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se usuario e gestor da torcida
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor || gestor.torcida_id !== torcida_id) {
      return NextResponse.json(
        { error: 'Sem permissao para esta torcida' },
        { status: 403 }
      )
    }

    const dataHoraFinal = aplicarTimezoneBrasilia(dataHoraRaw)
    const dataFimVendasFinal = aplicarTimezoneBrasilia(data_fim_vendas) || dataHoraFinal
    const pagarAteFinal = aplicarTimezoneBrasilia(pagar_ate) || (dataHoraFinal ? dataHoraFinal.split('T')[0] : null)

    // 1. Validamos estritamente a existência do dado obrigatório antes de prosseguir
    if (!dataHoraFinal) {
      return NextResponse.json(
        { error: 'Formato de data_hora inválido.' },
        { status: 400 }
      )
    }

    const totalInical = Math.max(0, Number(qtdIngressosTotal || 0))

    const novoEvento = {
      torcida_id: torcida_id as string,
      nome_evento: nomeEvento as string,
      local: local as string,
      data_hora: dataHoraFinal,
      qtd_ingressos_total: totalInical,
      qtd_ingressos_vendidos: 0,
      qtd_ingressos_disponiveis: totalInical, // Garante que nasce exatamente igual ao total informado
      status: status === 'planejado' || status === 'confirmado' ? 'ativo' : (status as 'ativo' | 'encerrado' | 'cancelado'),
      time_casa: (time_casa as string) || null,
      time_visitante: (time_visitante as string) || null,
      
      ranking_minimo: ranking_minimo ? (ranking_minimo as 'bronze' | 'prata' | 'ouro') : null,
      
      valor_socio: valor_socio ? Number(valor_socio) : null,
      valor_dependente: valor_dependente ? Number(valor_dependente) : null,
      valor_adicional: valor_adicional ? Number(valor_adicional) : null,
      data_fim_vendas: dataFimVendasFinal || dataHoraFinal,
      pagar_ate: pagarAteFinal || dataHoraFinal.split('T')[0],
      permite_dependentes: Boolean(permite_dependentes),
      permite_adicionais: Boolean(permite_adicionais),
    }

    // 3. Realizamos a inserção com o payload perfeitamente mapeado
    const { data, error } = await supabaseAdmin
      .from('eventos')
      .insert(novoEvento)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar evento:', error)
      return NextResponse.json(
        { error: 'Erro ao criar evento: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      evento: data,
      message: 'Evento criado com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro na API eventos POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/eventos
 * Atualiza um evento existente
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      id,
      // Aceita nomes antigos para compatibilidade
      nome,
      nome_evento,
      data_evento,
      data_hora,
      local,
      time_casa,
      time_visitante,
      capacidade_total,
      qtd_ingressos_total,
      status,
      valor_socio,
      valor_dependente,
      valor_adicional,
      data_fim_vendas,
      pagar_ate,
      ranking_minimo,
      permite_dependentes,
      permite_adicionais,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID e obrigatorio' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se usuario e gestor
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    // Buscar evento existente — supabaseAdmin contorna RLS com deleted_at removido
    const { data: eventoExistente } = await supabaseAdmin
      .from('eventos')
      .select('torcida_id, qtd_ingressos_total, qtd_ingressos_disponiveis')
      .eq('id', id)
      .maybeSingle()

    if (!eventoExistente) {
      return NextResponse.json(
        { error: 'Evento nao encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissao
    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor || gestor.torcida_id !== eventoExistente.torcida_id) {
      return NextResponse.json(
        { error: 'Sem permissao para esta torcida' },
        { status: 403 }
      )
    }

    // Preparar dados de atualizacao (usando nomes corretos das colunas)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Mapear campos antigos para novos
    const nomeEvento = nome_evento || nome
    const dataHora = data_hora || data_evento
    const qtdIngressos = qtd_ingressos_total || capacidade_total

    if (nomeEvento !== undefined) updateData.nome_evento = nomeEvento
    if (dataHora !== undefined) updateData.data_hora = aplicarTimezoneBrasilia(dataHora)
    if (local !== undefined) updateData.local = local
    if (time_casa !== undefined) updateData.time_casa = time_casa
    if (time_visitante !== undefined) updateData.time_visitante = time_visitante
    if (qtdIngressos !== undefined) {
      const novoTotal = Number(qtdIngressos)
      updateData.qtd_ingressos_total = novoTotal
      
      const totalVendidoOriginal = Math.max(0, (eventoExistente.qtd_ingressos_total || 0) - (eventoExistente.qtd_ingressos_disponiveis || 0))
      
      updateData.qtd_ingressos_disponiveis = Math.max(0, novoTotal - totalVendidoOriginal)
    }
    if (status !== undefined) {
      // Mapear status antigos para novos
      if (status === 'planejado' || status === 'confirmado') {
        updateData.status = 'ativo'
      } else if (status === 'realizado') {
        updateData.status = 'encerrado'
      } else {
        updateData.status = status
      }
    }
    if (valor_socio !== undefined) updateData.valor_socio = valor_socio
    if (valor_dependente !== undefined) updateData.valor_dependente = valor_dependente
    if (valor_adicional !== undefined) updateData.valor_adicional = valor_adicional
    if (data_fim_vendas !== undefined) updateData.data_fim_vendas = aplicarTimezoneBrasilia(data_fim_vendas)
    if (pagar_ate !== undefined) updateData.pagar_ate = aplicarTimezoneBrasilia(pagar_ate)
    if (ranking_minimo !== undefined) updateData.ranking_minimo = ranking_minimo || null
    if (permite_dependentes !== undefined) updateData.permite_dependentes = permite_dependentes
    if (permite_adicionais !== undefined) updateData.permite_adicionais = permite_adicionais

    const { data, error } = await supabaseAdmin
      .from('eventos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar evento:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      evento: data,
      message: 'Evento atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro na API eventos PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/eventos?id=xxx
 * Exclui um evento
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID e obrigatorio' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se usuario e gestor
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    // Buscar evento existente — supabaseAdmin contorna RLS com deleted_at removido
    const { data: eventoExistente } = await supabaseAdmin
      .from('eventos')
      .select('torcida_id')
      .eq('id', id)
      .maybeSingle()

    if (!eventoExistente) {
      return NextResponse.json(
        { error: 'Evento nao encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissao
    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor || gestor.torcida_id !== eventoExistente.torcida_id) {
      return NextResponse.json(
        { error: 'Sem permissao para esta torcida' },
        { status: 403 }
      )
    }

    // Excluir evento — supabaseAdmin contorna RLS com deleted_at removido
    const { error } = await supabaseAdmin
      .from('eventos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir evento:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Evento excluido com sucesso'
    })
  } catch (error) {
    console.error('Erro na API eventos DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
