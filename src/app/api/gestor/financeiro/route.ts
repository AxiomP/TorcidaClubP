import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getGestorTorcida() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autorizado', status: 401 as const, gestor: null }

  const { data: gestor } = await supabaseAdmin
    .from('gestores')
    .select('torcida_id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!gestor || !gestor.torcida_id) return { error: 'Gestor não encontrado', status: 403 as const, gestor: null }
  return { error: null, status: null, gestor }
}

export async function GET() {
  try {
    const { error, status, gestor } = await getGestorTorcida()
    if (error || !gestor) return NextResponse.json({ error }, { status: status! })

    const { data: torcida } = await supabaseAdmin
      .from('torcidas')
      .select('nome, slug, chave_pix, brasao_url, presidente, vice_presidente, dia_vencimento_mensalidade, idade_min_pagamento, plano, status, mensagem_bloqueio')
      .eq('id', gestor.torcida_id!)
      .maybeSingle()

    const { data: pagamentos } = await supabaseAdmin
      .from('pagamentos')
      .select(`
        id,
        valor_original,
        status,
        referencia_mes,
        data_vencimento,
        socios (
          nome_completo,
          apelido,
          e_menor
        )
      `)
      .eq('torcida_id', gestor.torcida_id!)

    return NextResponse.json({ 
      torcida: torcida ?? null, 
      pagamentos: pagamentos ?? [] 
    })
  } catch (error) {
    console.error('Erro GET /api/gestor/financeiro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, status, gestor } = await getGestorTorcida()
    if (error || !gestor) return NextResponse.json({ error }, { status: status! })

    if (gestor.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const body = await request.json()
    const { chave_pix, dia_vencimento_mensalidade, idade_min_pagamento } = body

    const { error: updateError } = await supabaseAdmin
      .from('torcidas')
      .update({
        chave_pix: chave_pix || null,
        dia_vencimento_mensalidade: Number(dia_vencimento_mensalidade),
        idade_min_pagamento: Number(idade_min_pagamento),
      })
      .eq('id', gestor.torcida_id!)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro POST /api/gestor/financeiro:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
