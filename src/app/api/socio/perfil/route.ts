import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/socio/perfil
 * Returns socio profile + torcida + pending pagamento.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!socio) return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })

    const [torcidaRes, pagamentoRes] = await Promise.all([
      supabaseAdmin.from('torcidas').select('chave_pix, whatsapp_grupo').eq('id', socio.torcida_id).maybeSingle(),
      supabaseAdmin.from('pagamentos')
        .select('id, valor_original, referencia_mes')
        .eq('socio_id', socio.id)
        .in('status', ['pendente', 'comprovante_enviado'])
        .order('data_vencimento', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    // Contar pagamentos pendentes dos dependentes do titular
    let dependentesPendentes: { count: number; totalValor: number } | null = null
    const { data: dependentesAtivos } = await supabaseAdmin
      .from('dependentes')
      .select('auth_user_id')
      .eq('socio_titular_id', socio.id)
      .eq('status', 'ativo')
      .not('auth_user_id', 'is', null)

    if (dependentesAtivos && dependentesAtivos.length > 0) {
      const authIds = dependentesAtivos.map((d: { auth_user_id: string | null }) => d.auth_user_id).filter(Boolean) as string[]
      const { data: sociosDeps } = await supabaseAdmin
        .from('socios')
        .select('id')
        .in('auth_user_id', authIds)
        .eq('torcida_id', socio.torcida_id)

      if (sociosDeps && sociosDeps.length > 0) {
        const depSocioIds = sociosDeps.map((s: { id: string }) => s.id)
        const { data: depPagamentos } = await supabaseAdmin
          .from('pagamentos')
          .select('id, valor_original')
          .in('socio_id', depSocioIds)
          .in('status', ['pendente', 'comprovante_enviado'])

        if (depPagamentos && depPagamentos.length > 0) {
          dependentesPendentes = {
            count: depPagamentos.length,
            totalValor: depPagamentos.reduce((sum: number, p: { valor_original: number }) => sum + (p.valor_original || 0), 0),
          }
        }
      }
    }

    return NextResponse.json({
      socio,
      chavePix: torcidaRes.data?.chave_pix ?? null,
      whatsappGrupo: torcidaRes.data?.whatsapp_grupo ?? null,
      pagamentoAtual: pagamentoRes.data ?? null,
      dependentesPendentes,
    })
  } catch (error) {
    console.error('Erro GET /api/socio/perfil:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * PATCH /api/socio/perfil
 * Updates the authenticated socio's profile fields.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!socio) return NextResponse.json({ error: 'Sócio não encontrado' }, { status: 404 })

    const body = await request.json()
    const allowedFields = [
      'nome_completo', 'whatsapp', 'endereco_completo', 'bairro', 'cidade', 'estado', 'cep',
      'profissao', 'alergias', 'usa_medicacao', 'necessidades_especiais', 'descricao_necessidades', 'medicacao_detalhes',
      'selfie_url', 'comprovante_endereco_url', 'doc_identificacao_url', 'assinatura_url',
    ]
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('socios').update(updateData).eq('id', socio.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro PATCH /api/socio/perfil:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
