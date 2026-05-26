import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

/**
 * Serviço de Notificações
 * Gerencia notificações para sócios, usando o schema real do banco
 */

type NotificacaoRow = Database['public']['Tables']['notificacoes']['Row']
type NotificacaoInsert = Database['public']['Tables']['notificacoes']['Insert']
type NotificationType = NotificacaoRow['tipo']

export type { NotificationType }

export interface NotificationData {
  titulo: string
  mensagem: string
  tipo: NotificationType
  canal?: NotificacaoRow['canal']
}

export type Notification = NotificacaoRow

/**
 * Cria uma notificação no banco de dados
 */
export async function criarNotificacao(
  socioId: string,
  data: NotificationData
): Promise<Notification | null> {
  try {
    const insert: NotificacaoInsert = {
      socio_id: socioId,
      titulo: data.titulo,
      mensagem: data.mensagem,
      tipo: data.tipo,
      canal: data.canal || 'sistema',
    }

    const { data: notificacao, error } = await supabaseAdmin
      .from('notificacoes')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar notificação:', error)
      return null
    }

    return notificacao
  } catch (error) {
    console.error('Exceção ao criar notificação:', error)
    return null
  }
}

/**
 * Busca notificações de um sócio específico
 */
export async function buscarNotificacoesSocio(
  socioId: string,
  limite: number = 20
): Promise<Notification[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notificacoes')
      .select('*')
      .eq('socio_id', socioId)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) {
      console.error('Erro ao buscar notificações do sócio:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Exceção ao buscar notificações do sócio:', error)
    return []
  }
}

/**
 * Busca notificações de sócios de uma torcida (para gestores)
 */
export async function buscarNotificacoesGestor(
  torcidaId: string,
  limite: number = 20
): Promise<Notification[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notificacoes')
      .select('*, socios!inner(torcida_id)')
      .eq('socios.torcida_id', torcidaId)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) {
      console.error('Erro ao buscar notificações:', error)
      return []
    }

    return (data || []) as unknown as Notification[]
  } catch (error) {
    console.error('Exceção ao buscar notificações:', error)
    return []
  }
}

/**
 * Cria notificações de aniversário para sócios que fazem aniversário hoje
 */
export async function criarNotificacoesAniversario(torcidaId: string): Promise<number> {
  try {
    const hoje = new Date()
    const diaAtual = hoje.getDate()
    const mesAtual = hoje.getMonth() + 1

    // Buscar sócios ativos que fazem aniversário hoje
    const { data: aniversariantes, error } = await supabaseAdmin
      .from('socios')
      .select('id, nome_completo, data_nascimento')
      .eq('torcida_id', torcidaId)
      .eq('status', 'ativo')

    if (error || !aniversariantes) {
      console.error('Erro ao buscar aniversariantes:', error)
      return 0
    }

    // Filtrar por dia/mês de nascimento
    const aniversariantesHoje = aniversariantes.filter((socio) => {
      if (!socio.data_nascimento) return false
      const nascimento = new Date(socio.data_nascimento)
      return nascimento.getDate() === diaAtual && nascimento.getMonth() + 1 === mesAtual
    })

    let criadas = 0
    for (const socio of aniversariantesHoje) {
      const idade = hoje.getFullYear() - new Date(socio.data_nascimento).getFullYear()

      const notificacao = await criarNotificacao(socio.id, {
        titulo: 'Aniversário de Sócio',
        mensagem: `${socio.nome_completo} completa ${idade} anos hoje!`,
        tipo: 'geral',
        canal: 'sistema',
      })

      if (notificacao) criadas++
    }

    return criadas
  } catch (error) {
    console.error('Exceção ao criar notificações de aniversário:', error)
    return 0
  }
}

/**
 * Cria notificações de vencimento de mensalidade
 */
export async function criarNotificacoesVencimento(
  torcidaId: string,
  diasAntecedencia: number = 5
): Promise<number> {
  try {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + diasAntecedencia)

    // Buscar pagamentos pendentes da torcida que vencem nos próximos dias
    const { data: pagamentos, error } = await supabaseAdmin
      .from('pagamentos')
      .select('id, valor_original, data_vencimento, socio_id')
      .eq('torcida_id', torcidaId)
      .eq('status', 'pendente')
      .lte('data_vencimento', dataLimite.toISOString().split('T')[0])
      .gte('data_vencimento', new Date().toISOString().split('T')[0])

    if (error || !pagamentos) {
      console.error('Erro ao buscar pagamentos:', error)
      return 0
    }

    const pagamentosTorcida = pagamentos

    let criadas = 0
    for (const pagamento of pagamentosTorcida) {
      const notificacao = await criarNotificacao(
        pagamento.socio_id,
        {
          titulo: 'Mensalidade a Vencer',
          mensagem: `Sua mensalidade de R$ ${pagamento.valor_original.toFixed(2)} vence em ${new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR')}`,
          tipo: 'lembrete_pagamento',
          canal: 'sistema',
        }
      )

      if (notificacao) criadas++
    }

    return criadas
  } catch (error) {
    console.error('Exceção ao criar notificações de vencimento:', error)
    return 0
  }
}
