import { createClient } from '@/lib/supabase/client'

/**
 * Inicia o fluxo de autenticação com Google OAuth
 * Redireciona o usuário para a tela de login do Google
 */
export async function signInWithGoogle() {
  const supabase = createClient()
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error('Variável NEXT_PUBLIC_SITE_URL não configurada');
  }

  const redirectUrl = new URL('/api/auth/callback', siteUrl).toString();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    console.error('Erro ao fazer login com Google:', error)
    throw error
  }

  return data
}

/**
 * Faz logout do usuário
 * Nunca trava — sempre redireciona mesmo se signOut falhar
 */
export async function signOut() {
  const supabase = createClient()

  try {
    await supabase.auth.signOut({ scope: 'global' })
  } catch (err) {
    console.error('Erro ao fazer logout:', err)
  }

  // Sempre redireciona, mesmo se signOut falhar
  window.location.href = '/'
}
