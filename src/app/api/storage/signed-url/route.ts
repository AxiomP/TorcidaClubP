import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // Verificar autenticação do chamador
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL obrigatória' }, { status: 400 })

  const match = (url as string).match(/\/storage\/v1\/object\/(?:public|authenticated)\/([^/]+)\/(.+)/)
  if (!match) return NextResponse.json({ error: 'URL inválida' }, { status: 400 })

  const [, bucket, path] = match
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Não foi possível gerar signed URL' }, { status: 400 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}
