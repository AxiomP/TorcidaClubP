import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: evento, error } = await supabaseAdmin
      .from('eventos')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !evento) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }

    // Verificar que o usuário tem acesso à torcida do evento
    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const { data: socio } = gestor ? { data: null } : await supabaseAdmin
      .from('socios')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const torcidaId = gestor?.torcida_id || socio?.torcida_id
    if (!torcidaId || torcidaId !== evento.torcida_id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    return NextResponse.json({ evento })
  } catch (error) {
    console.error('Erro na API eventos/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
