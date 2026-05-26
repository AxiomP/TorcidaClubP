import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const ranking = searchParams.get('ranking')
    const fields = searchParams.get('fields')

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor?.torcida_id) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 403 })
    }

    const ids = searchParams.get('ids')
    const selectFields = fields === 'aniversariantes'
      ? 'id, nome_completo, data_nascimento, whatsapp'
      : fields === 'full'
        ? '*'
        : 'id, nome_completo, email, cpf, whatsapp, status, ranking, data_cadastro, data_aprovacao'

    let query = supabaseAdmin
      .from('socios')
      .select(selectFields)
      .eq('torcida_id', gestor.torcida_id)
      .order('data_cadastro', { ascending: false })

    if (ids) {
      query = query.in('id', ids.split(','))
    }

    if (status && status !== 'todos') {
      query = query.eq('status', status as 'pendente' | 'ativo' | 'cancelado' | 'inadimplente' | 'bloqueado' | 'rejeitado')
    } else {
      query = query.neq('status', 'rejeitado')
    }

    if (ranking && ranking !== 'todos') {
      query = query.eq('ranking', ranking as 'bronze' | 'prata' | 'ouro')
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar sócios:', error)
      return NextResponse.json({ error: 'Erro ao buscar sócios' }, { status: 500 })
    }

    return NextResponse.json({ socios: data || [] })
  } catch (error) {
    console.error('Erro na API socios:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
