import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

/**
 * GET /api/ingressos
 * Lista compras de ingressos da torcida do gestor autenticado
 * Query params: status, evento_id, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const eventoId = searchParams.get('evento_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor || !gestor.torcida_id) {
      return NextResponse.json({ error: 'Usuário não é gestor' }, { status: 403 })
    }

    // Buscar IDs dos eventos da torcida
    const { data: eventos } = await supabaseAdmin
      .from('eventos')
      .select('id, nome_evento, data_hora')
      .eq('torcida_id', gestor.torcida_id)

    if (!eventos || eventos.length === 0) {
      return NextResponse.json({ ingressos: [] })
    }

    const eventoIds = eventos.map((e) => e.id)
    const eventoMap = Object.fromEntries(
      eventos.map((e) => [e.id, { id: e.id, nome: e.nome_evento, data_hora: e.data_hora }])
    )

    // Buscar compras dos eventos da torcida
    type IngressoStatus = 'pendente' | 'comprovante_enviado' | 'aprovado' | 'recusado' | 'usado'
    const validStatuses: IngressoStatus[] = ['pendente', 'comprovante_enviado', 'aprovado', 'recusado', 'usado']

    let query = supabaseAdmin
      .from('compras_ingressos')
      .select(`
        id, evento_id, socio_id, dependente_id, tipo_ingresso, valor,
        comprovante_url, status, codigo_validacao, aprovado_por,
        nome_adicional, cpf_adicional, created_at,
        socios(id, nome_completo, apelido, cpf, whatsapp)
      `)
      .in('evento_id', eventoIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'todos' && validStatuses.includes(status as IngressoStatus)) {
      query = query.eq('status', status as IngressoStatus)
    }
    if (eventoId) {
      query = query.eq('evento_id', eventoId)
    }

    const { data: ingressos, error } = await query

    if (error) {
      console.error('Erro ao listar ingressos:', error)
      return NextResponse.json({ error: 'Erro ao buscar ingressos' }, { status: 500 })
    }

    // Injetar dados do evento manualmente (sem join problemático)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ingressosComEvento = (ingressos || []).map((i: any) => ({
      ...i,
      motivo_recusa: (i as Record<string, unknown>).motivo_recusa ?? null,
      eventos: eventoMap[i.evento_id] ?? null,
    }))

    return NextResponse.json({ ingressos: ingressosComEvento })
  } catch (error) {
    console.error('Erro na API ingressos GET:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * POST /api/ingressos
 * Cria uma ou múltiplas solicitações de ingressos para um evento
 * Suporta tipos: socio, dependente, adicional
 * 
 * Body pode ser:
 * 1. Single ingresso (compatibilidade): { evento_id, tipo_ingresso, ... }
 * 2. Múltiplos ingressos: { evento_id, ingressos: [{tipo_ingresso, ...}, ...] }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[ingressos POST] Iniciando requisição')
    
    let body
    try {
      body = await request.json()
      console.log('[ingressos POST] Body recebido:', { evento_id: body.evento_id, ingressos: body.ingressos?.length || 'undefined' })
    } catch (e) {
      console.error('[ingressos POST] Erro ao fazer parse do JSON:', e)
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      )
    }

    const { evento_id, tipo_ingresso, dependente_id, nome_adicional, cpf_adicional, ingressos: ingressosArray } = body

    if (!evento_id) {
      return NextResponse.json(
        { error: 'evento_id é obrigatório' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = await createClient()
      console.log('[ingressos POST] Supabase client criado')
    } catch (e) {
      console.error('[ingressos POST] Erro ao criar Supabase client:', e)
      return NextResponse.json(
        { error: 'Erro ao inicializar cliente' },
        { status: 500 }
      )
    }

    // Verificar autenticação
    let user
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
      if (!user) {
        console.log('[ingressos POST] Usuário não autenticado')
        return NextResponse.json(
          { error: 'Não autenticado' },
          { status: 401 }
        )
      }
      console.log('[ingressos POST] Usuário autenticado:', user.id)
    } catch (e) {
      console.error('[ingressos POST] Erro ao obter usuário:', e)
      return NextResponse.json(
        { error: 'Erro ao verificar autenticação' },
        { status: 500 }
      )
    }

    // Buscar dados do sócio
    let socio
    try {
      const { data, error } = await supabaseAdmin
        .from('socios')
        .select('id, torcida_id, status, ranking')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      
      if (error) {
        console.error('[ingressos POST] Erro ao buscar sócio:', error)
        throw error
      }
      
      socio = data
      console.log('[ingressos POST] Sócio encontrado:', { id: socio?.id, torcida_id: socio?.torcida_id })
    } catch (e) {
      console.error('[ingressos POST] Erro ao buscar sócio:', e)
      return NextResponse.json(
        { error: 'Erro ao buscar dados do sócio' },
        { status: 500 }
      )
    }

    if (!socio) {
      console.log('[ingressos POST] Sócio não encontrado para user:', user.id)
      return NextResponse.json(
        { error: 'Sócio não encontrado' },
        { status: 404 }
      )
    }

    if (socio.status !== 'ativo') {
      console.log('[ingressos POST] Sócio não está ativo, status:', socio.status)
      return NextResponse.json(
        { error: 'Apenas sócios ativos podem solicitar ingressos' },
        { status: 403 }
      )
    }

    // Buscar dados do evento
    let evento
    try {
      const { data, error } = await supabaseAdmin
        .from('eventos')
        .select('id, torcida_id, status, data_hora, ranking_minimo, valor_socio, valor_dependente, valor_adicional, qtd_ingressos_disponiveis, qtd_ingressos_total, qtd_ingressos_vendidos, permite_dependentes, permite_adicionais, data_fim_vendas')
        .eq('id', evento_id)
        .maybeSingle()
      
      if (error) {
        console.error('[ingressos POST] Erro ao buscar evento:', error)
        throw error
      }
      
      evento = data
      console.log('[ingressos POST] Evento encontrado:', { id: evento?.id, torcida_id: evento?.torcida_id })
    } catch (e) {
      console.error('[ingressos POST] Erro ao buscar evento:', e)
      return NextResponse.json(
        { error: 'Erro ao buscar dados do evento' },
        { status: 500 }
      )
    }

    if (!evento) {
      console.log('[ingressos POST] Evento não encontrado:', evento_id)
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    if (evento.torcida_id !== socio.torcida_id) {
      console.log('[ingressos POST] Evento não pertence à torcida do sócio')
      return NextResponse.json(
        { error: 'Evento não pertence à sua torcida' },
        { status: 403 }
      )
    }

    if (evento.status !== 'ativo') {
      console.log('[ingressos POST] Evento não está ativo, status:', evento.status)
      return NextResponse.json(
        { error: 'Evento não está disponível para compra' },
        { status: 400 }
      )
    }

    // Verificar data limite de vendas
    if (evento.data_fim_vendas) {
      let dataLimite: Date

      // Se vier apenas a data YYYY-MM-DD, injetamos o final do dia com o fuso de Brasília (-03:00)
      if (evento.data_fim_vendas.includes('T')) {
        dataLimite = new Date(evento.data_fim_vendas)
      } else {
        // Força o fechamento no último segundo do dia, travado no fuso UTC-3 (Brasília)
        dataLimite = new Date(`${evento.data_fim_vendas}T23:59:59-03:00`)
      }
      
      const agora = new Date()
      
      console.log('[ingressos POST] Verificando data limite corrigida:')
      console.log('[ingressos POST] Data fim vendas original:', evento.data_fim_vendas)
      console.log('[ingressos POST] Data limite calculada (UTC):', dataLimite.toISOString())
      console.log('[ingressos POST] Data atual (UTC):', agora.toISOString())
      console.log('[ingressos POST] Vendas encerradas?', agora > dataLimite)
      
      if (agora > dataLimite) {
        console.log('[ingressos POST] Vendas encerradas para este evento')
        return NextResponse.json(
          { error: 'As vendas para este evento já foram encerradas' },
          { status: 400 }
        )
      }
    }

    // Determinar lista de ingressos a processar
    const ingressosToCreate: Array<{
      tipo_ingresso: 'socio' | 'dependente' | 'adicional'
      dependente_id?: string
      nome_adicional?: string
      cpf_adicional?: string
    }> = ingressosArray || [
      { tipo_ingresso, dependente_id, nome_adicional, cpf_adicional }
    ]

    console.log('[ingressos POST] Ingressos a processar:', ingressosToCreate.length)

    // Validar cada ingresso antes de criar
    const rankingOrder: Record<string, number> = { bronze: 0, prata: 1, ouro: 2 }
    
    for (const ing of ingressosToCreate) {
      if (!ing.tipo_ingresso) {
        console.log('[ingressos POST] tipo_ingresso não fornecido')
        return NextResponse.json(
          { error: 'tipo_ingresso é obrigatório para cada ingresso' },
          { status: 400 }
        )
      }

      if (ing.tipo_ingresso === 'dependente' && !ing.dependente_id) {
        console.log('[ingressos POST] dependente_id não fornecido para ingresso dependente')
        return NextResponse.json(
          { error: 'dependente_id é obrigatório para ingresso de dependente' },
          { status: 400 }
        )
      }

      if (ing.tipo_ingresso === 'adicional' && (!ing.nome_adicional || !ing.cpf_adicional)) {
        console.log('[ingressos POST] nome_adicional ou cpf_adicional não fornecidos')
        return NextResponse.json(
          { error: 'nome_adicional e cpf_adicional são obrigatórios para ingresso adicional' },
          { status: 400 }
        )
      }

      // Se dependente, verificar que pertence ao sócio
      if (ing.tipo_ingresso === 'dependente' && ing.dependente_id) {
        try {
          const { data: dep, error: depError } = await supabaseAdmin
            .from('dependentes')
            .select('id')
            .eq('id', ing.dependente_id)
            .eq('socio_titular_id', socio.id)
            .maybeSingle()

          if (depError) {
            console.error('[ingressos POST] Erro ao buscar dependente:', depError)
            throw depError
          }

          if (!dep) {
            console.log('[ingressos POST] Dependente não pertence ao sócio:', ing.dependente_id)
            return NextResponse.json(
              { error: 'Dependente não encontrado ou não pertence a este sócio' },
              { status: 403 }
            )
          }
        } catch (e) {
          console.error('[ingressos POST] Erro ao validar dependente:', e)
          return NextResponse.json(
            { error: 'Erro ao validar dependente' },
            { status: 500 }
          )
        }
      }

      // Validar ranking mínimo (apenas para sócio; dependentes e adicionais seguem o mesmo ranking)
      if (evento.ranking_minimo) {
        const socioRankOrder = rankingOrder[socio.ranking ?? 'bronze'] ?? 0
        const minRankOrder = rankingOrder[evento.ranking_minimo] ?? 0
        if (socioRankOrder < minRankOrder) {
          console.log('[ingressos POST] Sócio não tem ranking suficiente:', socio.ranking)
          return NextResponse.json(
            { error: `Este evento requer ranking ${evento.ranking_minimo} ou superior` },
            { status: 403 }
          )
        }
      }
    }

    // Quando disponíveis é NULL, calcular a partir de total - vendidos; se total também é NULL, sem limite
    const ingressosDisponiveis = evento.qtd_ingressos_disponiveis !== null
      ? evento.qtd_ingressos_disponiveis
      : evento.qtd_ingressos_total !== null
        ? evento.qtd_ingressos_total - (evento.qtd_ingressos_vendidos ?? 0)
        : null // null = sem limite de vagas

    console.log('[ingressos POST] Cálculo de disponibilidade:')
    console.log('[ingressos POST] qtd_ingressos_disponiveis:', evento.qtd_ingressos_disponiveis)
    console.log('[ingressos POST] qtd_ingressos_total:', evento.qtd_ingressos_total)
    console.log('[ingressos POST] qtd_ingressos_vendidos:', evento.qtd_ingressos_vendidos)
    console.log('[ingressos POST] ingressosDisponiveis calculado:', ingressosDisponiveis)

    if (ingressosDisponiveis !== null && ingressosDisponiveis < ingressosToCreate.length) {
      console.log('[ingressos POST] Ingressos insuficientes disponíveis')
      return NextResponse.json(
        { error: 'Não há ingressos disponíveis suficientes para este evento' },
        { status: 400 }
      )
    }

    // Criar todos os ingressos usando um prefixo de lote e códigos únicos por ingresso
    let loteId: string
    try {
      loteId = crypto.randomUUID()
    } catch (e) {
      console.error('[ingressos POST] Erro ao gerar lote UUID:', e)
      return NextResponse.json(
        { error: 'Erro ao gerar identificador de lote' },
        { status: 500 }
      )
    }

    // Usar apenas parte do UUID para manter dentro do limite de 50 caracteres
    const lotePrefix = `batch-${loteId.substring(0, 8)}-${Date.now().toString().slice(-6)}`
    const comprasToInsert: Database['public']['Tables']['compras_ingressos']['Insert'][] = []
    let valorTotal = 0

    console.log(`[ingressos POST] Criando lote ${lotePrefix} com ${ingressosToCreate.length} ingressos`)

    try {
      ingressosToCreate.forEach((ing, index) => {
        // Determinar valor com base no tipo
        let valor: number
        if (ing.tipo_ingresso === 'dependente') {
          valor = evento.valor_dependente ?? evento.valor_socio ?? 0
        } else if (ing.tipo_ingresso === 'adicional') {
          valor = evento.valor_adicional ?? evento.valor_socio ?? 0
        } else {
          valor = evento.valor_socio ?? 0
        }

        valorTotal += valor

        const codigoValidacao = `${lotePrefix}-ticket-${index + 1}`
        console.log(`[ingressos POST] Ingresso ${index + 1}: ${codigoValidacao}`)

        comprasToInsert.push({
          evento_id,
          socio_id: socio.id,
          tipo_ingresso: ing.tipo_ingresso,
          valor,
          status: 'pendente',
          codigo_validacao: codigoValidacao,
          dependente_id: ing.tipo_ingresso === 'dependente' ? ing.dependente_id ?? null : null,
          nome_adicional: ing.tipo_ingresso === 'adicional' ? ing.nome_adicional ?? null : null,
          cpf_adicional: ing.tipo_ingresso === 'adicional' ? (ing.cpf_adicional?.replace(/\D/g, '') ?? null) : null,
        })
      })
    } catch (e) {
      console.error('[ingressos POST] Erro ao preparar ingressos para inserção:', e)
      return NextResponse.json(
        { error: 'Erro ao preparar ingressos' },
        { status: 500 }
      )
    }

    console.log('[ingressos POST] Preparando inserção de', comprasToInsert.length, 'ingressos')

    // Inserir todos os ingressos de uma vez
    let compras
    try {
      const { data, error: insertError } = await supabaseAdmin
        .from('compras_ingressos')
        .insert(comprasToInsert)
        .select()

      if (insertError) {
        console.error('[ingressos POST] Erro ao inserir ingressos:', insertError)
        console.error('[ingressos POST] Detalhes do erro:', {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          message: insertError.message
        })

        if (insertError.code === '23505' && insertError.details?.includes('codigo_validacao')) {
          console.error('[ingressos POST] Conflito de codigo_validacao. Primeiro código:', comprasToInsert[0]?.codigo_validacao)

          return NextResponse.json(
            { error: 'Já existe um pedido de ingresso com este código de validação. Tente novamente em alguns instantes ou verifique seus ingressos pendentes.' },
            { status: 400 }
          )
        }
        throw insertError
      }

      compras = data
      console.log('[ingressos POST] Ingressos inseridos com sucesso:', compras?.length)
    } catch (e) {
      console.error('[ingressos POST] Erro ao inserir compras:', e)
      return NextResponse.json(
        { error: 'Erro ao criar solicitação de ingressos' },
        { status: 500 }
      )
    }

    if (!compras || compras.length === 0) {
      console.log('[ingressos POST] Lista de ingressos vazia após inserção')
      return NextResponse.json(
        { error: 'Erro ao criar solicitação de ingressos' },
        { status: 500 }
      )
    }

    // Retornar primeiro ingresso e valor total para o TorPIX
    console.log('[ingressos POST] Retornando resposta de sucesso com', compras.length, 'ingressos')
    
    return NextResponse.json(
      {
        ingresso: compras[0],
        ingressos: compras,
        valorTotal,
        loteId,
        ingressoIds: compras.map((compra) => compra.id),
        message: `${compras.length} ingresso(s) solicitado(s) com sucesso`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[ingressos POST] Erro não tratado na API:', error)
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('[ingressos POST] Erro message:', error.message)
      console.error('[ingressos POST] Erro stack:', error.stack)
    } else {
      console.error('[ingressos POST] Erro tipo desconhecido:', typeof error, error)
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
