import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { criarNotificacoesAniversario } from '@/lib/services/notification-service'

/**
 * CRON JOB: Notificações de Aniversário
 * POST /api/cron/notificacoes-aniversario
 *
 * Executar diariamente via cron externo (crontab do VPS)
 * Cria notificações para gestores sobre sócios aniversariantes
 */

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar todas as torcidas ativas
    const { data: torcidas, error: torcidasError } = await supabaseAdmin
      .from('torcidas')
      .select('id, nome')
      .eq('status', 'ativo')

    if (torcidasError) {
      console.error('Erro ao buscar torcidas:', torcidasError)
      return NextResponse.json(
        { error: 'Erro ao buscar torcidas' },
        { status: 500 }
      )
    }

    if (!torcidas || torcidas.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma torcida ativa encontrada',
        totalNotificacoes: 0,
      })
    }

    // Processar cada torcida
    let totalNotificacoes = 0
    const resultados: { torcida: string; notificacoes: number }[] = []

    for (const torcida of torcidas) {
      const notificacoesCriadas = await criarNotificacoesAniversario(torcida.id)
      totalNotificacoes += notificacoesCriadas

      if (notificacoesCriadas > 0) {
        resultados.push({
          torcida: torcida.nome,
          notificacoes: notificacoesCriadas,
        })
      }
    }

    // Log do resultado
    console.log(`[CRON] Notificações de aniversário criadas: ${totalNotificacoes}`)

    return NextResponse.json({
      success: true,
      message: `${totalNotificacoes} notificações de aniversário criadas`,
      totalNotificacoes,
      detalhes: resultados,
      executadoEm: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no cron de aniversários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET para verificação de saúde do endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/cron/notificacoes-aniversario',
    descricao: 'Cron job para criar notificações de aniversário de sócios',
  })
}
