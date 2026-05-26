import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/socios/export
 * Exporta todos os sócios da torcida em CSV completo (para gestores)
 */
export async function GET() {
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

    // Buscar todos os sócios com dados completos
    const { data: socios, error } = await supabaseAdmin
      .from('socios')
      .select('*')
      .eq('torcida_id', gestor.torcida_id)
      .order('nome_completo')

    if (error) throw error

    // Buscar dependentes
    const { data: dependentes } = await supabaseAdmin
      .from('dependentes')
      .select('*')
      .eq('torcida_id', gestor.torcida_id)

    // Construir CSV de sócios
    const socioHeaders = [
      'Matrícula', 'Nome Completo', 'CPF', 'Email', 'WhatsApp',
      'Data Nascimento', 'Gênero', 'Estado Civil', 'Profissão',
      'Endereço', 'Número', 'Complemento', 'Bairro', 'Cidade', 'Estado', 'CEP',
      'Status', 'Ranking', 'Membro Desde', 'Data Cadastro', 'Data Aprovação',
      'Meses Pendentes', 'Valor Dívida',
      'Necessidades Especiais', 'Desc. Necessidades', 'Usa Medicação', 'Detalhes Medicação', 'Alergias',
      'Nome Mãe', 'Nome Pai', 'Contato Emergência', 'Tel. Emergência',
      'Tipo Documento', 'Número RG', 'Origem', 'Importado',
    ]

    function esc(val: unknown): string {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const socioRows = (socios || []).map(s => [
      esc(s.codigo_referencia),
      esc(s.nome_completo),
      esc(s.cpf),
      esc(s.email),
      esc(s.whatsapp),
      esc(s.data_nascimento),
      esc(s.genero),
      esc(s.estado_civil),
      esc(s.profissao),
      esc(s.endereco_completo),
      esc(s.numero),
      esc(s.complemento),
      esc(s.bairro),
      esc(s.cidade),
      esc(s.estado),
      esc(s.cep),
      esc(s.status),
      esc(s.ranking),
      esc(s.membro_desde),
      esc(s.data_cadastro),
      esc(s.data_aprovacao),
      esc(s.meses_pendentes),
      esc(s.valor_divida_total),
      esc(s.necessidades_especiais ? 'Sim' : 'Não'),
      esc(s.descricao_necessidades),
      esc(s.usa_medicacao ? 'Sim' : 'Não'),
      esc(s.medicacao_detalhes),
      esc(s.alergias),
      esc(s.nome_mae),
      esc(s.nome_pai),
      esc(s.contato_emergencia_nome),
      esc(s.contato_emergencia_telefone),
      esc(s.tipo_documento),
      esc(s.numero_rg),
      esc(s.origem),
      esc(s.importado ? 'Sim' : 'Não'),
    ].join(','))

    // Construir CSV de dependentes
    const depHeaders = [
      'CPF Titular', 'Nome Dependente', 'CPF Dependente',
      'Data Nascimento', 'É Menor', 'Status', 'Email',
    ]

    // Criar mapa de CPF por sócio
    const socioCpfMap: Record<string, string> = {}
    for (const s of socios || []) {
      socioCpfMap[s.id] = s.cpf
    }

    const depRows = (dependentes || []).map(d => [
      esc(socioCpfMap[d.socio_titular_id] || d.socio_titular_id),
      esc(d.nome_completo),
      esc(d.cpf),
      esc(d.data_nascimento),
      esc(d.e_menor ? 'Sim' : 'Não'),
      esc(d.status),
      esc(d.email),
    ].join(','))

    const csv = [
      '=== SÓCIOS ===',
      socioHeaders.join(','),
      ...socioRows,
      '',
      '=== DEPENDENTES ===',
      depHeaders.join(','),
      ...depRows,
    ].join('\n')

    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="socios_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar sócios:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
