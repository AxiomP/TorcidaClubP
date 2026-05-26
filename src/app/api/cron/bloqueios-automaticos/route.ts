import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { calcularDividaSocio, sincronizarSociosDependentes } from '@/lib/services/pagamento-service'
import { whatsappTemplates } from '@/lib/templates/whatsapp-templates'
import { subDays, format } from 'date-fns'
import type { Database } from '@/types/database'

type Socio = Database['public']['Tables']['socios']['Row']

interface PagamentoComSocio {
  socio_id: string
  socios: Pick<Socio, 'id' | 'torcida_id' | 'nome_completo' | 'apelido' | 'whatsapp' | 'status'> | null
}

/**
 * GET /api/cron/bloqueios-automaticos
 * RN007: Bloqueio automático por inadimplência
 *
 * Bloqueia sócios que estão há 30+ dias com pagamento vencido
 *
 * Cron job que deve ser executado diariamente às 01:00
 * Configurar no cron externo (crontab do VPS):
 * Cron: 0 1 * * *  (todos os dias às 01:00)
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
    const dataLimite = subDays(hoje, 30) // 30 dias atrás

    // Buscar pagamentos vencidos há 30+ dias
    const { data: pagamentosVencidosData, error: pagamentosError } = await supabaseAdmin
      .from('pagamentos')
      .select('socio_id, socios(id, torcida_id, nome_completo, apelido, whatsapp, status)')
      .in('status', ['pendente', 'recusado', 'comprovante_enviado'])
      .lte('data_vencimento', format(dataLimite, 'yyyy-MM-dd'))

    if (pagamentosError) {
      console.error('Erro ao buscar pagamentos vencidos:', pagamentosError)
      return NextResponse.json(
        { error: 'Erro ao buscar pagamentos vencidos' },
        { status: 500 }
      )
    }

    const pagamentosVencidos = pagamentosVencidosData as unknown as PagamentoComSocio[] | null

    if (!pagamentosVencidos || pagamentosVencidos.length === 0) {
      return NextResponse.json({
        message: 'Nenhum sócio com pagamento vencido há 30+ dias',
        bloqueados: 0
      })
    }

    // Agrupar por sócio (pode ter múltiplos pagamentos vencidos)
    const sociosMap = new Map<string, PagamentoComSocio['socios']>()

    for (const pgto of pagamentosVencidos) {
      if (!pgto.socios || ['inadimplente', 'bloqueado', 'cancelado'].includes(pgto.socios.status)) {
        continue // Já processado ou cancelado
      }

      if (!sociosMap.has(pgto.socio_id)) {
        sociosMap.set(pgto.socio_id, pgto.socios)
      }
    }

    let bloqueados = 0
    const resultados: Array<{ socio_id: string; nome: string; meses_pendentes: number; valor_divida: number }> = []

    // Processar cada sócio
    for (const [socioId, socio] of sociosMap) {
      if (!socio) continue

      try {
        // Calcular dívida total
        const { total: valorDivida, meses: mesesPendentes } = await calcularDividaSocio(socioId)

        // Bloquear sócio
        const { error: updateError } = await supabaseAdmin
          .from('socios')
          .update({
            status: 'inadimplente' as const,
            meses_pendentes: mesesPendentes,
            valor_divida_total: valorDivida,
            bloqueado_em: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Database['public']['Tables']['socios']['Update'])
          .eq('id', socioId)

        if (updateError) {
          console.error(`Erro ao bloquear sócio ${socioId}:`, updateError)
          continue
        }

        // Bloquear dependentes (tabela dependentes + socios dos dependentes)
        await supabaseAdmin
          .from('dependentes')
          .update({
            status: 'inativo' as const,
          } as Database['public']['Tables']['dependentes']['Update'])
          .eq('socio_titular_id', socioId)
        await sincronizarSociosDependentes(socioId, 'bloqueado')

        // Registrar notificação
        await supabaseAdmin.from('notificacoes').insert({
          socio_id: socioId,
          tipo: 'bloqueio' as const,
          titulo: 'Acesso Bloqueado - Inadimplência',
          mensagem: whatsappTemplates.bloqueio_acesso(
            socio.apelido || socio.nome_completo,
            mesesPendentes,
            valorDivida
          ),
          canal: 'sistema' as const,
          enviado: true,
          enviado_em: new Date().toISOString()
        } as Database['public']['Tables']['notificacoes']['Insert'])

        // Registrar auditoria
        await supabaseAdmin.from('auditoria').insert({
          usuario_id: null,
          usuario_tipo: 'sistema' as const,
          torcida_id: socio.torcida_id,
          acao: 'bloqueio_automatico',
          entidade: 'socios',
          entidade_id: socioId,
          dados_novos: {
            status: 'inadimplente',
            meses_pendentes: mesesPendentes,
            valor_divida_total: valorDivida,
            motivo: `Inadimplência de ${mesesPendentes} meses`
          }
        } as Database['public']['Tables']['auditoria']['Insert'])

        bloqueados++
        resultados.push({
          socio_id: socioId,
          nome: socio.nome_completo,
          meses_pendentes: mesesPendentes,
          valor_divida: valorDivida
        })
      } catch (error) {
        console.error(`Erro ao processar bloqueio do sócio ${socioId}:`, error)
        continue
      }
    }

    return NextResponse.json({
      message: 'Cron job executado com sucesso',
      data: format(hoje, 'dd/MM/yyyy'),
      data_limite: format(dataLimite, 'dd/MM/yyyy'),
      socios_analisados: sociosMap.size,
      bloqueados,
      detalhes: resultados
    })
  } catch (error) {
    console.error('Erro no cron job bloqueios-automaticos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
