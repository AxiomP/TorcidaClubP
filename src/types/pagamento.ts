/**
 * Types para Sistema de Pagamentos - Fase 4
 */

export type PagamentoStatus =
  | 'pendente'
  | 'comprovante_enviado'
  | 'confirmado'
  | 'recusado'
  | 'perdoado'

export type SocioStatus = 'ativo' | 'inadimplente' | 'bloqueado' | 'pendente' | 'inativo'

export interface Pagamento {
  id: string
  socio_id: string
  torcida_id: string
  tipo_mensalidade_id: string
  referencia_mes: string
  valor_original: number
  valor_perdoado: number
  data_vencimento: string
  data_pagamento: string | null
  data_confirmacao: string | null
  status: PagamentoStatus
  comprovante_url: string | null
  confirmado_por: string | null
  observacao?: string | null
  motivo_recusa?: string | null
  lembrete_7_dias_enviado: boolean
  lembrete_3_dias_enviado: boolean
  lembrete_dia_enviado: boolean
  created_at: string
  updated_at: string
  // Relations
  socios?: {
    id: string
    nome_completo: string
    apelido: string | null
    cpf: string
    whatsapp: string | null
    email?: string | null
    meses_pendentes?: number | null
    data_nascimento?: string | null
    torcidas?: {
      idade_min_pagamento?: number | null
    } | null
  } | null
  tipos_mensalidade?: {
    nome: string
    valor: number
  }
}

export interface PagamentoListResponse {
  pagamentos: Pagamento[]
  total: number
  limit: number
  offset: number
}

export interface TipoMensalidade {
  id: string
  torcida_id: string
  nome: string
  valor: number
  permite_dependentes: boolean
  qtd_max_dependentes: number | null
  permite_ingressos_adicionais: boolean
  qtd_max_ingressos_adicionais: number | null
  beneficios: string[]
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface PagamentoFilters {
  torcida_id?: string
  socio_id?: string
  status?: PagamentoStatus
  mes?: string
  limit?: number
  offset?: number
}

export interface PagamentosStats {
  totalArrecadado: number
  totalPendente: number
  totalAtrasado: number
  qtdPagamentosConfirmados: number
  qtdPagamentosPendentes: number
  qtdSociosInadimplentes: number
  percentualAdimplencia: number
}

export interface UploadComprovanteData {
  comprovante_url: string
  observacao?: string
}

export interface RecusarPagamentoData {
  motivo: string
}
