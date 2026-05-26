import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const [torcidaRes, gestorRes] = await Promise.all([
    supabaseAdmin
      .from('torcidas')
      .select('idade_min_pagamento, idade_min_compra_ingresso')
      .eq('id', id)
      .maybeSingle(),
    supabaseAdmin
      .from('gestores')
      .select('telefone')
      .eq('torcida_id', id)
      .eq('role', 'admin')
      .maybeSingle()
  ])

  if (!torcidaRes.data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  
  return NextResponse.json({
    ...torcidaRes.data,
    telefone_gestor: gestorRes.data?.telefone ?? null
  })
}
