import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function escapeCSVValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function sanitizeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventoId } = await params
    if (!eventoId) {
      return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: evento, error: eventoError } = await supabaseAdmin
      .from('eventos')
      .select('id, torcida_id, nome_evento')
      .eq('id', eventoId)
      .single()

    if (eventoError || !evento) {
      console.error('Evento não encontrado:', eventoError)
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!gestor || gestor.torcida_id !== evento.torcida_id) {
      return NextResponse.json({ error: 'Sem permissão para este evento' }, { status: 403 })
    }

    const { data: compras, error: comprasError } = await supabaseAdmin
      .from('compras_ingressos')
      .select('id, tipo_ingresso, status, nome_adicional, cpf_adicional, valor, socio_id, dependente_id, created_at, codigo_validacao, usado_em, aprovado_por')
      .eq('evento_id', eventoId)
      .order('created_at', { ascending: true })

    if (comprasError) {
      console.error('Erro ao buscar ingressos:', comprasError)
      return NextResponse.json({ error: 'Erro ao buscar ingressos' }, { status: 500 })
    }

    const socioIds = Array.from(new Set(compras.map(item => item.socio_id).filter(Boolean)))
    const aprovadoresIds = Array.from(new Set(compras.map((item): string | null => item.aprovado_por).filter((id): id is string => id !== null && id !== undefined)))
    const sociosById: Record<string, { nome_completo: string; cpf: string; codigo_referencia: string }> = {}
    const aprovadoresById: Record<string, { nome_completo: string; email: string }> = {}

    if (socioIds.length > 0) {
      const { data: socios, error: sociosError } = await supabaseAdmin
        .from('socios')
        .select('id, nome_completo, cpf, codigo_referencia')
        .in('id', socioIds)

      if (sociosError) {
        console.error('Erro ao buscar sócios dos ingressos:', sociosError)
        return NextResponse.json({ error: 'Erro ao buscar dados dos sócios' }, { status: 500 })
      }

      ;(socios || []).forEach((socio) => {
        if (socio?.id) {
          sociosById[socio.id] = {
            nome_completo: socio.nome_completo || '',
            cpf: socio.cpf || '',
            codigo_referencia: socio.codigo_referencia || '',
          }
        }
      })
    }

    if (aprovadoresIds.length > 0) {
      const { data: aprovadores, error: aprovadoresError } = await supabaseAdmin
        .from('gestores')
        .select('id, nome_completo, email')
        .in('id', aprovadoresIds)

      if (aprovadoresError) {
        console.error('Erro ao buscar gestores aprovadores:', aprovadoresError)
        return NextResponse.json({ error: 'Erro ao buscar dados dos gestores' }, { status: 500 })
      }

      ;(aprovadores || []).forEach((gestor) => {
        if (gestor?.id) {
          aprovadoresById[gestor.id] = {
            nome_completo: gestor.nome_completo || '',
            email: gestor.email || '',
          }
        }
      })
    }

    if (!compras || compras.length === 0) {
      return NextResponse.json({ error: 'Nenhum ingresso encontrado para este evento' }, { status: 404 })
    }

    const header = ['ID Sócio', 'Nome', 'CPF', 'Tipo', 'Status', 'Valor', 'Data Compra', 'Código Validação', 'Usado em', 'Dependente ID', 'Aprovado por'].join(',')
    const rows = compras.map((row) => {
      const socio = sociosById[row.socio_id] || null
      const nome = row.tipo_ingresso === 'adicional'
        ? row.nome_adicional || socio?.nome_completo || ''
        : socio?.nome_completo || ''
      const cpf = row.tipo_ingresso === 'adicional'
        ? row.cpf_adicional || ''
        : (socio?.cpf || '').replace(/\D/g, '')
      const idSocio = socio?.codigo_referencia || ''
      
      const dataCriacaoStr = row.created_at
        ? new Date(row.created_at).toLocaleString('pt-BR')
        : ''
      
      const dataUsadoStr = row.usado_em
        ? new Date(row.usado_em).toLocaleString('pt-BR')
        : ''

      const aprovador = row.aprovado_por
        ? aprovadoresById[row.aprovado_por]?.nome_completo
          || aprovadoresById[row.aprovado_por]?.email
          || row.aprovado_por
        : ''

      return [
        escapeCSVValue(idSocio),
        escapeCSVValue(nome),
        escapeCSVValue(cpf),
        escapeCSVValue(row.tipo_ingresso),
        escapeCSVValue(row.status),
        escapeCSVValue(row.valor?.toFixed(2) ?? '0.00'),
        escapeCSVValue(dataCriacaoStr),
        escapeCSVValue(row.codigo_validacao),
        escapeCSVValue(dataUsadoStr),
        escapeCSVValue(row.dependente_id),
        escapeCSVValue(aprovador),
      ].join(',')
    })

    const csv = '\uFEFF' + [header, ...rows].join('\n')
    const filename = `ingressos_${sanitizeFilename(evento.nome_evento || 'evento')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erro na API de exportacao de ingressos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
