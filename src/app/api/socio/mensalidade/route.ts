import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { calcularIdade } from '@/lib/utils/calculate'

/**
 * GET /api/socio/mensalidade
 * Returns payment + plan data for the socio mensalidade page.
 * For titulares, also returns pending pagamentos of their dependentes
 * who are at or above the idade_min_pagamento threshold (titular always pays for them).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id, torcida_id, tipo_mensalidade_id, data_proximo_pagamento')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!socio) return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })

    const [torcidaRes, pagamentosRes, gestorRes] = await Promise.all([
      supabaseAdmin
        .from('torcidas')
        .select('nome, chave_pix, idade_min_pagamento')
        .eq('id', socio.torcida_id)
        .maybeSingle(),
      supabaseAdmin
        .from('pagamentos')
        .select('id, referencia_mes, valor_original, data_vencimento, status, data_pagamento, motivo_recusa')
        .eq('socio_id', socio.id)
        .order('data_vencimento', { ascending: false })
        .limit(13),
      supabaseAdmin
        .from('gestores')
        .select('telefone')
        .eq('torcida_id', socio.torcida_id)
        .eq('role', 'admin')
        .maybeSingle(),
    ])

    let tipoMensalidade = null
    if (socio.tipo_mensalidade_id) {
      const { data } = await supabaseAdmin
        .from('tipos_mensalidade')
        .select('nome, valor')
        .eq('id', socio.tipo_mensalidade_id)
        .maybeSingle()
      tipoMensalidade = data
    }

    const idadeMinPagamento = torcidaRes.data?.idade_min_pagamento ?? null

    // Buscar dependentes ativos com conta própria (auth_user_id preenchido)
    const { data: dependentesData } = await supabaseAdmin
      .from('dependentes')
      .select('id, nome_completo, data_nascimento, auth_user_id')
      .eq('socio_titular_id', socio.id)
      .eq('status', 'ativo')
      .not('auth_user_id', 'is', null)

    // Filtrar dependentes que atingiram a idade mínima de pagamento:
    // o titular paga pelas mensalidades desses dependentes (independente da idade).
    // Dependentes abaixo do limite não são cobrados e não aparecem aqui.
    const dependentesMaiores = (dependentesData || []).filter(dep => {
      if (!dep.data_nascimento || idadeMinPagamento === null) return false
      return calcularIdade(dep.data_nascimento) >= idadeMinPagamento
    })

    let pagamentosDependentes: Array<{
      id: string
      socio_id: string
      referencia_mes: string
      valor_original: number
      data_vencimento: string
      status: string
      data_pagamento: string | null
      motivo_recusa: string | null
      dependente_nome: string
    }> = []

    if (dependentesMaiores.length > 0) {
      const authUserIds = dependentesMaiores
        .map(d => d.auth_user_id)
        .filter(Boolean) as string[]

      // Encontrar os socios records dos dependentes
      const { data: sociosDeps } = await supabaseAdmin
        .from('socios')
        .select('id, auth_user_id')
        .in('auth_user_id', authUserIds)
        .eq('torcida_id', socio.torcida_id)

      if (sociosDeps && sociosDeps.length > 0) {
        // Mapear socios.id → nome do dependente
        const nomePorSocioId: Record<string, string> = {}
        for (const dep of dependentesMaiores) {
          const sociosDep = sociosDeps.find(s => s.auth_user_id === dep.auth_user_id)
          if (sociosDep) {
            nomePorSocioId[sociosDep.id] = dep.nome_completo
          }
        }

        const socioIdsParaDep = sociosDeps.map(s => s.id)

        // Buscar pagamentos pendentes/em aberto desses socios
        const { data: depPagamentos } = await supabaseAdmin
          .from('pagamentos')
          .select('id, socio_id, referencia_mes, valor_original, data_vencimento, status, data_pagamento, motivo_recusa')
          .in('socio_id', socioIdsParaDep)
          .in('status', ['pendente', 'comprovante_enviado', 'recusado'])
          .order('data_vencimento', { ascending: false })
          .limit(50)

        pagamentosDependentes = (depPagamentos || []).map(p => ({
          ...p,
          dependente_nome: nomePorSocioId[p.socio_id] ?? 'Dependente',
        }))
      }
    }

    return NextResponse.json({
      chavePix: torcidaRes.data?.chave_pix ?? null,
      telefone_gestor: gestorRes.data?.telefone ?? null,
      torcidaNome: torcidaRes.data?.nome ?? null,
      tipoMensalidade,
      pagamentos: pagamentosRes.data ?? [],
      pagamentosDependentes,
      data_proximo_pagamento: socio.data_proximo_pagamento ?? null,
    })
  } catch (error) {
    console.error('Erro GET /api/socio/mensalidade:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
