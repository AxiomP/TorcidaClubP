import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * API: Dashboard Statistics
 * GET /api/dashboard/stats
 *
 * Retorna métricas agregadas para o dashboard de gestor:
 * - Total de sócios e distribuição por status
 * - Receita mensal e anual
 * - Pagamentos e cadastros pendentes
 * - Eventos próximos
 * - Comparações com períodos anteriores
 */
export async function GET() {
  try {
    const supabase = await createClient()

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

    // Calcular datas para comparações
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    console.log('[API Stats] Iniciando queries em paralelo...')

    // EXECUTAR TODAS AS QUERIES EM PARALELO
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const [
      totalSociosResult,
      sociosByStatusResult,
      newMembersThisMonthResult,
      newMembersLastMonthResult,
      paymentsThisMonthResult,
      paymentsLastMonthResult,
      paymentsThisYearResult,
      pagamentosPendentesResult,
      cadastrosPendentesResult,
      eventosProximosResult,
      totalPagamentosVencidosResult,
      pagamentosConfirmadosResult,
    ] = await Promise.all([
      // 1. Total sócios
      supabaseAdmin.from('socios').select('*', { count: 'exact', head: true })
        .eq('torcida_id', torcidaId),

      // 2. Sócios por status
      supabaseAdmin.from('socios').select('status')
        .eq('torcida_id', torcidaId),

      // 3. Novos sócios este mês
      supabaseAdmin.from('socios').select('*', { count: 'exact', head: true })
        .eq('torcida_id', torcidaId)
        .gte('created_at', firstDayOfMonth.toISOString()),

      // 4. Novos sócios mês anterior
      supabaseAdmin.from('socios').select('*', { count: 'exact', head: true })
        .eq('torcida_id', torcidaId)
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lte('created_at', lastDayOfLastMonth.toISOString()),

      // 5. Receita mensal
      supabaseAdmin.from('pagamentos').select('valor_pago')
        .eq('torcida_id', torcidaId)
        .eq('status', 'confirmado')
        .gte('data_confirmacao', firstDayOfMonth.toISOString()),

      // 6. Receita mês anterior
      supabaseAdmin.from('pagamentos').select('valor_pago')
        .eq('torcida_id', torcidaId)
        .eq('status', 'confirmado')
        .gte('data_confirmacao', firstDayOfLastMonth.toISOString())
        .lte('data_confirmacao', lastDayOfLastMonth.toISOString()),

      // 7. Receita anual
      supabaseAdmin.from('pagamentos').select('valor_pago')
        .eq('torcida_id', torcidaId)
        .eq('status', 'confirmado')
        .gte('data_confirmacao', firstDayOfYear.toISOString()),

      // 8. Pagamentos pendentes
      supabaseAdmin.from('pagamentos').select('*', { count: 'exact', head: true })
        .eq('torcida_id', torcidaId)
        .eq('status', 'comprovante_enviado'),

      // 9. Cadastros pendentes
      supabaseAdmin.from('socios').select('*', { count: 'exact', head: true })
        .eq('torcida_id', torcidaId)
        .eq('status', 'pendente'),

      // 10. Eventos próximos
      supabaseAdmin.from('eventos').select('*', { count: 'exact', head: true })
        .eq('torcida_id', torcidaId)
        .eq('status', 'ativo')
        .gte('data_hora', now.toISOString())
        .lte('data_hora', thirtyDaysFromNow.toISOString()),

      // 11. Total pagamentos vencidos
      supabaseAdmin.from('pagamentos').select('*', { count: 'exact', head: true })
        .eq('torcida_id', torcidaId)
        .lt('data_vencimento', now.toISOString()),

      // 12. Pagamentos confirmados vencidos
      supabaseAdmin.from('pagamentos').select('*', { count: 'exact', head: true })
        .eq('torcida_id', torcidaId)
        .eq('status', 'confirmado')
        .lt('data_vencimento', now.toISOString()),
    ])

    console.log('[API Stats] Queries concluídas, processando resultados...')

    // Verificar erros
    if (totalSociosResult.error) throw totalSociosResult.error
    if (sociosByStatusResult.error) throw sociosByStatusResult.error
    if (newMembersThisMonthResult.error) throw newMembersThisMonthResult.error
    if (newMembersLastMonthResult.error) throw newMembersLastMonthResult.error
    if (paymentsThisMonthResult.error) throw paymentsThisMonthResult.error
    if (paymentsLastMonthResult.error) throw paymentsLastMonthResult.error
    if (paymentsThisYearResult.error) throw paymentsThisYearResult.error
    if (pagamentosPendentesResult.error) throw pagamentosPendentesResult.error
    if (cadastrosPendentesResult.error) throw cadastrosPendentesResult.error
    if (eventosProximosResult.error) throw eventosProximosResult.error
    if (totalPagamentosVencidosResult.error) throw totalPagamentosVencidosResult.error
    if (pagamentosConfirmadosResult.error) throw pagamentosConfirmadosResult.error

    // Processar resultados
    const totalSocios = totalSociosResult.count
    const newMembersThisMonth = newMembersThisMonthResult.count
    const newMembersLastMonth = newMembersLastMonthResult.count
    const pagamentosPendentes = pagamentosPendentesResult.count
    const cadastrosPendentes = cadastrosPendentesResult.count
    const eventosProximos = eventosProximosResult.count
    const totalPagamentosVencidos = totalPagamentosVencidosResult.count
    const pagamentosConfirmados = pagamentosConfirmadosResult.count

    const statusCounts = sociosByStatusResult.data?.reduce((acc: Record<string, number>, socio) => {
      acc[socio.status] = (acc[socio.status] || 0) + 1
      return acc
    }, {}) || {}

    const ativoCount = statusCounts['ativo'] || 0
    const inadimplenteCount = statusCounts['inadimplente'] || 0
    const bloqueadoCount = statusCounts['bloqueado'] || 0
    const pendenteCount = statusCounts['pendente'] || 0

    const receitaMensal = paymentsThisMonthResult.data?.reduce((sum, p) => sum + (parseFloat(String(p.valor_pago ?? 0)) || 0), 0) || 0
    const receitaMesAnterior = paymentsLastMonthResult.data?.reduce((sum, p) => sum + (parseFloat(String(p.valor_pago ?? 0)) || 0), 0) || 0
    const receitaAnual = paymentsThisYearResult.data?.reduce((sum, p) => sum + (parseFloat(String(p.valor_pago ?? 0)) || 0), 0) || 0

    const taxaCobranca = (totalPagamentosVencidos ?? 0) > 0
      ? ((pagamentosConfirmados ?? 0) / (totalPagamentosVencidos ?? 1)) * 100
      : 0

    // CALCULAR TENDÊNCIAS
    const memberGrowthTrend = (newMembersLastMonth ?? 0) > 0
      ? (((newMembersThisMonth ?? 0) - (newMembersLastMonth ?? 0)) / (newMembersLastMonth ?? 1)) * 100
      : (newMembersThisMonth ?? 0) > 0 ? 100 : 0

    const revenueTrend = receitaMesAnterior > 0
      ? ((receitaMensal - receitaMesAnterior) / receitaMesAnterior) * 100
      : receitaMensal > 0 ? 100 : 0

    // MONTAR RESPOSTA
    const stats = {
      members: {
        total: totalSocios || 0,
        active: ativoCount,
        delinquent: inadimplenteCount,
        blocked: bloqueadoCount,
        pending: pendenteCount,
        newThisMonth: newMembersThisMonth || 0,
        newLastMonth: newMembersLastMonth || 0,
        growthTrend: parseFloat(memberGrowthTrend.toFixed(1)),
      },
      revenue: {
        monthly: receitaMensal,
        yearly: receitaAnual,
        lastMonth: receitaMesAnterior,
        trend: parseFloat(revenueTrend.toFixed(1)),
      },
      pending: {
        payments: pagamentosPendentes || 0,
        registrations: cadastrosPendentes || 0,
        total: (pagamentosPendentes || 0) + (cadastrosPendentes || 0),
      },
      events: {
        upcoming: eventosProximos || 0,
      },
      metrics: {
        collectionRate: parseFloat(taxaCobranca.toFixed(1)),
      },
    }

    console.log('[API Stats] Estatísticas montadas com sucesso')
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[API Stats] Erro ao buscar estatísticas do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
