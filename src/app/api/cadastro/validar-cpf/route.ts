import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type CpfBloqueado = Database['public']['Tables']['cpf_bloqueados']['Row']

/**
 * API para validar CPF durante o cadastro
 * Verifica se CPF já existe ou está bloqueado
 *
 * GET /api/cadastro/validar-cpf?cpf=12345678900
 *
 * Returns:
 * - { valid: true, exists: false, blocked: false } - CPF válido e disponível
 * - { valid: false, exists: true } - CPF já cadastrado
 * - { valid: false, blocked: true } - CPF bloqueado
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cpf = searchParams.get('cpf')

    if (!cpf) {
      return NextResponse.json(
        { valid: false, error: 'CPF não informado' },
        { status: 400 }
      )
    }

    // Limpar CPF (remover pontos e traços)
    const cpfLimpo = cpf.replace(/\D/g, '')

    // Validar formato básico
    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { valid: false, error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se CPF já existe na tabela socios
    const { data: socioExistente, error: erroSocio } = await supabaseAdmin
      .from('socios')
      .select('id, status')
      .eq('cpf', cpfLimpo)
      .maybeSingle()

    if (erroSocio) {
      console.error('Erro ao buscar sócio:', erroSocio)
      return NextResponse.json(
        { valid: false, error: 'Erro ao validar CPF' },
        { status: 500 }
      )
    }

    if (socioExistente) {
      if (socioExistente.status === 'rejeitado') {
        return NextResponse.json({
          valid: true,
          exists: true,
          status: 'rejeitado',
          message: 'Cadastro anterior rejeitado. Você pode reenviar seus dados.'
        })
      }

      return NextResponse.json({
        valid: false,
        exists: true,
        message: 'Este CPF já está cadastrado no sistema',
      })
    }

    // Verificar se CPF já existe como dependente
    const { data: dependenteExistente } = await supabaseAdmin
      .from('dependentes')
      .select('id')
      .eq('cpf', cpfLimpo)
      .maybeSingle()

    if (dependenteExistente) {
      return NextResponse.json({
        valid: false,
        exists: true,
        message: 'Este CPF já está cadastrado como dependente no sistema',
      })
    }

    // Verificar se CPF está bloqueado
    const { data: cpfBloqueado, error: erroBloqueio } = await supabase
      .from('cpf_bloqueados')
      .select('id, motivo')
      .eq('cpf', cpfLimpo)
      .eq('ativo', true)
      .maybeSingle()

    if (erroBloqueio && erroBloqueio.code !== 'PGRST116') {
      // PGRST116 = tabela não existe, ignorar
      console.error('Erro ao verificar bloqueio:', erroBloqueio)
    }

    if (cpfBloqueado) {
      const bloqueio = cpfBloqueado as CpfBloqueado
      return NextResponse.json({
        valid: false,
        blocked: true,
        message: 'CPF bloqueado. Entre em contato com o gestor da torcida.',
        motivo: bloqueio.motivo,
      })
    }

    // CPF válido e disponível
    return NextResponse.json({
      valid: true,
      exists: false,
      blocked: false,
      message: 'CPF disponível para cadastro',
    })
  } catch (error) {
    console.error('Erro ao validar CPF:', error)
    return NextResponse.json(
      { valid: false, error: 'Erro interno ao validar CPF' },
      { status: 500 }
    )
  }
}
