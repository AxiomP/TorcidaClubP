import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cpf = searchParams.get('cpf')?.replace(/\D/g, '')
  const torcidaId = searchParams.get('torcida_id')

  if (!cpf || !torcidaId) {
    return NextResponse.json({ error: 'CPF e torcida_id são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('socios')
    .select('id, nome_completo, cpf')
    .eq('torcida_id', torcidaId)
    .eq('cpf', cpf)
    .neq('status', 'pendente')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Responsável não encontrado. Verifique se o CPF pertence a um sócio ativo desta torcida.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ responsavel: { id: data.id, nome_completo: data.nome_completo, cpf: data.cpf } })
}
