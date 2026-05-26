import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * API: Dashboard Charts Data
 * GET /api/dashboard/charts
 *
 * Retorna dados para gráficos do dashboard:
 * - Receita mensal (últimos 12 meses)
 * - Crescimento de membros (últimos 6 meses)
 * - Distribuição por status
 * - Ranking de tipos de mensalidade
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date()

    // Obter usuario e torcida_id
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor?.torcida_id) {
      return NextResponse.json({ error: 'Gestor sem torcida' }, { status: 403 })
    }

    const torcidaId = gestor.torcida_id

    console.log('[API Charts] Iniciando queries em paralelo...')

    // 1. RECEITA MENSAL - Últimos 12 meses (paralelizar)
    const revenuePromises = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const firstDay = startOfMonth(monthDate)
      const lastDay = endOfMonth(monthDate)

      revenuePromises.push(
        supabaseAdmin
          .from('pagamentos')
          .select('valor_pago')
          .eq('torcida_id', torcidaId)
          .eq('status', 'confirmado')
          .gte('data_confirmacao', firstDay.toISOString())
          .lte('data_confirmacao', lastDay.toISOString())
          .then(({ data: payments, error }) => {
            if (error) throw error

            const total = payments?.reduce((sum, p) => sum + (parseFloat(String(p.valor_pago ?? 0)) || 0), 0) || 0

            return {
              month: format(monthDate, 'MMM/yy', { locale: ptBR }),
              fullMonth: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
              revenue: parseFloat(total.toFixed(2)),
              year: monthDate.getFullYear(),
            }
          })
      )
    }

    // 2. CRESCIMENTO DE MEMBROS - Últimos 6 meses (paralelizar)
    const memberGrowthPromises = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const firstDay = startOfMonth(monthDate)
      const lastDay = endOfMonth(monthDate)

      memberGrowthPromises.push(
        Promise.all([
          supabaseAdmin
            .from('socios')
            .select('*', { count: 'exact', head: true })
            .eq('torcida_id', torcidaId)
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString()),
          supabaseAdmin
            .from('socios')
            .select('*', { count: 'exact', head: true })
            .eq('torcida_id', torcidaId)
            .lte('created_at', lastDay.toISOString())
        ]).then(([newResult, totalResult]) => {
          if (newResult.error) throw newResult.error
          if (totalResult.error) throw totalResult.error

          return {
            month: format(monthDate, 'MMM/yy', { locale: ptBR }),
            fullMonth: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
            newMembers: newResult.count || 0,
            totalMembers: totalResult.count || 0,
          }
        })
      )
    }

    // 3. ENGAJAMENTO - Últimos 6 meses (contagem de pagamentos confirmados + cadastros)
    const engajamentoPromises = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const firstDay = startOfMonth(monthDate)
      const lastDay = endOfMonth(monthDate)

      engajamentoPromises.push(
        Promise.all([
          supabaseAdmin
            .from('pagamentos')
            .select('*', { count: 'exact', head: true })
            .eq('torcida_id', torcidaId)
            .eq('status', 'confirmado')
            .gte('data_confirmacao', firstDay.toISOString())
            .lte('data_confirmacao', lastDay.toISOString()),
          supabaseAdmin
            .from('socios')
            .select('*', { count: 'exact', head: true })
            .eq('torcida_id', torcidaId)
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString()),
        ]).then(([pagResult, cadastroResult]) => ({
          month: format(monthDate, 'MMM/yy', { locale: ptBR }),
          fullMonth: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
          pagamentos: pagResult.count || 0,
          cadastros: cadastroResult.count || 0,
          total: (pagResult.count || 0) + (cadastroResult.count || 0),
        }))
      )
    }

    // 4. ACESSOS - Últimos 6 meses (logins de sócios)
    const acessosPromises = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const firstDay = startOfMonth(monthDate)
      const lastDay = endOfMonth(monthDate)

      acessosPromises.push(
        supabaseAdmin
          .from('acessos_log')
          .select('*', { count: 'exact', head: true })
          .eq('torcida_id', torcidaId)
          .gte('acessado_em', firstDay.toISOString())
          .lte('acessado_em', lastDay.toISOString())
          .then(({ count, error }) => ({
            month: format(monthDate, 'MMM/yy', { locale: ptBR }),
            fullMonth: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
            acessos: error ? 0 : (count || 0),
          }))
      )
    }

    // Executar receita, crescimento, engajamento e acessos em paralelo + outras queries
    const [revenueData, memberGrowthData, engajamentoData, acessosData, allMembersResult] = await Promise.all([
      Promise.all(revenuePromises),
      Promise.all(memberGrowthPromises),
      Promise.all(engajamentoPromises),
      Promise.all(acessosPromises),
      supabaseAdmin.from('socios').select('status').eq('torcida_id', torcidaId),
    ])

    console.log('[API Charts] Queries principais concluídas')

    if (allMembersResult.error) throw allMembersResult.error
    const allMembers = allMembersResult.data

    // 3. Processar distribuição de status
    const statusCounts = allMembers?.reduce((acc: Record<string, number>, socio) => {
      acc[socio.status] = (acc[socio.status] || 0) + 1
      return acc
    }, {}) || {}

    const statusDistribution = [
      { status: 'Ativos', count: statusCounts['ativo'] || 0, color: '#10b981' },
      { status: 'Inadimplentes', count: statusCounts['inadimplente'] || 0, color: '#ef4444' },
      { status: 'Bloqueados', count: statusCounts['bloqueado'] || 0, color: '#6b7280' },
      { status: 'Pendentes', count: statusCounts['pendente'] || 0, color: '#f59e0b' },
      { status: 'Cancelados', count: statusCounts['cancelado'] || 0, color: '#8b5cf6' },
    ].filter(item => item.count > 0)

    // 4-5. Executar queries finais em paralelo
    const [sociosComTipoResult, tiposMensalidadeResult, recentPaymentsResult, recentRegistrationsResult] = await Promise.all([
      // Tipos de mensalidade — duas queries separadas para evitar dependência de FK
      supabaseAdmin
        .from('socios')
        .select('tipo_mensalidade_id')
        .eq('torcida_id', torcidaId)
        .not('tipo_mensalidade_id', 'is', null),

      supabaseAdmin
        .from('tipos_mensalidade')
        .select('id, nome, valor')
        .eq('torcida_id', torcidaId),

      // Pagamentos recentes
      supabaseAdmin
        .from('pagamentos')
        .select('id, valor_pago, data_confirmacao, socio_id')
        .eq('torcida_id', torcidaId)
        .eq('status', 'confirmado')
        .order('data_confirmacao', { ascending: false })
        .limit(10),

      // Cadastros recentes
      supabaseAdmin
        .from('socios')
        .select('id, nome_completo, created_at')
        .eq('torcida_id', torcidaId)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    console.log('[API Charts] Queries finais concluídas')

    if (recentPaymentsResult.error) throw recentPaymentsResult.error
    if (recentRegistrationsResult.error) throw recentRegistrationsResult.error

    // Processar tipos de mensalidade (join manual para evitar dependência de FK)
    const tiposMap = new Map((tiposMensalidadeResult.data || []).map(t => [t.id, t]))
    const typeCounts: Record<string, { count: number; value: number }> = {}
    ;(sociosComTipoResult.data || []).forEach((s: { tipo_mensalidade_id: string | null }) => {
      const tipo = s.tipo_mensalidade_id ? tiposMap.get(s.tipo_mensalidade_id) : null
      const typeName = tipo?.nome || 'Sem tipo'
      const typeValue = parseFloat(String(tipo?.valor ?? 0))
      if (!typeCounts[typeName]) typeCounts[typeName] = { count: 0, value: typeValue }
      typeCounts[typeName].count++
    })

    const membershipTypes = Object.entries(typeCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value,
        revenue: parseFloat((data.count * data.value).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Processar atividades recentes
    const recentActivity = {
      payments: (recentPaymentsResult.data || []).map((p: { id: string; valor_pago: number | null; data_confirmacao: string | null }) => ({
        id: p.id,
        type: 'payment',
        memberName: 'Sócio',
        amount: parseFloat(String(p.valor_pago ?? 0)),
        date: p.data_confirmacao,
      })),
      registrations: (recentRegistrationsResult.data || []).map((r: { id: string; nome_completo: string; created_at: string }) => ({
        id: r.id,
        type: 'registration',
        memberName: r.nome_completo,
        date: r.created_at,
      })),
    }

    // MONTAR RESPOSTA
    const chartsData = {
      revenue: revenueData,
      memberGrowth: memberGrowthData,
      engajamento: engajamentoData,
      acessos: acessosData,
      statusDistribution,
      membershipTypes,
      recentActivity,
    }

    console.log('[API Charts] Dados dos gráficos montados com sucesso')
    return NextResponse.json(chartsData)
  } catch (error) {
    console.error('[API Charts] Erro ao buscar dados dos gráficos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados dos gráficos' },
      { status: 500 }
    )
  }
}
