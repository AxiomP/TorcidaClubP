/**
 * Pagamento Service
 * Funções para manipulação de pagamentos
 * RN005, RN006, RN007, RN008, RN009, RN010
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { calcularDivida } from '@/lib/utils/calculate'
import { format, startOfMonth } from 'date-fns'
import { enviarEmailMensalidadeConfirmada, enviarEmailComprovanteRecusado } from '@/lib/services/email-service'
import { criarNotificacao } from '@/lib/services/notification-service'

/**
 * RN008: Busca e calcula dívida total de um sócio
 */
export async function calcularDividaSocio(socioId: string): Promise<{
  total: number
  meses: number
}> {
  const { data: pagamentos, error } = await supabaseAdmin
    .from('pagamentos')
    .select('valor_original, valor_perdoado')
    .eq('socio_id', socioId)
    .in('status', ['pendente', 'comprovante_enviado', 'recusado'])

  if (error) {
    console.error('Erro ao buscar pagamentos:', error)
    return { total: 0, meses: 0 }
  }

  if (!pagamentos || pagamentos.length === 0) {
    return { total: 0, meses: 0 }
  }

  return calcularDivida(pagamentos)
}

/**
 * Conta meses pendentes de pagamento
 */
export async function contarMesesPendentes(socioId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('pagamentos')
    .select('*', { count: 'exact', head: true })
    .eq('socio_id', socioId)
    .in('status', ['pendente', 'comprovante_enviado', 'recusado'])
    .lt('data_vencimento', new Date().toISOString())

  if (error) {
    console.error('Erro ao contar meses:', error)
    return 0
  }

  return count || 0
}

/**
 * RN044: Recalcula status do sócio baseado em seus pagamentos
 */
export async function recalcularStatusSocio(socioId: string): Promise<string> {
  // Buscar sócio atual
  const { data: socio, error: socioError } = await supabaseAdmin
    .from('socios')
    .select('status')
    .eq('id', socioId)
    .single()

  if (socioError || !socio) {
    throw new Error('Sócio não encontrado')
  }

  // Calcular dívida
  const { total, meses } = await calcularDividaSocio(socioId)

  // Determinar novo status
  let novoStatus: 'ativo' | 'inadimplente' = 'ativo'

  if (meses >= 2) {
    novoStatus = 'inadimplente'
  }

  // Atualizar sócio
  const { error: updateError } = await supabaseAdmin
    .from('socios')
    .update({
      status: novoStatus,
      meses_pendentes: meses,
      valor_divida_total: total,
      updated_at: new Date().toISOString()
    })
    .eq('id', socioId)

  if (updateError) {
    throw new Error('Erro ao atualizar status do sócio')
  }

  // RN045: Sincronizar dependentes
  await sincronizarDependentes(socioId, novoStatus)

  return novoStatus
}

/**
 * RN045: Sincroniza status dos dependentes com o titular.
 * Atualiza tanto dependentes.status quanto socios.status dos dependentes
 * que possuem conta própria (auth_user_id), garantindo que o middleware
 * os bloqueie corretamente mesmo quando e_menor não está definido.
 */
export async function sincronizarDependentes(
  titularId: string,
  statusTitular: string
): Promise<void> {
  const statusDependente: 'ativo' | 'inativo' = statusTitular === 'ativo' ? 'ativo' : 'inativo'
  const statusSocios: 'ativo' | 'bloqueado' = statusTitular === 'ativo' ? 'ativo' : 'bloqueado'

  await supabaseAdmin
    .from('dependentes')
    .update({ status: statusDependente })
    .eq('socio_titular_id', titularId)

  await sincronizarSociosDependentes(titularId, statusSocios)
}

/**
 * Atualiza o socios.status dos dependentes que possuem auth_user_id,
 * garantindo bloqueio no middleware independente de e_menor.
 * Ao restaurar ('ativo'), apenas socios atualmente 'bloqueado' são alterados.
 */
export async function sincronizarSociosDependentes(
  titularId: string,
  novoStatus: 'ativo' | 'bloqueado'
): Promise<void> {
  const { data: dependentes } = await supabaseAdmin
    .from('dependentes')
    .select('auth_user_id')
    .eq('socio_titular_id', titularId)
    .not('auth_user_id', 'is', null)

  if (!dependentes || dependentes.length === 0) return

  const authIds = dependentes
    .map((d: { auth_user_id: string | null }) => d.auth_user_id)
    .filter(Boolean) as string[]

  if (authIds.length === 0) return

  const query = supabaseAdmin
    .from('socios')
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .in('auth_user_id', authIds)

  // Ao restaurar, apenas reativar socios que foram bloqueados via cascade
  if (novoStatus === 'ativo') {
    await query.eq('status', 'bloqueado')
  } else {
    await query
  }
}

/**
 * RN010: Aprovar pagamento
 */
