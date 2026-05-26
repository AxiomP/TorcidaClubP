import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/cron/cobrar-gestores
 * Cron job: suspende torcidas de gestores com assinatura vencida.
 * Renovações são gerenciadas automaticamente pelo Asaas (subscriptions).
 * Este job serve como fallback quando o webhook do Asaas falha.
 *
 * Configurar no crontab do VPS:
 *   0 8 * * * curl -X POST https://app.torcidaclub.com.br/api/cron/cobrar-gestores \
 *     -H "x-cron-secret: $CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const hoje = new Date()
  let suspensos = 0
  let erros = 0

  // Suspender torcidas de gestores com assinatura expirada (fallback quando webhook falha)
  const { data: gestoresVencidos, error: fetchError } = await supabaseAdmin
    .from('gestores')
    .select('id, torcida_id')
    .eq('assinatura_status', 'ativa')
    .lt('assinatura_validade', hoje.toISOString())
    .not('torcida_id', 'is', null)

  if (fetchError) {
    console.error('[cron/cobrar-gestores] Erro ao buscar gestores vencidos:', fetchError)
    return NextResponse.json({ error: 'Erro ao buscar gestores' }, { status: 500 })
  }

  for (const g of gestoresVencidos ?? []) {
    try {
      await supabaseAdmin
        .from('gestores')
        .update({ assinatura_status: 'vencida' })
        .eq('id', g.id)

      suspensos++
      console.log(`[cron/cobrar-gestores] Assinatura expirada — gestor ${g.id} suspenso`)
    } catch (err) {
      erros++
      console.error(`[cron/cobrar-gestores] Erro ao suspender gestor ${g.id}:`, err)
    }
  }

  console.log(`[cron/cobrar-gestores] Concluído — suspensos: ${suspensos}, erros: ${erros}`)
  return NextResponse.json({ suspensos, erros })
}
