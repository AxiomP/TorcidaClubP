// Dados mockados de pagamentos

export type StatusPagamento =
  | 'pendente'
  | 'comprovante_enviado'
  | 'confirmado'
  | 'recusado'
  | 'perdoado'

export type Pagamento = {
  id: string
  socio_id: string
  socio_nome: string
  socio_whatsapp: string
  referencia_mes: string
  valor_original: number
  data_vencimento: string
  status: StatusPagamento
  comprovante_url?: string
  observacao?: string
  data_pagamento?: string
  motivo_recusa?: string
}

export const pagamentosMock: Pagamento[] = [
  {
    id: '1',
    socio_id: 's1',
    socio_nome: 'João Silva',
    socio_whatsapp: '31999998888',
    referencia_mes: '2025-10-01',
    valor_original: 50.0,
    data_vencimento: '2025-10-10',
    status: 'comprovante_enviado',
    comprovante_url: 'https://placehold.co/600x400/50C878/FFFFFF/png?text=Comprovante+PIX',
    observacao: 'Pago via PIX',
    data_pagamento: '2025-10-05',
  },
  {
    id: '2',
    socio_id: 's2',
    socio_nome: 'Maria Santos',
    socio_whatsapp: '31988887777',
    referencia_mes: '2025-10-01',
    valor_original: 100.0,
    data_vencimento: '2025-10-10',
    status: 'comprovante_enviado',
    comprovante_url: 'https://placehold.co/600x400/FFA500/FFFFFF/png?text=Comprovante+Transferencia',
    observacao: 'Transferência bancária',
    data_pagamento: '2025-10-08',
  },
  {
    id: '3',
    socio_id: 's3',
    socio_nome: 'Pedro Oliveira',
    socio_whatsapp: '31977776666',
    referencia_mes: '2025-10-01',
    valor_original: 50.0,
    data_vencimento: '2025-10-10',
    status: 'confirmado',
    comprovante_url: 'https://placehold.co/600x400/50C878/FFFFFF/png?text=Comprovante+Aprovado',
    data_pagamento: '2025-10-05',
  },
  {
    id: '4',
    socio_id: 's4',
    socio_nome: 'Ana Costa',
    socio_whatsapp: '31966665555',
    referencia_mes: '2025-10-01',
    valor_original: 30.0,
    data_vencimento: '2025-10-10',
    status: 'pendente',
  },
  {
    id: '5',
    socio_id: 's5',
    socio_nome: 'Carlos Souza',
    socio_whatsapp: '31955554444',
    referencia_mes: '2025-10-01',
    valor_original: 50.0,
    data_vencimento: '2025-10-10',
    status: 'recusado',
    comprovante_url: 'https://placehold.co/600x400/FF2400/FFFFFF/png?text=Comprovante+Ilegivel',
    observacao: 'Comprovante enviado',
    motivo_recusa: 'Comprovante ilegível',
  },
  {
    id: '6',
    socio_id: 's6',
    socio_nome: 'Fernanda Lima',
    socio_whatsapp: '31944443333',
    referencia_mes: '2025-09-01',
    valor_original: 100.0,
    data_vencimento: '2025-09-10',
    status: 'comprovante_enviado',
    comprovante_url: 'https://placehold.co/600x400/50C878/FFFFFF/png?text=Comprovante+Setembro',
    data_pagamento: '2025-09-12',
  },
  {
    id: '7',
    socio_id: 's7',
    socio_nome: 'Roberto Alves',
    socio_whatsapp: '31933332222',
    referencia_mes: '2025-10-01',
    valor_original: 50.0,
    data_vencimento: '2025-10-10',
    status: 'comprovante_enviado',
    comprovante_url: 'https://placehold.co/600x400/0047AB/FFFFFF/png?text=Comprovante+TED',
    observacao: 'TED mesmo banco',
    data_pagamento: '2025-10-09',
  },
  {
    id: '8',
    socio_id: 's8',
    socio_nome: 'Juliana Pereira',
    socio_whatsapp: '31922221111',
    referencia_mes: '2025-10-01',
    valor_original: 30.0,
    data_vencimento: '2025-10-10',
    status: 'pendente',
  },
]

// Função helper para filtrar pagamentos
export function filtrarPagamentos(
  pagamentos: Pagamento[],
  filtros?: {
    status?: StatusPagamento
    mes?: string
    busca?: string
  }
): Pagamento[] {
  let resultado = [...pagamentos]

  if (filtros?.status) {
    resultado = resultado.filter((p) => p.status === filtros.status)
  }

  if (filtros?.mes) {
    const mes = filtros.mes
    resultado = resultado.filter((p) => p.referencia_mes.startsWith(mes))
  }

  if (filtros?.busca) {
    const busca = filtros.busca.toLowerCase()
    resultado = resultado.filter((p) =>
      p.socio_nome.toLowerCase().includes(busca)
    )
  }

  return resultado
}

// Função helper para obter estatísticas
export function obterEstatisticasPagamentos(pagamentos: Pagamento[]) {
  const total = pagamentos.length
  const pendentes = pagamentos.filter((p) => p.status === 'pendente').length
  const comprovantes = pagamentos.filter((p) => p.status === 'comprovante_enviado').length
  const confirmados = pagamentos.filter((p) => p.status === 'confirmado').length
  const recusados = pagamentos.filter((p) => p.status === 'recusado').length

  const totalArrecadado = pagamentos
    .filter((p) => p.status === 'confirmado')
    .reduce((acc, p) => acc + p.valor_original, 0)

  const totalPendente = pagamentos
    .filter((p) => p.status === 'pendente' || p.status === 'comprovante_enviado')
    .reduce((acc, p) => acc + p.valor_original, 0)

  return {
    total,
    pendentes,
    comprovantes,
    confirmados,
    recusados,
    totalArrecadado,
    totalPendente,
  }
}