export async function aprovarPagamento(
  pagamentoId: string,
  gestorId: string
): Promise<void> {
  // Atualizar pagamento
  const { data: pagamento, error } = await supabaseAdmin
    .from('pagamentos')
    .update({
      status: 'confirmado',
      data_pagamento: new Date().toISOString(),
      data_confirmacao: new Date().toISOString(),
      confirmado_por: gestorId
    })
    .eq('id', pagamentoId)
    .select('*')
    .single()

  if (error || !pagamento) {
    console.error('Erro ao aprovar pagamento:', error)
    throw new Error('Erro ao aprovar pagamento')
  }

  // Buscar dados do sócio separadamente
  const { data: socio } = await supabaseAdmin
    .from('socios')
    .select('nome_completo, apelido, whatsapp, email, data_proximo_pagamento')
    .eq('id', pagamento.socio_id)
    .single()

  // Recalcular status do sócio
  await recalcularStatusSocio(pagamento.socio_id)

  // Formatar dados para notificações
  const nomeUsuario = socio?.apelido || socio?.nome_completo || 'Sócio'

  // Registrar auditoria
  await supabaseAdmin.from('auditoria').insert({
    usuario_id: gestorId,
    usuario_tipo: 'gestor',
    acao: 'aprovar_pagamento',
    entidade: 'pagamentos',
    entidade_id: pagamentoId,
    dados_novos: { status: 'confirmado' }
  })

  // Enviar email de confirmação (fire-and-forget)
  if (socio?.email) {
    enviarEmailMensalidadeConfirmada(socio.email, { nome: nomeUsuario })
      .catch(err => console.error('Erro ao enviar email mensalidade confirmada:', err))
  }
}

/**
 * RN010: Recusar pagamento
 */
export async function recusarPagamento(
  pagamentoId: string,
  gestorId: string,
  motivo: string
): Promise<void> {
  // Atualizar pagamento com motivo da recusa
  const { data: pagamento, error } = await supabaseAdmin
    .from('pagamentos')
    .update({
      status: 'recusado',
      confirmado_por: gestorId,
      motivo_recusa: motivo,
      updated_at: new Date().toISOString()
    })
    .eq('id', pagamentoId)
    .select('*')
    .single()

  if (error || !pagamento) {
    console.error('Erro ao recusar pagamento:', error)
    throw new Error('Erro ao recusar pagamento')
  }

  // Registrar auditoria
  await supabaseAdmin.from('auditoria').insert({
    usuario_id: gestorId,
    usuario_tipo: 'gestor',
    acao: 'recusar_pagamento',
    entidade: 'pagamentos',
    entidade_id: pagamentoId,
    dados_novos: { status: 'recusado', motivo }
  })

  // Buscar dados do sócio para notificação
  const { data: socio } = await supabaseAdmin
    .from('socios')
    .select('nome_completo, apelido, email')
    .eq('id', pagamento.socio_id)
    .single()

  const nomeUsuario = socio?.apelido || socio?.nome_completo || 'Sócio'

  // Enviar email de recusa (fire-and-forget)
  if (socio?.email) {
    enviarEmailComprovanteRecusado(socio.email, { nome: nomeUsuario, motivo })
      .catch(err => console.error('Erro ao enviar email recusa:', err))
  }

  // Criar notificação no sistema
  await criarNotificacao(pagamento.socio_id, {
    titulo: 'Comprovante recusado',
    mensagem: `Seu comprovante foi recusado. Motivo: ${motivo}`,
    tipo: 'geral'
  })
}

/**
 * RN009: Perdoar dívida do sócio
 */
export async function perdoarDivida(
  socioId: string,
  gestorId: string
): Promise<void> {
  // Buscar pagamentos pendentes para obter os valores
  const { data: pagamentosPendentes } = await supabaseAdmin
    .from('pagamentos')
    .select('id, valor_original')
    .eq('socio_id', socioId)
    .in('status', ['pendente', 'recusado', 'comprovante_enviado'])

  // Atualizar cada pagamento individualmente com seu valor_original como valor_perdoado
  for (const pag of pagamentosPendentes || []) {
    await supabaseAdmin
      .from('pagamentos')
      .update({
        status: 'perdoado',
        valor_perdoado: pag.valor_original,
        confirmado_por: gestorId,
        data_confirmacao: new Date().toISOString()
      })
      .eq('id', pag.id)
  }

  // Desbloquear sócio
  const { data: socio, error: socioError } = await supabaseAdmin
    .from('socios')
    .update({
      status: 'ativo',
      meses_pendentes: 0,
      valor_divida_total: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', socioId)
    .select('nome_completo, apelido, whatsapp')
    .single()

  if (socioError || !socio) {
    throw new Error('Erro ao atualizar sócio')
  }

  // Desbloquear dependentes (tabela dependentes + socios dos dependentes)
  await supabaseAdmin
    .from('dependentes')
    .update({ status: 'ativo' })
    .eq('socio_titular_id', socioId)
  await sincronizarSociosDependentes(socioId, 'ativo')

  // Registrar auditoria
  await supabaseAdmin.from('auditoria').insert({
    usuario_id: gestorId,
    usuario_tipo: 'gestor',
    acao: 'perdoar_divida',
    entidade: 'socios',
    entidade_id: socioId
  })
}

/**
 * Verifica se já existe pagamento para o mês
 */
export async function verificarPagamentoMes(
  socioId: string,
  torcidaId: string,
  referenciaMes: Date
): Promise<boolean> {
  const mesFormatado = format(startOfMonth(referenciaMes), 'yyyy-MM-dd')

  const { data, error } = await supabaseAdmin
    .from('pagamentos')
    .select('id')
    .eq('socio_id', socioId)
    .eq('torcida_id', torcidaId)
    .eq('referencia_mes', mesFormatado)
    .limit(1)

  if (error) {
    console.error('Erro ao verificar pagamento:', error)
    return false
  }

  return (data?.length || 0) > 0
}
