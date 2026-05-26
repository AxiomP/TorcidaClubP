import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Callback handler central de Autenticação
 * - Links de E-mail (Recuperação): Exclusivo do Sócio -> Vai para /redefinir-senha
 * - Google OAuth: Exclusivo para Gestores -> Vai para o fluxo de checkout/dashboard
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!baseUrl) {
    console.error('[callback] NEXT_PUBLIC_SITE_URL não configurada')
    return new Response('Erro de configuração do servidor', { status: 500 })
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', baseUrl))
  }

  try {
    const response = NextResponse.redirect(new URL('/login', baseUrl), { status: 307 })

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          storageKey: 'torcida-club-auth-token',
        },
        cookies: {
          getAll() {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const { domain: _domain, ...cookieOptions } = {
                path: '/',
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                ...options,
              }
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )

    // Troca o código PKCE pela sessão ativa (grava os cookies de autenticação)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[callback] exchangeCodeForSession error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_error', baseUrl))
    }

    // Pega os dados do usuário para saber como ele se autenticou
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('[callback] Nenhum usuário retornado após exchange')
      return NextResponse.redirect(new URL('/login?error=no_user', baseUrl))
    }

    // 🛡️ SEPARAÇÃO ESTRITA DE PAPÉIS
    // Se o método de login NÃO for Google, tratamos estritamente como o fluxo de e-mail do Sócio.
    // Ele é enviado direto para redefinir a senha dele, sem tocar na tabela de gestores.
    if (user.app_metadata?.provider !== 'google') {
      console.log('[callback] Fluxo de e-mail detectado. Redirecionando Sócio para /redefinir-senha')
      response.headers.set('location', new URL('/redefinir-senha', baseUrl).toString())
      return response
    }

    // =========================================================================
    // 💼 FLUXO EXCLUSIVO DE GESTORES (Apenas logins originados via Google OAuth)
    // =========================================================================
    console.log('[callback] Gestor autenticado via Google:', { userId: user.id, email: user.email })

    const googleId = user.user_metadata?.provider_id || user.user_metadata?.sub || null

    let { data: gestor } = await supabaseAdmin
      .from('gestores')
      .select('id, ativo, assinatura_status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!gestor && user.email) {
      const { data: gestorPorEmail } = await supabaseAdmin
        .from('gestores')
        .select('id, ativo, auth_user_id, assinatura_status')
        .eq('email', user.email)
        .maybeSingle()

      if (gestorPorEmail) {
        if (!gestorPorEmail.ativo) {
          return NextResponse.redirect(new URL('/login?error=account_inactive', baseUrl))
        }

        const { error: updateError } = await supabaseAdmin
          .from('gestores')
          .update({
            auth_user_id: user.id,
            google_id: googleId,
            last_login: new Date().toISOString(),
          })
          .eq('id', gestorPorEmail.id)

        if (updateError) {
          console.error('[callback] Erro ao vincular auth_user_id ao gestor:', updateError)
          return NextResponse.redirect(new URL('/login?error=registration_failed', baseUrl))
        }

        gestor = gestorPorEmail
      }
    }

    let isNewGestor = false

    if (!gestor) {
      isNewGestor = true
      const { data: novoGestor, error: createError } = await supabaseAdmin
        .from('gestores')
        .insert({
          auth_user_id: user.id,
          email: user.email || '',
          nome_completo: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Gestor',
          google_id: googleId,
          torcida_id: null,
          ativo: true,
          role: 'gestor' as const,
        } as Database['public']['Tables']['gestores']['Insert'])
        .select('id, ativo, assinatura_status')
        .single()

      if (createError) {
        if (createError.code === '23505') {
          const { data: raceGestor } = await supabaseAdmin
            .from('gestores')
            .select('id, ativo, assinatura_status')
            .eq('auth_user_id', user.id)
            .maybeSingle()
          if (raceGestor) {
            gestor = raceGestor
          } else {
            return NextResponse.redirect(new URL('/login?error=registration_failed', baseUrl))
          }
        } else {
          console.error('[callback] Erro ao criar gestor:', createError)
          return NextResponse.redirect(new URL('/login?error=registration_failed', baseUrl))
        }
      } else {
        gestor = novoGestor
      }
    }

    let destination: string
    if (isNewGestor) {
      destination = '/gestor/perfil'
    } else if (gestor?.assinatura_status !== 'ativa') {
      destination = '/gestor/checkout'
    } else {
      destination = '/gestor/dashboard'
    }

    console.log('[callback] Redirecionando Gestor para:', destination)
    response.headers.set('location', new URL(destination, baseUrl).toString())
    return response

  } catch (error) {
    console.error('[callback] Erro crítico no callback:', error)
    return NextResponse.redirect(new URL('/login?error=callback_error', baseUrl))
  }
}