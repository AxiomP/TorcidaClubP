import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import asaasService from '@/lib/services/asaas-service'

/**
 * DELETE /api/gestores/[id]
 * Encerra a conta do gestor autenticado.
 * Cancela assinatura Asaas → suspende torcida → marca gestor inativo → exclui Auth user.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar que o gestor pertence ao usuário autenticado
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('id, auth_user_id, asaas_pix_auth_id, torcida_id')
      .eq('id', id)
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (gestorError || !gestor) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })
    }

    // Cancelar assinatura Asaas se existir
    if (gestor.asaas_pix_auth_id) {
      try {
        await asaasService.cancelSubscription(gestor.asaas_pix_auth_id)
      } catch (err) {
        console.error('[gestores/delete] Erro ao cancelar assinatura Asaas:', err)
      }
    }

    // Marcar gestor como inativo (preserva dados históricos dos sócios)
    await supabaseAdmin
      .from('gestores')
      .update({ ativo: false })
      .eq('id', gestor.id)

    // Hard-delete: remover usuário do Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(user.id)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Erro DELETE /api/gestores/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
