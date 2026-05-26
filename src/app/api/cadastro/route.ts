import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSocioSchema } from '@/lib/validations/socio-schema'
import { validarCPF } from '@/lib/validations/cpf-validator'
import { isMenorDeIdade } from '@/lib/utils/calculate'
import { encrypt } from '@/lib/utils/encryption'
import { sanitizePhone } from '@/lib/utils/sanitize-phone'
import type { Database } from '@/types/database'
import type { SocioMenorCompletoData } from '@/lib/validations/socio-schema'

type Socio = Database['public']['Tables']['socios']['Row']
type TipoMensalidade = Database['public']['Tables']['tipos_mensalidade']['Row']

/**
 * API Route para criar novo cadastro de sócio
 * POST /api/cadastro
 *
 * Body: SocioCompletoData | SocioMenorCompletoData (validado pelo Zod)
 */

export async function POST(request: NextRequest) {
  try {
    // Parse do body
    const body = await request.json()

    const dataNascString = typeof body.data_nascimento === 'string' 
      ? body.data_nascimento.split('T')[0] 
      : ''

    // Validar dados com Zod
    const dataNascimento = new Date(`${dataNascString}T12:00:00`)
    const schema = getSocioSchema(dataNascimento)

    let validatedData
    try {
      validatedData = schema.parse(body)
    } catch (validationError: unknown) {
      const zodError = validationError as { errors?: unknown }
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: zodError.errors,
        },
        { status: 400 }
      )
    }

    // Criar cliente Supabase
    const supabase = await createClient()

    // Limpar CPF (remover formatação)
    const cpfLimpo = validatedData.cpf.replace(/\D/g, '')

    // ============================================================================
    // VALIDAÇÕES DE NEGÓCIO
    // ============================================================================

    // 1. Validar CPF com algoritmo
    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }

    // 2. Verificar se CPF já existe
    const { data: cpfExistente } = await supabaseAdmin
      .from('socios')
      .select('id, status')
      .eq('cpf', cpfLimpo)
      .maybeSingle()



    if (cpfExistente && cpfExistente.status !== 'rejeitado') {
      return NextResponse.json(
        { error: 'CPF já cadastrado no sistema' },
        { status: 409 }
      )
    }

    // 3. Verificar se CPF está bloqueado
    const { data: cpfBloqueado } = await supabase
      .from('cpf_bloqueados')
      .select('id, motivo')
      .eq('cpf', cpfLimpo)
      .eq('ativo', true)
      .maybeSingle()

    if (cpfBloqueado) {
      return NextResponse.json(
        { error: 'CPF bloqueado. Entre em contato com o gestor.' },
        { status: 403 }
      )
    }

    // 4. Verificar se email já existe (usa admin para ver todos os sócios independente de RLS)
    const { data: emailExistente } = await supabaseAdmin
      .from('socios')
      .select('id, status')
      .eq('email', validatedData.email.toLowerCase())
      .maybeSingle()

    if (emailExistente && emailExistente.status !== 'rejeitado') {
      return NextResponse.json(
        { error: 'Email já cadastrado no sistema' },
        { status: 409 }
      )
    }

    // 5. Verificar se tipo de mensalidade existe e está ativo
    const { data: tipoMensalidade, error: tipoError } = await supabaseAdmin
      .from('tipos_mensalidade')
      .select('id, nome, valor')
      .eq('id', validatedData.tipo_mensalidade_id)
      .eq('ativo', true)
      .maybeSingle()

    if (tipoError || !tipoMensalidade) {
      return NextResponse.json(
        { error: 'Tipo de mensalidade inválido ou inativo' },
        { status: 400 }
      )
    }

    // ============================================================================
    // PREPARAR DADOS PARA INSERÇÃO
    // ============================================================================

    const eMenor = isMenorDeIdade(dataNascimento)

    // Pegar torcida_id do tipo de mensalidade
    const { data: tipoComTorcidaData } = await supabaseAdmin
      .from('tipos_mensalidade')
      .select('torcida_id')
      .eq('id', validatedData.tipo_mensalidade_id)
      .maybeSingle()

    const tipoComTorcida = tipoComTorcidaData as Pick<TipoMensalidade, 'torcida_id'> | null

    if (!tipoComTorcida) {
      return NextResponse.json(
        { error: 'Erro ao identificar torcida' },
        { status: 500 }
      )
    }

    // Hash da senha (Supabase Auth)
    // NOTA: Para sócios, vamos criar conta depois da aprovação
    // Por enquanto, só salvamos o hash da senha

    // Dados base do sócio
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socioData: Record<string, any> = {
      // Step 1: Dados Pessoais
      cpf: cpfLimpo,
      nome_completo: validatedData.nome_completo,
      apelido: validatedData.apelido || null,
      data_nascimento: dataNascString,
      genero: validatedData.genero || null,
      estado_civil: validatedData.estado_civil || null,
      numero_rg: validatedData.numero_rg || null,
      escolaridade: validatedData.escolaridade || null,
      profissao: validatedData.profissao || null,
      nome_mae: validatedData.nome_mae || null,
      nome_pai: validatedData.nome_pai || null,

      // Step 2: Endereço e Contato
      endereco_completo: validatedData.endereco_completo,
      numero: validatedData.numero,
      complemento: validatedData.complemento || null,
      bairro: validatedData.bairro,
      cidade: validatedData.cidade,
      estado: validatedData.estado,
      cep: validatedData.cep?.replace(/\D/g, '') || null,
      whatsapp: sanitizePhone(validatedData.whatsapp) || '',
      email: validatedData.email.toLowerCase(),
      rede_social: validatedData.rede_social || null,
      contato_emergencia_nome: validatedData.contato_emergencia_nome || null,
      contato_emergencia_telefone:
        validatedData.contato_emergencia_telefone?.trim().replace(/\D/g, '') || null,
      contato_emergencia_parentesco:
        validatedData.contato_emergencia_parentesco || null,

      // Step 3: Saúde
      necessidades_especiais: validatedData.necessidades_especiais || false,
      descricao_necessidades: validatedData.descricao_necessidades || null,
      alergias: validatedData.alergias || null,
      usa_medicacao: validatedData.usa_medicacao || false,
      medicacao_detalhes: validatedData.medicacao_detalhes || null,

      // Step 4: Documentos
      tipo_mensalidade_id: validatedData.tipo_mensalidade_id,
      tipo_documento: validatedData.tipo_documento,
      // Novos campos de documento frente/verso (requer colunas no banco)
      doc_frente_url: validatedData.documento_frente_url,
      doc_verso_url: validatedData.documento_verso_url || null,
      // Mantém compatibilidade com campo antigo (usar frente como principal)
      doc_identificacao_url: validatedData.documento_frente_url,
      tipo_comprovante: validatedData.tipo_comprovante || null,
      comprovante_endereco_url: validatedData.comprovante_endereco_url,
      selfie_url: validatedData.selfie_url,
      assinatura_url: validatedData.assinatura_url,

      // Senha criptografada (será descriptografada na aprovação para criar conta Supabase Auth)
      senha_hash: encrypt(validatedData.senha),

      // Relações
      torcida_id: tipoComTorcida.torcida_id,

      // Status e flags
      status: 'pendente', // RN002: Status inicial
      e_menor: eMenor,

      // Datas
      data_cadastro: new Date().toISOString(),
    }

    // Se for menor, adicionar dados do responsável
    if (eMenor) {
      const menorData = validatedData as SocioMenorCompletoData
      socioData.cpf_responsavel = menorData.cpf_responsavel?.replace(/\D/g, '') ?? null
      socioData.nome_responsavel = menorData.nome_responsavel
      socioData.documento_responsavel_url = menorData.documento_responsavel_url || null
      socioData.termo_menoridade_url = menorData.termo_menoridade_url || null
    }

    // ============================================================================
    // INSERIR OU REATIVAR NO BANCO
    // ============================================================================

    let novoSocio: Socio | null = null
    const registroExistente = cpfExistente || emailExistente;

    if (registroExistente && registroExistente.status === 'rejeitado') {
      const { data, error: updateError } = await supabaseAdmin
        .from('socios')
        .update({ 
          ...socioData, 
          status: 'pendente', 
          motivo_rejeicao: null,
          data_rejeicao: null 
        })
        .eq('id', registroExistente.id)
        .select('id, nome_completo, cpf, email, status')
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Erro ao atualizar cadastro', details: updateError }, { status: 500 });
      }
      novoSocio = data as Socio;
    } else {

      const { data, error: insertError } = await supabaseAdmin
        .from('socios')
        .insert(socioData as Database['public']['Tables']['socios']['Insert'])
        .select('id, nome_completo, cpf, email, status')
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Erro ao criar cadastro', details: insertError }, { status: 500 });
      }
      novoSocio = data as Socio;
    }

    if (!novoSocio) {
      return NextResponse.json({ error: 'Erro inesperado ao processar cadastro' }, { status: 500 });
    }

    // Atualizar assinatura do responsável (fire-and-forget)
    if (eMenor) {
      const menorData = validatedData as SocioMenorCompletoData
      if (menorData.responsavel_id && socioData.assinatura_url) {
        void Promise.resolve(
          supabaseAdmin
            .from('socios')
            .update({ assinatura_url: socioData.assinatura_url as string })
            .eq('id', menorData.responsavel_id)
            .eq('torcida_id', tipoComTorcida.torcida_id)
        ).catch((err: unknown) => console.error('Erro ao atualizar assinatura do responsável:', err))
      }
    }

    // ============================================================================
    // AUDITORIA (Opcional)
    // ============================================================================

    await supabaseAdmin.from('auditoria').insert({
      usuario_tipo: 'publico' as const,
      acao: 'cadastro_criado',
      entidade: 'socios',
      entidade_id: novoSocio.id,
      dados_novos: { status: 'pendente' },
      torcida_id: tipoComTorcida.torcida_id,
    } as Database['public']['Tables']['auditoria']['Insert'])

    // ============================================================================
    // RESPOSTA
    // ============================================================================

    return NextResponse.json({
      success: true,
      id: novoSocio.id,
      message: 'Cadastro criado com sucesso! Aguarde a aprovação do gestor.',
      socio: {
        id: novoSocio.id,
        nome: novoSocio.nome_completo,
        email: novoSocio.email,
        status: novoSocio.status,
      },
    })
  } catch (error) {
    console.error('Erro na API de cadastro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
