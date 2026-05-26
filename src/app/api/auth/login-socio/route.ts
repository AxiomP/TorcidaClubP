import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API de login para sócio-torcedor (email/senha)
 * Diferente do OAuth que é usado pelos gestores
 */
export async function POST(request: NextRequest) {
  try {
    let email: string, senha: string
    try {
      const body = await request.json()
      email = body.email
      senha = body.senha
    } catch {
      return NextResponse.json(
        { error: 'Dados de login inválidos. Tente novamente.' },
        { status: 400 }
      )
    }

    // Validar campos obrigatórios
    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Tentar fazer login com email/senha - com retry se falhar na primeira vez
    let authData: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | null = null
    let authError: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['error'] | null = null
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      const result = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })
      
      authData = result.data
      authError = result.error
      
      if (!authError) {
        // Sucesso - sair do loop
        break
      }
      
      // Se falhou, pode ser erro de sessão corrompida
      // Tentar limpar cookies e fazer nova tentativa
      if (attempt < 2 && authError?.message?.includes('Invalid')) {
        try {
          // Criar novo cliente para limpar sessão
          const newSupabase = await createClient()
          await newSupabase.auth.signOut().catch(() => null)
          // Aguardar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch {
          // Ignorar erros de limpeza
        }
      }
    }

    if (authError) {
      console.error('Erro de autenticação:', authError)

      // Mensagens de erro amigáveis
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Email ou senha incorretos' },
          { status: 401 }
        )
      }

      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Email não confirmado. Verifique sua caixa de entrada.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Erro ao fazer login. Tente novamente.' },
        { status: 401 }
      )
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }

    if (!authData) {
      return NextResponse.json(
        { error: 'Erro de autenticação' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Verificar se é um sócio titular
    // Usa supabaseAdmin para bypassar RLS: após signInWithPassword, os cookies de sessão
    // ainda não foram propagados para o getAll() do server client, então auth.uid() pode
    // não estar disponível no contexto RLS desta mesma requisição.
    const { data: socio } = await supabaseAdmin
      .from('socios')
      .select('id, nome_completo, status, torcida_id, e_menor')
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (socio) {
      // Menor auto-cadastrado: verificar se já tem vínculo em dependentes e tratar como dependente
      if (socio.e_menor) {
        const { data: depVinculo } = await supabaseAdmin
          .from('dependentes')
          .select('id, status, socio_titular_id, nome_completo')
          .eq('auth_user_id', userId)
          .eq('status', 'ativo')
          .maybeSingle()

        if (depVinculo) {
          const { data: titular } = await supabaseAdmin
            .from('socios')
            .select('id, nome_completo, status')
            .eq('id', depVinculo.socio_titular_id)
            .maybeSingle()

          if (!titular || titular.status === 'bloqueado' || titular.status === 'cancelado') {
            return NextResponse.json(
              { error: 'A conta do sócio responsável está bloqueada ou cancelada.', status: 'titular_bloqueado' },
              { status: 403 }
            )
          }

          return NextResponse.json({
            success: true,
            userType: 'dependente',
            redirectTo: '/painel',
            user: {
              id: depVinculo.id,
              nome: socio.nome_completo,
              status: depVinculo.status,
              titularId: depVinculo.socio_titular_id,
              titularNome: titular.nome_completo,
            }
          })
        }
      }

      // É um sócio titular
      if (socio.status === 'pendente') {
        return NextResponse.json(
          {
            error: 'Seu cadastro ainda está pendente de aprovação.',
            status: 'pendente'
          },
          { status: 403 }
        )
      }

      if (socio.status === 'rejeitado') {
        return NextResponse.json(
          {
            error: 'Seu cadastro foi rejeitado. Entre em contato com a torcida.',
            status: 'rejeitado'
          },
          { status: 403 }
        )
      }

      if (socio.status === 'cancelado') {
        return NextResponse.json(
          {
            error: 'Sua associação foi cancelada.',
            status: 'cancelado'
          },
          { status: 403 }
        )
      }

      // Registrar acesso (fire-and-forget — não bloqueia a resposta)
      if (socio.torcida_id) {
        supabaseAdmin.from('acessos_log').insert({
          socio_id: socio.id,
          torcida_id: socio.torcida_id,
        }).then(({ error }) => {
          if (error) console.error('[login-socio] Erro ao registrar acesso:', error)
        })
      }

      // Login bem-sucedido como sócio titular
      return NextResponse.json({
        success: true,
        userType: 'titular',
        redirectTo: '/painel',
        user: {
          id: socio.id,
          nome: socio.nome_completo,
          status: socio.status,
        }
      })
    }

    // Verificar se é um dependente
    const { data: dependente } = await supabaseAdmin
      .from('dependentes')
      .select('id, nome_completo, status, socio_titular_id, torcida_id')
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (dependente) {
      // É um dependente
      if (dependente.status !== 'ativo') {
        return NextResponse.json(
          {
            error: 'Sua conta de dependente está inativa.',
            status: dependente.status
          },
          { status: 403 }
        )
      }

      // Verificar status do titular
      const { data: titular } = await supabaseAdmin
        .from('socios')
        .select('id, nome_completo, status')
        .eq('id', dependente.socio_titular_id)
        .maybeSingle()

      if (!titular || titular.status === 'bloqueado' || titular.status === 'cancelado') {
        return NextResponse.json(
          {
            error: 'A conta do sócio responsável está bloqueada ou cancelada.',
            status: 'titular_bloqueado'
          },
          { status: 403 }
        )
      }

      // Login bem-sucedido como dependente
      return NextResponse.json({
        success: true,
        userType: 'dependente',
        redirectTo: '/painel',
        user: {
          id: dependente.id,
          nome: dependente.nome_completo,
          status: dependente.status,
          titularId: dependente.socio_titular_id,
          titularNome: titular.nome_completo,
        }
      })
    }

    // Usuário existe no Auth mas não é sócio nem dependente
    // Pode ser um gestor tentando usar o login errado
    const { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (gestor) {
      // Limpar sessão dangling antes de retornar erro
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          error: 'Esta conta é de um gestor. Use o login com Google.',
          isGestor: true
        },
        { status: 400 }
      )
    }

    // Usuário não encontrado em nenhuma tabela — limpar sessão dangling
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'Conta não encontrada. Faça seu cadastro primeiro.' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Erro no login de sócio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
