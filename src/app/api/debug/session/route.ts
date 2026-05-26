import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint para verificar estado da sessão
 * Use apenas em desenvolvimento para diagnosticar problemas de autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Obter sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Obter usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Obter cookies
    const allCookies = request.cookies.getAll().map(cookie => ({
      name: cookie.name,
      value: cookie.value.substring(0, 50) + (cookie.value.length > 50 ? '...' : ''),
    }))

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      session: {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
        expiresAt: session?.expires_at,
        expiresIn: session?.expires_in,
        error: sessionError?.message,
      },
      user: {
        exists: !!user,
        userId: user?.id,
        email: user?.email,
        error: userError?.message,
      },
      cookies: {
        count: allCookies.length,
        list: allCookies,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
