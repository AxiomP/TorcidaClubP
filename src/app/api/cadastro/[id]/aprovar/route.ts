import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/utils/encryption'
import { enviarEmailCadastroAprovado } from '@/lib/services/email-service'
import { format, startOfMonth, setDate, addMonths, lastDayOfMonth } from 'date-fns'
import type { Database } from '@/types/database'

type Gestor = Database['public']['Tables']['gestores']['Row']
type Socio = Database['public']['Tables']['socios']['Row']
type Torcida = Database['public']['Tables']['torcidas']['Row']

/**
 * API Route para aprovar cadastro de sócio
 * POST /api/cadastro/[id]/aprovar
 *
 * Este endpoint:
 * 1. Valida permissões do gestor
 * 2. Gera número de sócio sequencial
 * 3. Cria conta no Supabase Auth
 * 4. Atualiza status para 'ativo'
 * 5. Registra auditoria
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// Gerar número de sócio sequencial para a torcida.
// Usa COUNT dos códigos já atribuídos em vez de MAX para garantir
// numeração contínua independente de dados históricos com gaps.
async function gerarNumeroSocio(torcidaId: string): Promise<string> {
  const [countResult, torcidaResult] = await Promise.all([
    supabaseAdmin
      .from('socios')
      .select('*', { count: 'exact', head: true })
      .eq('torcida_id', torcidaId)
      .not('codigo_referencia', 'is', null),
    supabaseAdmin
      .from('torcidas')
      .select('slug, nome')
      .eq('id', torcidaId)
      .single(),
  ])

  // Próximo número = quantidade de membros já numerados + 1
  const proximoNumero = (countResult.count ?? 0) + 1

  const torcidaData = torcidaResult.data as Pick<Torcida, 'slug' | 'nome'> | null
  const prefixo = torcidaData?.slug?.toUpperCase().slice(0, 5) || 'SOC'

  // Formato: SIGLA-0001 (4 dígitos mínimo; expande naturalmente acima de 9999)
  return `${prefixo}-${proximoNumero.toString().padStart(4, '0')}`
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Criar cliente Supabase
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é gestor
    const { data: gestorData } = await supabaseAdmin
      .from('gestores')
      .select('id, torcida_id, role')
      .eq('auth_user_id', user.id)
      .single()

    const gestor = gestorData as Pick<Gestor, 'id' | 'torcida_id' | 'role'> | null

    if (!gestor) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Buscar cadastro pendente
    const { data: socioData, error: fetchError } = await supabaseAdmin
      .from('socios')
      .select('*')
      .eq('id', id)
      .eq('torcida_id', gestor.torcida_id!)
      .single()

    const socio = socioData as Socio | null

    if (fetchError || !socio) {
      return NextResponse.json({ error: 'Cadastro não encontrado' }, { status: 404 })
    }

    // Verificar se pode ser aprovado:
    // - status 'pendente': fluxo normal
    // - status 'ativo' sem auth_user_id: estado parcial (aprovado fora do fluxo, sem conta Auth criada)
    const isOrfao = socio.status === 'ativo' && !socio.auth_user_id
    if (socio.status !== 'pendente' && !isOrfao) {
      return NextResponse.json(
        { error: `Cadastro já foi processado (status: ${socio.status})` },
        { status: 400 }
      )
    }

    // Gerar número de sócio
    const codigoReferencia = await gerarNumeroSocio(gestor.torcida_id!)

    // Descriptografar senha para criar conta no Auth
    const senhaDescriptografada = decrypt(socio.senha_hash || '')

    if (!senhaDescriptografada) {
      return NextResponse.json(
        { error: 'Erro ao processar credenciais do sócio' },
        { status: 500 }
      )
    }

    // Criar usuário no Supabase Auth
    let authUserId: string
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: socio.email,
      password: senhaDescriptografada,
      email_confirm: true, // Confirmar email automaticamente na aprovação
      user_metadata: {
        nome_completo: socio.nome_completo,
        tipo: 'socio',
        torcida_id: gestor.torcida_id,
      },
    })

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError)

      // Verificar se é erro de email duplicado — pode ser usuário Auth órfão
      // de uma aprovação anterior que falhou no UPDATE do banco.
      const isEmailExists = authError.message?.includes('already been registered') ||
        authError.message?.includes('already exists') ||
        authError.code === 'email_exists'

      if (!isEmailExists) {
        return NextResponse.json(
          { error: 'Erro ao criar conta do sócio' },
          { status: 500 }
        )
      }

      // Buscar o usuário Auth existente para reutilizá-lo
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const existingAuthUser = listData?.users?.find(u => u.email === socio.email)

      if (!existingAuthUser) {
        return NextResponse.json(
          { error: 'Este email já possui uma conta cadastrada. O sócio pode recuperar a senha pelo login.' },
          { status: 409 }
        )
      }

      // Verificar se o usuário Auth já está vinculado a outro sócio (diferente do atual)
      const { data: outroSocio } = await supabaseAdmin
        .from('socios')
        .select('id')
        .eq('auth_user_id', existingAuthUser.id)
        .neq('id', id)
        .maybeSingle()

      if (outroSocio) {
        return NextResponse.json(
          { error: 'Este email já pertence a outro sócio cadastrado.' },
          { status: 409 }
        )
      }

      // Usuário Auth órfão — atualizar senha para a senha atual do cadastro e prosseguir
      await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
        password: senhaDescriptografada,
        email_confirm: true,
      })

      authUserId = existingAuthUser.id
    } else {
      authUserId = authData.user.id
    }

    // Atualizar sócio com dados de aprovação
    const { error: updateError } = await supabaseAdmin
      .from('socios')
      .update({
        status: 'ativo' as const,
        codigo_referencia: codigoReferencia,
        auth_user_id: authUserId,
        data_aprovacao: new Date().toISOString(),
        aprovado_por: gestor.id,
        membro_desde: new Date().toISOString(),
        // Menores são dependentes — não passam pelo fluxo de primeiro acesso (pagamento)
        primeiro_acesso_feito: socio.e_menor ? true : false,
        // Limpar senha criptografada por segurança
        senha_hash: null,
      } as Database['public']['Tables']['socios']['Update'])
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao aprovar cadastro:', updateError)

      // Reverter criação do usuário Auth em caso de erro
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
      } catch (deleteError) {
        console.error('Erro ao reverter usuário Auth:', deleteError)
      }

      return NextResponse.json(
        { error: 'Erro ao aprovar cadastro' },
        { status: 500 }
      )
    }

    // Se for menor, criar ou atualizar vínculo em dependentes para exibir na tela do responsável
    if (socio.e_menor && socio.cpf_responsavel) {
      try {
        const { data: existingDep } = await supabaseAdmin
          .from('dependentes')
          .select('id')
          .eq('cpf', socio.cpf)
          .eq('torcida_id', gestor.torcida_id!)
          .maybeSingle()

        if (existingDep) {
          await supabaseAdmin
            .from('dependentes')
            .update({ auth_user_id: authUserId, status: 'ativo' })
            .eq('id', existingDep.id)
        } else {
          const { data: socioResponsavel } = await supabaseAdmin
            .from('socios')
            .select('id')
            .eq('cpf', socio.cpf_responsavel)
            .eq('torcida_id', gestor.torcida_id!)
            .maybeSingle()

          if (socioResponsavel) {
            await supabaseAdmin
              .from('dependentes')
              .insert({
                torcida_id: gestor.torcida_id!,
                socio_titular_id: socioResponsavel.id,
                nome_completo: socio.nome_completo,
                cpf: socio.cpf,
                data_nascimento: socio.data_nascimento,
                e_menor: true,
                status: 'ativo',
                email: socio.email,
                auth_user_id: authUserId,
                cpf_responsavel: socio.cpf_responsavel,
              } as Database['public']['Tables']['dependentes']['Insert'])
          }
        }
      } catch {
        // Erro silencioso — não bloqueia a aprovação
      }
    }

    // Gerar 1ª mensalidade para o sócio aprovado
    let torcidaNomeParaEmail: string | null = null
    try {
      // Buscar dados necessários em paralelo
      const [tipoMensalidadeResult, torcidaResult] = await Promise.all([
        socio.tipo_mensalidade_id
          ? supabaseAdmin
              .from('tipos_mensalidade')
              .select('id, valor')
              .eq('id', socio.tipo_mensalidade_id)
              .eq('torcida_id', gestor.torcida_id!)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabaseAdmin
          .from('torcidas')
          .select('dia_vencimento_mensalidade, nome')
          .eq('id', gestor.torcida_id!)
          .maybeSingle(),
      ])

      const tipoMensalidade = tipoMensalidadeResult.data
      const torcida = torcidaResult.data
      torcidaNomeParaEmail = torcida?.nome ?? null

      if (torcida) {
        const hoje = new Date()
        const diaVencimento = torcida.dia_vencimento_mensalidade || 10
        const ultimoDiaMes = lastDayOfMonth(hoje).getDate()
        const diaEfetivo = Math.min(diaVencimento, ultimoDiaMes)

        // Calcular próximo vencimento: se o dia já passou este mês, usar próximo mês
        let dataVencimento = setDate(hoje, diaEfetivo)
        if (dataVencimento < hoje) {
          const proximoMes = addMonths(hoje, 1)
          const ultimoDiaProxMes = lastDayOfMonth(proximoMes).getDate()
          dataVencimento = setDate(proximoMes, Math.min(diaVencimento, ultimoDiaProxMes))
        }

        const referenciaMes = format(startOfMonth(dataVencimento), 'yyyy-MM-dd')
        const valor = tipoMensalidade?.valor ?? 0
        const tipoId = tipoMensalidade?.id ?? null

        await supabaseAdmin.from('pagamentos').insert({
          socio_id: id, // id do sócio na tabela socios (não o auth user id)
          torcida_id: gestor.torcida_id,
          tipo_mensalidade_id: tipoId,
          referencia_mes: referenciaMes,
          valor_original: valor,
          valor_perdoado: 0,
          data_vencimento: dataVencimento.toISOString(),
          status: 'pendente' as const,
          lembrete_7_dias_enviado: false,
          lembrete_3_dias_enviado: false,
          lembrete_dia_enviado: false,
        } as Database['public']['Tables']['pagamentos']['Insert'])
      }
    } catch (pagamentoError) {
      // Não falhar a aprovação por erro na 1ª mensalidade
      console.error('Erro ao gerar 1ª mensalidade:', pagamentoError)
    }

    // Registrar auditoria
    await supabaseAdmin.from('auditoria').insert({
      usuario_id: gestor.id,
      usuario_tipo: 'gestor' as const,
      acao: 'cadastro_aprovado',
      entidade: 'socios',
      entidade_id: id,
      dados_anteriores: { status: 'pendente' },
      dados_novos: { status: 'ativo', codigo_referencia: codigoReferencia },
      torcida_id: gestor.torcida_id,
    } as Database['public']['Tables']['auditoria']['Insert'])

    // Enviar email de boas-vindas (fire-and-forget)
    enviarEmailCadastroAprovado(socio.email, {
      nome: socio.nome_completo,
      torcidaNome: torcidaNomeParaEmail || 'sua torcida',
    }).catch(err => console.error('Erro ao enviar email de aprovacao:', err))

    return NextResponse.json({
      success: true,
      message: 'Cadastro aprovado com sucesso!',
      socio: {
        id: socio.id,
        nome: socio.nome_completo,
        email: socio.email,
        codigo_referencia: codigoReferencia,
        status: 'ativo',
      },
    })
  } catch (error) {
    console.error('Erro ao aprovar cadastro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
