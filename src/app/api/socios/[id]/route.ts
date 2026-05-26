import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sincronizarSociosDependentes } from '@/lib/services/pagamento-service'

async function getGestorTorcidaId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { user: null, torcidaId: null }

  const { data: gestor } = await supabaseAdmin
    .from('gestores')
    .select('torcida_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return { user, torcidaId: gestor?.torcida_id ?? null }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { user, torcidaId } = await getGestorTorcidaId(supabase)

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!torcidaId) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 403 })

    const { data: socio, error } = await supabaseAdmin
      .from('socios')
      .select('*')
      .eq('id', id)
      .eq('torcida_id', torcidaId)
      .maybeSingle()

    if (error || !socio) {
      return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })
    }

    // Buscar tipo de mensalidade se existir
    let tipoMensalidade: { id: string; nome: string; valor: number } | null = null
    if (socio.tipo_mensalidade_id) {
      const { data: tipo } = await supabaseAdmin
        .from('tipos_mensalidade')
        .select('id, nome, valor')
        .eq('id', socio.tipo_mensalidade_id)
        .maybeSingle()
      tipoMensalidade = tipo
    }

    // Contar ingressos comprados
    const { count: totalIngressos } = await supabaseAdmin
      .from('compras_ingressos')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', id)
      .in('status', ['aprovado', 'usado'])

    // Buscar torcida
    const { data: torcida } = await supabaseAdmin
      .from('torcidas')
      .select('nome, brasao_url, slug, presidente, vice_presidente')
      .eq('id', torcidaId)
      .maybeSingle()

    return NextResponse.json({
      socio: { ...socio, tipo_mensalidade: tipoMensalidade },
      totalIngressos: totalIngressos ?? 0,
      torcida,
    })
  } catch (error) {
    console.error('Erro GET /api/socios/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { user, torcidaId } = await getGestorTorcidaId(supabase)

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!torcidaId) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 403 })

    const body = await request.json()
    const { status, ranking, funcao_torcida } = body

    // Verificar que o sócio pertence à torcida do gestor
    const { data: socioExistente } = await supabaseAdmin
      .from('socios')
      .select('id, status')
      .eq('id', id)
      .eq('torcida_id', torcidaId)
      .maybeSingle()

    if (!socioExistente) {
      return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (ranking !== undefined) updateData.ranking = ranking
    if (funcao_torcida !== undefined) updateData.funcao_torcida = funcao_torcida || null

    const { error } = await supabaseAdmin
      .from('socios')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    // Cascatear bloqueio/reativação para dependentes (tabela dependentes + socios dos dependentes)
    if (status === 'bloqueado') {
      await supabaseAdmin
        .from('dependentes')
        .update({ status: 'inativo' })
        .eq('socio_titular_id', id)
      await sincronizarSociosDependentes(id, 'bloqueado')
    } else if (status === 'ativo' && socioExistente.status !== 'ativo') {
      await supabaseAdmin
        .from('dependentes')
        .update({ status: 'ativo' })
        .eq('socio_titular_id', id)
        .eq('status', 'inativo')
      await sincronizarSociosDependentes(id, 'ativo')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro PATCH /api/socios/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * DELETE /api/socios/[id]
 * Encerra a conta do sócio autenticado (auto-exclusão pelo próprio sócio).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar que o sócio pertence ao usuário autenticado
    const { data: socio, error: socioError } = await supabaseAdmin
      .from('socios')
      .select('id, auth_user_id')
      .eq('id', id)
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (socioError || !socio) {
      return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })
    }

    // Hard-delete do registro de sócio
    await supabaseAdmin
      .from('socios')
      .delete()
      .eq('id', socio.id)

    // Remover usuário do Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(user.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro DELETE /api/socios/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
