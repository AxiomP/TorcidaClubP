import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { whatsappTemplates } from '@/lib/templates/whatsapp-templates'
import { enviarEmailLembretePagamento7Dias, enviarEmailLembretePagamentoDia } from '@/lib/services/email-service'
import { addDays, format } from 'date-fns'
import type { Database } from '@/types/database'

interface PagamentoComSocio {
  id: string
  socio_id: string
  valor_original: number
  data_vencimento: string
  socios: {
    nome_completo: string
    apelido: string | null
    whatsapp: string
    email: string
  } | null
}

/**
 * GET /api/cron/lembretes-pagamento
 * RN006: Registro de lembretes de pagamento como notificações in-app
 *
 * Lembretes registrados:
 * - D-7: 7 dias antes do vencimento
 * - D-3: 3 dias antes do vencimento
 * - D-0: No dia do vencimento
 *
 * Cron job que deve ser executado diariamente às 09:00
 * Configurar no cron externo (crontab do VPS):
 * Cron: 0 9 * * *  (todos os dias às 09:00)
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

    let totalRegistrados = 0
    const resultados: Array<{ tipo: string; registrados: number; total: number }> = []

    // D-7: Lembretes 7 dias antes
    const data7dias = format(addDays(hoje, 7), 'yyyy-MM-dd')

    const { data: pagamentos7Data, error: error7 } = await supabaseAdmin
      .from('pagamentos')
      .select('id, socio_id, valor_original, data_vencimento, socios(nome_completo, apelido, whatsapp, email)')
      .eq('status', 'pendente')
      .eq('lembrete_7_dias_enviado', false)
      .eq('data_vencimento', data7dias)

    const pagamentos7 = pagamentos7Data as unknown as PagamentoComSocio[] | null

    if (!error7 && pagamentos7 && pagamentos7.length > 0) {
      let registrados = 0

      for (const pgto of pagamentos7) {
        try {
          if (!pgto.socios) continue

          const nome = pgto.socios.apelido || pgto.socios.nome_completo
          const mensagem = whatsappTemplates.lembrete_7_dias(
            nome,
            pgto.valor_original,
            new Date(pgto.data_vencimento)
          )

          await supabaseAdmin
            .from('pagamentos')
            .update({
              lembrete_7_dias_enviado: true,
              updated_at: new Date().toISOString()
            } as Database['public']['Tables']['pagamentos']['Update'])
            .eq('id', pgto.id)

          await supabaseAdmin.from('notificacoes').insert({
            socio_id: pgto.socio_id,
            tipo: 'lembrete_pagamento' as const,
            titulo: 'Lembrete: Mensalidade vence em 7 dias',
            mensagem,
            canal: 'sistema' as const,
            enviado: true,
            enviado_em: new Date().toISOString()
          } as Database['public']['Tables']['notificacoes']['Insert'])

          // Enviar email de lembrete (fire-and-forget)
          if (pgto.socios?.email) {
            enviarEmailLembretePagamento7Dias(pgto.socios.email, {
              nome,
              valor: pgto.valor_original,
              dataVencimento: new Date(pgto.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR'),
            }).catch(err => console.error(`Erro ao enviar email D-7 para pagamento ${pgto.id}:`, err))
          }

          registrados++
        } catch (error) {
          console.error(`Erro ao registrar lembrete D-7 para pagamento ${pgto.id}:`, error)
        }
      }

      totalRegistrados += registrados
      resultados.push({ tipo: 'D-7', registrados, total: pagamentos7.length })
    }

    // D-3: Lembretes 3 dias antes
    const data3dias = format(addDays(hoje, 3), 'yyyy-MM-dd')

    const { data: pagamentos3Data, error: error3 } = await supabaseAdmin
      .from('pagamentos')
      .select('id, socio_id, valor_original, data_vencimento, socios(nome_completo, apelido, whatsapp, email)')
      .eq('status', 'pendente')
      .eq('lembrete_3_dias_enviado', false)
      .eq('data_vencimento', data3dias)

    const pagamentos3 = pagamentos3Data as unknown as PagamentoComSocio[] | null

    if (!error3 && pagamentos3 && pagamentos3.length > 0) {
      let registrados = 0

      for (const pgto of pagamentos3) {
        try {
          if (!pgto.socios) continue

          const nome = pgto.socios.apelido || pgto.socios.nome_completo
          const mensagem = whatsappTemplates.lembrete_3_dias(
            nome,
            pgto.valor_original,
            new Date(pgto.data_vencimento)
          )

          await supabaseAdmin
            .from('pagamentos')
            .update({
              lembrete_3_dias_enviado: true,
              updated_at: new Date().toISOString()
            } as Database['public']['Tables']['pagamentos']['Update'])
            .eq('id', pgto.id)

          await supabaseAdmin.from('notificacoes').insert({
            socio_id: pgto.socio_id,
            tipo: 'lembrete_pagamento' as const,
            titulo: 'Lembrete: Mensalidade vence em 3 dias',
            mensagem,
            canal: 'sistema' as const,
            enviado: true,
            enviado_em: new Date().toISOString()
          } as Database['public']['Tables']['notificacoes']['Insert'])

          registrados++
        } catch (error) {
          console.error(`Erro ao registrar lembrete D-3 para pagamento ${pgto.id}:`, error)
        }
      }

      totalRegistrados += registrados
      resultados.push({ tipo: 'D-3', registrados, total: pagamentos3.length })
    }

    // D-0: Lembretes no dia do vencimento
    const dataHoje = format(hoje, 'yyyy-MM-dd')

    const { data: pagamentos0Data, error: error0 } = await supabaseAdmin
      .from('pagamentos')
      .select('id, socio_id, valor_original, data_vencimento, socios(nome_completo, apelido, whatsapp, email)')
      .eq('status', 'pendente')
      .eq('lembrete_dia_enviado', false)
      .eq('data_vencimento', dataHoje)

    const pagamentos0 = pagamentos0Data as unknown as PagamentoComSocio[] | null

    if (!error0 && pagamentos0 && pagamentos0.length > 0) {
      let registrados = 0

      for (const pgto of pagamentos0) {
        try {
          if (!pgto.socios) continue

          const nome = pgto.socios.apelido || pgto.socios.nome_completo
          const mensagem = whatsappTemplates.lembrete_dia(nome, pgto.valor_original)

          await supabaseAdmin
            .from('pagamentos')
            .update({
              lembrete_dia_enviado: true,
              updated_at: new Date().toISOString()
            } as Database['public']['Tables']['pagamentos']['Update'])
            .eq('id', pgto.id)

          await supabaseAdmin.from('notificacoes').insert({
            socio_id: pgto.socio_id,
            tipo: 'lembrete_pagamento' as const,
            titulo: 'Lembrete: Mensalidade vence HOJE',
            mensagem,
            canal: 'sistema' as const,
            enviado: true,
            enviado_em: new Date().toISOString()
          } as Database['public']['Tables']['notificacoes']['Insert'])

          // Enviar email de lembrete D-0 (fire-and-forget)
          if (pgto.socios?.email) {
            enviarEmailLembretePagamentoDia(pgto.socios.email, {
              nome,
              valor: pgto.valor_original,
              dataVencimento: new Date(pgto.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR'),
            }).catch(err => console.error(`Erro ao enviar email D-0 para pagamento ${pgto.id}:`, err))
          }

          registrados++
        } catch (error) {
          console.error(`Erro ao registrar lembrete D-0 para pagamento ${pgto.id}:`, error)
        }
      }

      totalRegistrados += registrados
      resultados.push({ tipo: 'D-0', registrados, total: pagamentos0.length })
    }

    return NextResponse.json({
      message: 'Cron job executado com sucesso',
      data: format(hoje, 'dd/MM/yyyy'),
      total_registrados: totalRegistrados,
      detalhes: resultados
    })
  } catch (error) {
    console.error('Erro no cron job lembretes-pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
