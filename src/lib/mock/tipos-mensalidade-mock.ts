// Dados mockados de tipos de mensalidade

export type TipoMensalidade = {
  id: string
  nome: string
  valor: number
  permite_dependentes: boolean
  qtd_max_dependentes: number | null
  permite_ingressos_adicionais: boolean
  qtd_max_ingressos_adicionais: number | null
  beneficios: string[]
  ordem: number
  ativo: boolean
}

export const tiposMensalidadeMock: TipoMensalidade[] = [
  {
    id: '1',
    nome: 'Sócio Titular',
    valor: 50.0,
    permite_dependentes: true,
    qtd_max_dependentes: null,
    permite_ingressos_adicionais: false,
    qtd_max_ingressos_adicionais: null,
    beneficios: ['Ingresso prioritário', 'Desconto em produtos'],
    ordem: 1,
    ativo: true,
  },
  {
    id: '2',
    nome: 'Sócio Premium',
    valor: 100.0,
    permite_dependentes: true,
    qtd_max_dependentes: 5,
    permite_ingressos_adicionais: true,
    qtd_max_ingressos_adicionais: 10,
    beneficios: [
      'Ingresso prioritário',
      'Desconto em produtos',
      'Acesso a eventos exclusivos',
      'Sorteios mensais',
    ],
    ordem: 2,
    ativo: true,
  },
  {
    id: '3',
    nome: 'Sócio Contribuinte',
    valor: 30.0,
    permite_dependentes: false,
    qtd_max_dependentes: null,
    permite_ingressos_adicionais: false,
    qtd_max_ingressos_adicionais: null,
    beneficios: ['Desconto em produtos'],
    ordem: 3,
    ativo: true,
  },
]
