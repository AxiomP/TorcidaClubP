import { type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Middleware de proteção de rotas
 * Verifica autenticação e autorização antes de permitir acesso às rotas protegidas
 * Distingue entre gestores, sócios titulares e dependentes
 */

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request)

  const pathname = request.nextUrl.pathname

  // Skip API routes — elas já fazem sua própria autenticação internamente
  if (pathname.startsWith('/api/')) {
    return response
  }

  // Rotas públicas — nunca precisam de autenticação (evita getUser() desnecessário)
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/t/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/recuperar-senha') ||
    pathname.startsWith('/redefinir-senha')

  if (isPublicRoute) {
    return response
  }

  // Redirect legacy /socio/* URLs → corrigir para route group sem prefixo
  if (pathname.startsWith('/socio/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pathname.replace('/socio', '')
    return Response.redirect(redirectUrl, 308)
  }

  // Rotas do sócio (route group (socio) não adiciona prefixo na URL)
  const socioRoutes = ['/painel', '/perfil', '/mensalidade', '/dependentes', '/ingressos', '/ficha-cadastral', '/historico']
  const isSocioRoute = socioRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Rota de aguardando validação (sócios pendentes)
  const isAguardandoValidacao = pathname === '/aguardando-validacao'

  // Rota de primeiro acesso (sócios recém aprovados)
  const isPrimeiroAcesso = pathname === '/primeiro-acesso'

  // Rotas de bloqueio
  const isTorcidaSuspensaRoute = pathname === '/torcida-suspensa'
  const isSocioBloqueadoRoute = pathname === '/bloqueado'
  const isGestorBloqueadoRoute = pathname === '/gestor/bloqueado'
  const isGestorAssinaturaRoute = pathname === '/gestor/assinatura'
  const isGestorPerfilRoute = pathname === '/gestor/perfil'
  const isGestorCheckoutRoute = pathname === '/gestor/checkout'

  const isGestorRoute = pathname.startsWith('/gestor')
  const isDependenteRoute = pathname.startsWith('/dependente/') || pathname === '/dependente'
  const isDependenteBloqueadoRoute = pathname === '/dependente/bloqueado'
  const isAuthRoute = pathname.startsWith('/login')

  // Obter usuário autenticado (validado pelo servidor Supabase)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Erro de auth — tratar sessão expirada
  if (authError) {
    // refresh_token_not_found é esperado (sessão expirada) — não logar como erro
    if (authError.code !== 'refresh_token_not_found') {
      // Apenas logar erros reais, não erros de autenticação esperados
      if (!authError.message?.includes('Auth session missing') &&
          authError.code !== 'session_not_found' &&
          !authError.message?.includes('session')) {
        console.warn('[middleware] Auth error (unexpected):', {
          code: authError.code,
          message: authError.message?.substring(0, 100), // truncar para evitar logs gigantes
        })
      }
    }
    if (isGestorRoute || isSocioRoute || isDependenteRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('erro', 'sessao_expirada')
      return Response.redirect(redirectUrl)
    }
    // Em outras rotas (login, etc.) apenas retornar sem loop
    return response
  }

  // Se não está autenticado e está tentando acessar rotas protegidas
  if (!user && (isGestorRoute || isSocioRoute || isDependenteRoute)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return Response.redirect(redirectUrl)
  }

  // Se está autenticado
  if (user) {
    let gestor = null;
    let socio = null;
    let dependente = null;
    let gestorAssinaturaStatus: string | null = null;

    if (isAuthRoute) {
      // Login: precisa resolver o role → rodar todas em paralelo
      const [g, s, d] = await Promise.all([
        supabaseAdmin.from('gestores').select('id, ativo, assinatura_status').eq('auth_user_id', user.id).maybeSingle(),
        supabaseAdmin.from('socios').select('id, status, primeiro_acesso_feito, torcida_id').eq('auth_user_id', user.id).maybeSingle(),
        supabaseAdmin.from('dependentes').select('id, status').eq('auth_user_id', user.id).maybeSingle(),
      ]);
      gestor = g.data; socio = s.data; dependente = d.data;
      // Para login de sócio: verificar assinatura do gestor da torcida
      if (s.data?.torcida_id) {
        const { data: gData } = await supabaseAdmin.from('gestores').select('assinatura_status').eq('torcida_id', s.data.torcida_id).maybeSingle();
        gestorAssinaturaStatus = gData?.assinatura_status ?? null;
      }
    } else {
      // Rotas específicas: query sob demanda (apenas a tabela necessária)
      if (isGestorRoute) {
        const { data } = await supabaseAdmin.from('gestores').select('id, ativo, assinatura_status').eq('auth_user_id', user.id).maybeSingle();
        gestor = data;
      }
      if (isSocioRoute || isAguardandoValidacao || isSocioBloqueadoRoute || isPrimeiroAcesso || isTorcidaSuspensaRoute) {
        const { data } = await supabaseAdmin
          .from('socios')
          .select('id, status, primeiro_acesso_feito, torcida_id, e_menor')
          .eq('auth_user_id', user.id)
          .maybeSingle()
        socio = data;
        if (data?.torcida_id) {
          const { data: gData } = await supabaseAdmin.from('gestores').select('assinatura_status').eq('torcida_id', data.torcida_id).maybeSingle();
          gestorAssinaturaStatus = gData?.assinatura_status ?? null;
        }
        // Menor auto-cadastrado ou sócio não encontrado: verificar dependentes
        const precisaVerificarDep = (!socio || socio.e_menor) && isSocioRoute
        if (precisaVerificarDep) {
          const { data: depData } = await supabaseAdmin.from('dependentes').select('id, status, torcida_id').eq('auth_user_id', user.id).maybeSingle();
          if (depData?.status === 'ativo') {
            dependente = depData;
            // Menor com vínculo ativo em dependentes → tratar como dependente, não titular
            if (socio?.e_menor) socio = null;
            if (depData.torcida_id) {
              const { data: gData } = await supabaseAdmin.from('gestores').select('assinatura_status').eq('torcida_id', depData.torcida_id).maybeSingle();
              gestorAssinaturaStatus = gData?.assinatura_status ?? null;
            }
          }
        }
      }
      if (isDependenteRoute || isDependenteBloqueadoRoute) {
        const { data } = await supabaseAdmin.from('dependentes').select('id, status, torcida_id').eq('auth_user_id', user.id).maybeSingle();
        dependente = data;
      }
    }

    const isGestor = !!gestor && gestor.ativo !== false
    const isGestorInativo = !!gestor && gestor.ativo === false

    const isSocioPendente = !!socio && socio.status === 'pendente'
    const isSocioTitular = !!socio && socio.status === 'ativo'
    const isSocioInadimplente = !!socio && socio.status === 'inadimplente'
    const isSocioBloqueado = !!socio && socio.status === 'bloqueado'

    const isSocioPrimeiroAcesso = (isSocioTitular || isSocioInadimplente) && socio?.primeiro_acesso_feito === false

    const isDependente = !!dependente && dependente.status === 'ativo'

    // Assinatura do gestor inativa → sócios veem página de torcida suspensa
    const isTorcidaSuspensa = gestorAssinaturaStatus !== null && gestorAssinaturaStatus !== 'ativa'

    // ========== REDIRECIONAMENTOS PARA PÁGINAS DE BLOQUEIO ==========

    // Torcida SUSPENSA → bloquear sócios (exceto a própria página de suspensão)
    if (isTorcidaSuspensa && isSocioRoute && !isTorcidaSuspensaRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/torcida-suspensa'
      return Response.redirect(redirectUrl)
    }
    if (isTorcidaSuspensa && isTorcidaSuspensaRoute) {
      return response
    }
    if (!isTorcidaSuspensa && isTorcidaSuspensaRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/painel'
      return Response.redirect(redirectUrl)
    }

    // Sócio BLOQUEADO tentando acessar área de sócio (exceto página de bloqueio)
    if (isSocioBloqueado && isSocioRoute && !isSocioBloqueadoRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/bloqueado'
      return Response.redirect(redirectUrl)
    }

    // Sócio BLOQUEADO já na página de bloqueio - permitir
    if (isSocioBloqueado && isSocioBloqueadoRoute) {
      return response
    }

    // Sócio NÃO bloqueado tentando acessar página de bloqueio
    if (!isSocioBloqueado && isSocioBloqueadoRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/painel'
      return Response.redirect(redirectUrl)
    }

    // Gestor INATIVO tentando acessar área de gestor (exceto página de bloqueio)
    if (isGestorInativo && isGestorRoute && !isGestorBloqueadoRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/gestor/bloqueado'
      return Response.redirect(redirectUrl)
    }

    // Gestor INATIVO já na página de bloqueio - permitir
    if (isGestorInativo && isGestorBloqueadoRoute) {
      return response
    }

    // Gestor ATIVO tentando acessar página de bloqueio
    if (isGestor && isGestorBloqueadoRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/gestor/dashboard'
      return Response.redirect(redirectUrl)
    }

    // ========== FIM REDIRECIONAMENTOS DE BLOQUEIO ==========

    // ========== REDIRECIONAMENTO DE INADIMPLÊNCIA ==========

    if (isSocioInadimplente && isSocioRoute && pathname !== '/mensalidade') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/mensalidade'
      return Response.redirect(redirectUrl)
    }

    // ========== FIM REDIRECIONAMENTO DE INADIMPLÊNCIA ==========

    // Gestor ativo mas assinatura não ativa → redirecionar para /gestor/checkout
    if (
      isGestor &&
      isGestorRoute &&
      !isGestorCheckoutRoute &&
      !isGestorAssinaturaRoute &&
      !isGestorPerfilRoute &&
      !isGestorBloqueadoRoute &&
      gestor?.assinatura_status !== 'ativa'
    ) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/gestor/checkout'
      return Response.redirect(redirectUrl)
    }

    // Sócio ativo que ainda não fez o primeiro acesso → redirecionar para /primeiro-acesso
    if (isSocioPrimeiroAcesso && isSocioRoute && !isPrimeiroAcesso) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/primeiro-acesso'
      return Response.redirect(redirectUrl)
    }

    // Sócio na rota /primeiro-acesso mas já concluiu o primeiro acesso → redirecionar para /painel
    if (isSocioTitular && !isSocioPrimeiroAcesso && isPrimeiroAcesso) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/painel'
      return Response.redirect(redirectUrl)
    }

    // Permitir sócio no primeiro acesso acessar /primeiro-acesso
    if (isSocioPrimeiroAcesso && isPrimeiroAcesso) {
      return response
    }

    // Sócio pendente tentando acessar área de sócio (exceto aguardando-validacao)
    if (isSocioPendente && isSocioRoute && !isAguardandoValidacao) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/aguardando-validacao'
      return Response.redirect(redirectUrl)
    }

    // Sócio ativo/inadimplente tentando acessar aguardando-validacao
    if (isSocioTitular && isAguardandoValidacao) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/painel'
      return Response.redirect(redirectUrl)
    }

    // Gestor tentando acessar área de sócio ou dependente
    if (isGestor && (isSocioRoute || isDependenteRoute)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/gestor/dashboard'
      return Response.redirect(redirectUrl)
    }

    // Sócio titular tentando acessar área de gestor
    if (isSocioTitular && !isGestor && isGestorRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/painel'
      return Response.redirect(redirectUrl)
    }

    // Sócio titular tentando acessar área de dependente
    if (isSocioTitular && isDependenteRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/painel'
      return Response.redirect(redirectUrl)
    }

    // Dependente INATIVO na página de bloqueio → permitir acesso
    if (isDependenteBloqueadoRoute && dependente && dependente.status !== 'ativo') {
      return response
    }
    // Dependente ATIVO tentando acessar página de bloqueio → painel
    if (isDependenteBloqueadoRoute && isDependente) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/painel'
      return Response.redirect(redirectUrl)
    }
    // Sem registro de dependente na página de bloqueio → login
    if (isDependenteBloqueadoRoute && !dependente) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return Response.redirect(redirectUrl)
    }

    // Dependente tentando acessar área de gestor → redirecionar para painel
    if (isDependente && !isSocioTitular && !isGestor && isGestorRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/painel'
      return Response.redirect(redirectUrl)
    }

    // Se está na página de login e já está autenticado, redirecionar para o dashboard apropriado
    if (isAuthRoute) {
      const redirectUrl = request.nextUrl.clone()
      // Limpar query params para evitar que ?tipo=gestor etc. se propaguem e causem loops
      redirectUrl.search = ''

      if (isGestor) {
        redirectUrl.pathname = '/gestor/dashboard'
      } else if (isSocioPrimeiroAcesso) {
        redirectUrl.pathname = '/primeiro-acesso'
      } else if (isSocioTitular) {
        redirectUrl.pathname = '/painel'
      } else if (isSocioInadimplente) {
        redirectUrl.pathname = '/mensalidade'
      } else if (isSocioPendente) {
        redirectUrl.pathname = '/aguardando-validacao'
      } else if (isDependente) {
        redirectUrl.pathname = '/painel'
      } else {
        // Usuário autenticado mas sem perfil válido
        // Deixar na página de login para mostrar erro
        return response
      }

      return Response.redirect(redirectUrl)
    }

    // Verificar se usuário tem permissão para a rota que está tentando acessar
    if (isGestorRoute && !isGestor) {
      // Usuário não é gestor tentando acessar área de gestor
      const redirectUrl = request.nextUrl.clone()
      if (isSocioTitular) {
        redirectUrl.pathname = '/painel'
      } else if (isDependente) {
        redirectUrl.pathname = '/painel'
      } else {
        redirectUrl.pathname = '/login'
      }
      return Response.redirect(redirectUrl)
    }

    if ((isSocioRoute || isPrimeiroAcesso) && !isSocioTitular && !isSocioInadimplente && !isGestor && !isSocioPendente && !isDependente) {
      // Usuário não é sócio titular/pendente/dependente tentando acessar área de sócio
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return Response.redirect(redirectUrl)
    }

    // Permitir sócio pendente acessar apenas aguardando-validacao
    if (isSocioPendente && isAguardandoValidacao) {
      return response
    }

    if (isDependenteRoute && !isDependente) {
      const redirectUrl = request.nextUrl.clone()
      if (isGestor) {
        redirectUrl.pathname = '/gestor/dashboard'
      } else if (isSocioTitular) {
        redirectUrl.pathname = '/painel'
      } else if (dependente) {
        // Dependente existe mas está inativo (titular bloqueado)
        redirectUrl.pathname = '/dependente/bloqueado'
      } else {
        redirectUrl.pathname = '/login'
      }
      return Response.redirect(redirectUrl)
    }
  }

  return response
}

// Configurar quais rotas o middleware deve proteger
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
