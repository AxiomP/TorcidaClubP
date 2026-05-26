import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
import { enviarEmailCadastroRecusado } from '@/lib/services/email-service'

type Gestor = Database['public']['Tables']['gestores']['Row']
type Socio = Database['public']['Tables']['socios']['Row']

/**
 * API Route para rejeitar cadastro de sócio
 * POST /api/cadastro/[id]/rejeitar
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { motivo } = body

    if (!motivo || !motivo.trim()) {
      return NextResponse.json(
        { error: 'Motivo é obrigatório' },
        { status: 400 }
      )
    }

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
      .select('id, torcida_id')
      .eq('auth_user_id', user.id)
      .single()

    const gestor = gestorData as Pick<Gestor, 'id' | 'torcida_id'> | null

    if (!gestor) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Buscar cadastro
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

    // Verificar se já foi processado
    if (socio.status !== 'pendente') {
      return NextResponse.json(
        { error: 'Cadastro já foi processado' },
        { status: 400 }
      )
    }

    // Atualizar status para rejeitado (sem deletar, mantendo o vínculo com a torcida)
    const agoraStr = new Date().toISOString()
    
    const { data: socioAtualizado, error: updateError } = await supabaseAdmin
      .from('socios')
      .update({
        status: 'rejeitado' as const,
        motivo_rejeicao: motivo,
        data_rejeicao: agoraStr,
        rejeitado_por: gestor.id,
        senha_hash: null,
      } as Database['public']['Tables']['socios']['Update'])
      .eq('id', id)
      .select('id, nome_completo, whatsapp, status, email')
      .single()

    if (updateError) {
      console.error('Erro ao rejeitar cadastro:', updateError)
      return NextResponse.json(
        { error: 'Erro ao rejeitar cadastro' },
        { status: 500 }
      )
    }

    if (socioAtualizado?.email) {
      enviarEmailCadastroRecusado(socioAtualizado.email, {
        nome: socioAtualizado.nome_completo,
        motivo: motivo
      }).catch(console.error);
    }

    // Registrar auditoria
    await supabaseAdmin.from('auditoria').insert({
      usuario_id: gestor.id,
      usuario_tipo: 'gestor' as const,
      acao: 'cadastro_rejeitado',
      entidade: 'socios',
      entidade_id: id,
      dados_novos: { motivo },
      torcida_id: gestor.torcida_id,
    } as Database['public']['Tables']['auditoria']['Insert'])

    return NextResponse.json({
      success: true,
      message: 'Cadastro rejeitado com sucesso',
      dispararNotificacao: true,
      socio: {
        id: socioAtualizado.id,
        nome: socioAtualizado.nome_completo,
        whatsapp: socioAtualizado.whatsapp,
        motivo: motivo
      }
    })
  } catch (error) {
    console.error('Erro ao rejeitar cadastro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
