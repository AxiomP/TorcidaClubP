import { NextRequest, NextResponse } from 'next/server'
import { createRecoveryClient } from '@/lib/supabase/server-recovery'

/**
 * POST /api/auth/recuperar-senha
 * Delega o envio do e-mail de recuperação ao Supabase (SMTP configurado no dashboard).
 * Sempre retorna 200 para evitar enumeração de e-mails.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body?.email?.trim()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    const supabase = await createRecoveryClient()
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/redefinir-senha`

    await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro POST /api/auth/recuperar-senha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
