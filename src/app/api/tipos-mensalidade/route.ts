import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * API Route para CRUD de tipos de mensalidade
 * RN004: Cada torcida pode ter múltiplos tipos de mensalidade
 */

/**
 * GET /api/tipos-mensalidade?torcida_id=xxx
 * Lista todos os tipos de mensalidade de uma torcida
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const torcidaId = searchParams.get('torcida_id')

    // Validar torcida_id
    if (!torcidaId) {
      return NextResponse.json(
        { error: 'torcida_id é obrigatório' },
        { status: 400 }
      )
    }

    // Criar cliente Supabase
    const _supabase = await createClient()

    // Buscar tipos de mensalidade da torcida
    const { data, error } = await supabaseAdmin
      .from('tipos_mensalidade')
      .select('*')
      .eq('torcida_id', torcidaId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      console.error('Erro ao buscar tipos de mensalidade:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar tipos de mensalidade' },
        { status: 500 }
      )
    }

    // Se não encontrou nenhum tipo, retornar vazio
    if (!data || data.length === 0) {
      return NextResponse.json({
        tipos: [],
        message: 'Nenhum tipo de mensalidade encontrado para esta torcida'
      })
    }

    return NextResponse.json({
      tipos: data
    })
  } catch (error) {
    console.error('Erro na API tipos-mensalidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tipos-mensalidade
 * Cria um novo tipo de mensalidade
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      torcida_id,
      nome,
      valor,
      permite_dependentes = false,
      qtd_max_dependentes = null,
      permite_ingressos_adicionais = false,
      qtd_max_ingressos_adicionais = null,
      beneficios = [],
      ordem = 0
    } = body

    // Validações
    if (!torcida_id || !nome || valor === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: torcida_id, nome, valor' },
        { status: 400 }
      )
    }

    if (valor < 0) {
      return NextResponse.json(
        { error: 'Valor deve ser maior ou igual a zero' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se usuário é gestor da torcida
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!gestor || gestor.torcida_id !== torcida_id) {
      return NextResponse.json(
        { error: 'Sem permissão para esta torcida' },
        { status: 403 }
      )
    }

    // Inserir tipo de mensalidade
    const { data, error } = await supabaseAdmin
      .from('tipos_mensalidade')
      .insert({
        torcida_id,
        nome,
        valor,
        permite_dependentes,
        qtd_max_dependentes,
        permite_ingressos_adicionais,
        qtd_max_ingressos_adicionais,
        beneficios,
        ordem,
        ativo: true
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tipo de mensalidade:', error)
      return NextResponse.json(
        { error: 'Erro ao criar tipo de mensalidade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tipo: data,
      message: 'Tipo de mensalidade criado com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro na API tipos-mensalidade POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tipos-mensalidade
 * Atualiza um tipo de mensalidade existente
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      id,
      nome,
      valor,
      permite_dependentes,
      qtd_max_dependentes,
      permite_ingressos_adicionais,
      qtd_max_ingressos_adicionais,
      beneficios,
      ordem
    } = body

    // Validações
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se usuário é gestor da torcida
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar tipo existente
    const { data: tipoExistente } = await supabaseAdmin
      .from('tipos_mensalidade')
      .select('torcida_id')
      .eq('id', id)
      .single()

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de mensalidade não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão
    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!gestor || gestor.torcida_id !== tipoExistente.torcida_id) {
      return NextResponse.json(
        { error: 'Sem permissão para esta torcida' },
        { status: 403 }
      )
    }

    // Atualizar tipo de mensalidade
    const updateData: Record<string, string | number | boolean | string[] | null> = {
      updated_at: new Date().toISOString()
    }

    if (nome !== undefined) updateData.nome = nome
    if (valor !== undefined) {
      if (valor < 0) {
        return NextResponse.json(
          { error: 'Valor deve ser maior ou igual a zero' },
          { status: 400 }
        )
      }
      updateData.valor = valor
    }
    if (permite_dependentes !== undefined) updateData.permite_dependentes = permite_dependentes
    if (qtd_max_dependentes !== undefined) updateData.qtd_max_dependentes = qtd_max_dependentes
    if (permite_ingressos_adicionais !== undefined) updateData.permite_ingressos_adicionais = permite_ingressos_adicionais
    if (qtd_max_ingressos_adicionais !== undefined) updateData.qtd_max_ingressos_adicionais = qtd_max_ingressos_adicionais
    if (beneficios !== undefined) updateData.beneficios = beneficios
    if (ordem !== undefined) updateData.ordem = ordem

    const { data, error } = await supabaseAdmin
      .from('tipos_mensalidade')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar tipo de mensalidade:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar tipo de mensalidade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tipo: data,
      message: 'Tipo de mensalidade atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro na API tipos-mensalidade PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tipos-mensalidade?id=xxx
 * Desativa um tipo de mensalidade (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se usuário é gestor da torcida
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar tipo existente
    const { data: tipoExistente } = await supabaseAdmin
      .from('tipos_mensalidade')
      .select('torcida_id')
      .eq('id', id)
      .single()

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de mensalidade não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão
    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!gestor || gestor.torcida_id !== tipoExistente.torcida_id) {
      return NextResponse.json(
        { error: 'Sem permissão para esta torcida' },
        { status: 403 }
      )
    }

    // Verificar se há sócios usando este tipo
    const { count } = await supabaseAdmin
      .from('socios')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_mensalidade_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir. Existem ${count} sócios usando este tipo de mensalidade` },
        { status: 400 }
      )
    }

    // Soft delete (desativar)
    const { error } = await supabaseAdmin
      .from('tipos_mensalidade')
      .update({
        ativo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao desativar tipo de mensalidade:', error)
      return NextResponse.json(
        { error: 'Erro ao desativar tipo de mensalidade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tipo de mensalidade desativado com sucesso'
    })
  } catch (error) {
    console.error('Erro na API tipos-mensalidade DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
