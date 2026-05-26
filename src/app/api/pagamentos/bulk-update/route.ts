import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/pagamentos/bulk-update
 * Atualiza múltiplos pagamentos de uma vez (gestor)
 *
 * Body: { ids: string[], updates: { status?, data_pagamento?, valor_pago?, modalidade_pagamento? } }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor?.torcida_id) return NextResponse.json({ error: 'Gestor sem torcida' }, { status: 400 })

    const body = await request.json()
    const { ids, updates } = body as {
      ids: string[]
      updates: {
        status?: string
        data_pagamento?: string | null
        valor_pago?: number | null
        modalidade_pagamento?: string | null
      }
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids é obrigatório' }, { status: 400 })
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'updates é obrigatório' }, { status: 400 })
    }

    // Verificar que todos os pagamentos pertencem à torcida do gestor
    const { data: pagamentos, error: checkError } = await supabaseAdmin
      .from('pagamentos')
      .select('id, torcida_id')
      .in('id', ids)

    if (checkError) throw checkError

    const unauthorized = (pagamentos || []).filter(p => p.torcida_id !== gestor.torcida_id)
    if (unauthorized.length > 0) {
      return NextResponse.json({ error: 'Sem permissão para alguns pagamentos' }, { status: 403 })
    }

    // Construir update payload — apenas campos válidos
    const updateData: Record<string, unknown> = {}
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.data_pagamento !== undefined) updateData.data_pagamento = updates.data_pagamento
    if (updates.valor_pago !== undefined) updateData.valor_pago = updates.valor_pago
    if (updates.modalidade_pagamento !== undefined) updateData.modalidade_pagamento = updates.modalidade_pagamento

    const { error: updateError } = await supabaseAdmin
      .from('pagamentos')
      .update(updateData)
      .in('id', ids)

    if (updateError) throw updateError

    return NextResponse.json({ updated: ids.length })
  } catch (error) {
    console.error('Erro no bulk-update de pagamentos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
