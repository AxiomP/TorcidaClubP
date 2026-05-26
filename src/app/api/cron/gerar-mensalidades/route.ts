  import { NextRequest, NextResponse } from 'next/server'
  import { supabaseAdmin } from '@/lib/supabase/admin'
  import { verificarPagamentoMes } from '@/lib/services/pagamento-service'
  import { calcularIdade } from '@/lib/utils/calculate'
  import { format, addMonths, lastDayOfMonth } from 'date-fns'
  

  interface SocioComTipo {
    id: string
    torcida_id: string
    data_nascimento: string | null
    tipo_mensalidade_id: string | null
    data_proximo_pagamento: string | null
    tipos_mensalidade: { valor: number } | null
  }


  /**
   * GET /api/cron/gerar-mensalidades
   * RN005: Geração automática de mensalidades
   *
   * Cron job que deve ser executado diariamente às 00:30
   * Gera mensalidades para sócios cujo dia de vencimento é hoje
   *
   * Configurar no cron externo (crontab do VPS):
   * Cron: 30 0 * * *  (todos os dias às 00:30)
   */
  export async function GET(request: NextRequest) {
    try {
      // Validar cron secret
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const hoje = new Date()
      const hojeFormatado = format(hoje, 'yyyy-MM-dd')

      // =========================================================================
      // ETAPA 1: VERIFICAÇÃO DE INADIMPLÊNCIA (BLOQUEIO)
      // =========================================================================
      const { data: pagamentosVencidos, error: erroVencidos } = await supabaseAdmin
        .from('pagamentos')
        .select('socio_id, valor_original')
        .eq('status', 'pendente')
        .lt('data_vencimento', hojeFormatado)

      if (erroVencidos) console.error('Erro ao buscar pagamentos vencidos:', erroVencidos)

      if (pagamentosVencidos && pagamentosVencidos.length > 0) {
        console.log(`Encontrados ${pagamentosVencidos.length} pagamentos vencidos. Atualizando sócios...`)
        const sociosDevedoresIds = Array.from(new Set(pagamentosVencidos.map(p => p.socio_id)))

        for (const socioId of sociosDevedoresIds) {
          const parcelasAtrasadas = pagamentosVencidos.filter(p => p.socio_id === socioId)
          const totalDivida = parcelasAtrasadas.reduce((sum, p) => sum + (p.valor_original || 0), 0)

          await supabaseAdmin
            .from('socios')
            .update({
              status: 'inadimplente',
              meses_pendentes: parcelasAtrasadas.length,
              valor_divida_total: totalDivida
            })
            .eq('id', socioId)
            .eq('status', 'ativo')
        }
      }

      // =========================================================================
      // ETAPA 2: GERAÇÃO DE NOVAS MENSALIDADES RECORRENTES
      // =========================================================================
      const { data: sociosParaCobrar, error: sociosError } = await supabaseAdmin
        .from('socios')
        .select('id, torcida_id, data_nascimento, tipo_mensalidade_id, data_proximo_pagamento, tipos_mensalidade(valor)')
        .in('status', ['ativo', 'inadimplente'])
        .lte('data_proximo_pagamento', hojeFormatado)

      if (sociosError) {
        console.error('Erro ao buscar sócios para cobrança:', sociosError)
        return NextResponse.json({ error: 'Erro ao buscar sócios' }, { status: 500 })
      }

      const socios = sociosParaCobrar as unknown as SocioComTipo[] | null
      let totalGerados = 0

      if (socios && socios.length > 0) {
        for (const socio of socios) {
          try {
            const { data: torcida } = await supabaseAdmin
              .from('torcidas')
              .select('idade_min_pagamento, dia_vencimento_mensalidade')
              .eq('id', socio.torcida_id)
              .maybeSingle()

            if (torcida?.idade_min_pagamento && socio.data_nascimento) {
              if (calcularIdade(socio.data_nascimento) < torcida.idade_min_pagamento) continue
            }

            // Se já tem o boleto pendente criado para o mês alvo, não gera outro duplicado
            const dataVencimentoStr = socio.data_proximo_pagamento || hojeFormatado
            const referenciaMesStr = dataVencimentoStr.substring(0, 7) + '-01'
            
            const jaExiste = await verificarPagamentoMes(socio.id, socio.torcida_id, new Date(dataVencimentoStr + 'T00:00:00'))
            if (jaExiste) {
              // Se o boleto já existe mas a data do sócio ficou para trás, só empurramos o relógio dele para a frente
              const diaVencimentoPadrao = torcida?.dia_vencimento_mensalidade || 10
              const dataBaseProximo = addMonths(new Date(dataVencimentoStr + 'T00:00:00'), 1)
              const ultimoDiaProxMes = lastDayOfMonth(dataBaseProximo).getDate()
              const diaEfetivo = Math.min(diaVencimentoPadrao, ultimoDiaProxMes)
              dataBaseProximo.setDate(diaEfetivo)
              
              await supabaseAdmin
                .from('socios')
                .update({ data_proximo_pagamento: format(dataBaseProximo, 'yyyy-MM-dd') })
                .eq('id', socio.id)
              continue
            }

            // Caso o fluxo anual/mensal precise gerar uma nova folha do zero:
            const diaVencimentoPadrao = torcida?.dia_vencimento_mensalidade || 10
            const dataBaseProximo = addMonths(new Date(dataVencimentoStr + 'T00:00:00'), 1)
            const ultimoDiaProxMes = lastDayOfMonth(dataBaseProximo).getDate()
            const diaEfetivo = Math.min(diaVencimentoPadrao, ultimoDiaProxMes)
            dataBaseProximo.setDate(diaEfetivo)
            const novaDataProximoPagamentoStr = format(dataBaseProximo, 'yyyy-MM-dd')

            await supabaseAdmin.from('pagamentos').insert({
              socio_id: socio.id,
              torcida_id: socio.torcida_id,
              tipo_mensalidade_id: socio.tipo_mensalidade_id,
              referencia_mes: referenciaMesStr,
              valor_original: socio.tipos_mensalidade?.valor || 0,
              valor_perdoado: 0,
              data_vencimento: dataVencimentoStr,
              status: 'pendente',
              lembrete_7_dias_enviado: false,
              lembrete_3_dias_enviado: false,
              lembrete_dia_enviado: false
            })

            await supabaseAdmin
              .from('socios')
              .update({ data_proximo_pagamento: novaDataProximoPagamentoStr })
              .eq('id', socio.id)

            totalGerados++
          } catch (error) {
            console.error(`Erro ao processar o sócio ${socio.id}:`, error)
          }
        }
      }

      return NextResponse.json({
        message: 'Cron job executado com sucesso',
        data: format(hoje, 'dd/MM/yyyy'),
        total_gerados: totalGerados
      })
    } catch (error) {
      console.error('Erro no cron job gerar-mensalidades:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
