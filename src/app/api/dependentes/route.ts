import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { validarCPF } from '@/lib/validations/cpf-validator'
import crypto from 'crypto'

/**
 * GET /api/dependentes
 * Lista dependentes do sócio logado
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar sócio
    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!socio) {
      return NextResponse.json(
        { error: 'Sócio não encontrado' },
        { status: 404 }
      )
    }

    // Buscar dependentes
    const { data: dependentes, error } = await supabaseAdmin
      .from('dependentes')
      .select('*')
      .eq('socio_titular_id', socio.id)
      .neq('status', 'cancelado')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar dependentes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar dependentes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ dependentes })
  } catch (error) {
    console.error('Erro na API de dependentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dependentes
 * Adiciona um novo dependente
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      cpf,
      nome_completo,
      email,
      data_nascimento,
      e_menor,
      cpf_responsavel,
      socio_titular_id,
    } = body

    // Validações
    if (!cpf || !nome_completo || !email || !data_nascimento) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    // Validar CPF
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    // Verificar se CPF já existe como sócio ou dependente
    const { data: cpfExistente } = await supabaseAdmin
      .from('socios')
      .select('id')
      .eq('cpf', cpfLimpo)
      .maybeSingle()

    if (cpfExistente) {
      return NextResponse.json(
        { error: 'Este CPF já está cadastrado como sócio' },
        { status: 400 }
      )
    }

    const { data: dependenteExistente } = await supabaseAdmin
      .from('dependentes')
      .select('id')
      .eq('cpf', cpfLimpo)
      .neq('status', 'cancelado')
      .maybeSingle()

    if (dependenteExistente) {
      return NextResponse.json(
        { error: 'Este CPF já está cadastrado como dependente' },
        { status: 400 }
      )
    }

    // Verificar se sócio pode adicionar dependentes
    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id, status, torcida_id')
      .eq('id', socio_titular_id)
      .eq('auth_user_id', user.id)
      .single()

    if (!socio) {
      return NextResponse.json(
        { error: 'Sócio titular não encontrado' },
        { status: 404 }
      )
    }

    if (socio.status !== 'ativo') {
      return NextResponse.json(
        { error: 'Apenas sócios ativos podem adicionar dependentes' },
        { status: 403 }
      )
    }

    // Verificar limite de dependentes (máximo 5 por padrão)
    {
      const maxDependentes = 5

      const { count } = await supabaseAdmin
        .from('dependentes')
        .select('*', { count: 'exact', head: true })
        .eq('socio_titular_id', socio.id)
        .neq('status', 'cancelado')

      if ((count || 0) >= maxDependentes) {
        return NextResponse.json(
          { error: `Limite de ${maxDependentes} dependente(s) atingido` },
          { status: 403 }
        )
      }
    }

    // Gerar token de ativação
    const tokenAtivacao = crypto.randomBytes(32).toString('hex')
    const tokenExpiracao = new Date()
    tokenExpiracao.setDate(tokenExpiracao.getDate() + 7) // Expira em 7 dias

    // Criar dependente
    const { data: novoDependente, error: insertError } = await supabaseAdmin
      .from('dependentes')
      .insert({
        socio_titular_id: socio.id,
        torcida_id: socio.torcida_id,
        cpf: cpfLimpo,
        nome_completo,
        email,
        data_nascimento,
        e_menor: e_menor || false,
        cpf_responsavel: cpf_responsavel?.replace(/\D/g, '') || null,
        status: 'ativo',
        token_ativacao: tokenAtivacao,
        token_expiracao: tokenExpiracao.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar dependente:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar dependente' },
        { status: 500 }
      )
    }

    // TODO: Enviar email para o dependente criar sua senha
    // Por enquanto, apenas retornamos sucesso

    return NextResponse.json({
      success: true,
      dependente: novoDependente,
      message: 'Dependente adicionado com sucesso',
    })
  } catch (error) {
    console.error('Erro na API de dependentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
