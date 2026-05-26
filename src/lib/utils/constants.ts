/**
 * Constantes globais do sistema
 */

// Estados brasileiros
export const ESTADOS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const

// Gêneros
export const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
] as const

// Escolaridade
export const ESCOLARIDADES = [
  { value: 'fundamental_incompleto', label: 'Fundamental Incompleto' },
  { value: 'fundamental_completo', label: 'Fundamental Completo' },
  { value: 'medio_incompleto', label: 'Médio Incompleto' },
  { value: 'medio_completo', label: 'Médio Completo' },
  { value: 'superior_incompleto', label: 'Superior Incompleto' },
  { value: 'superior_completo', label: 'Superior Completo' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
] as const

// Status do sócio
export const STATUS_SOCIO = {
  PENDENTE: 'pendente',
  ATIVO_SEM_PAGAMENTO: 'ativo_sem_pagamento',
  ATIVO: 'ativo',
  INADIMPLENTE: 'inadimplente',
  BLOQUEADO: 'bloqueado',
  INATIVO: 'inativo',
} as const

// Status de pagamento
export const STATUS_PAGAMENTO = {
  PENDENTE: 'pendente',
  COMPROVANTE_ENVIADO: 'comprovante_enviado',
  CONFIRMADO: 'confirmado',
  RECUSADO: 'recusado',
  PERDOADO: 'perdoado',
  CANCELADO: 'cancelado',
} as const

// Limites de upload
export const LIMITES_UPLOAD = {
  IMAGEM: {
    TIPOS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    TAMANHO_MAX: 5 * 1024 * 1024, // 5MB
    TAMANHO_MAX_LABEL: '5MB',
  },
  PDF: {
    TIPOS: ['application/pdf'],
    TAMANHO_MAX: 10 * 1024 * 1024, // 10MB
    TAMANHO_MAX_LABEL: '10MB',
  },
} as const

// Buckets do Supabase Storage
export const STORAGE_BUCKETS = {
  DOCUMENTOS_IDENTIDADE: 'documentos-identidade',
  COMPROVANTES_ENDERECO: 'comprovantes-endereco',
  COMPROVANTES_PAGAMENTO: 'comprovantes-pagamento',
  SELFIES: 'selfies',
  ASSINATURAS: 'assinaturas',
  TERMOS_MENORIDADE: 'termos-menoridade',
  BRASOES: 'brasoes',
} as const

// Mensagens de erro
export const MENSAGENS_ERRO = {
  CPF_INVALIDO: 'CPF inválido. Verifique os números digitados.',
  CPF_DUPLICADO: 'Este CPF já está cadastrado no sistema.',
  CPF_BLOQUEADO: 'CPF bloqueado. Entre em contato com o gestor da torcida.',
  EMAIL_DUPLICADO: 'Este email já está cadastrado.',
  ARQUIVO_GRANDE: (tamanho: string) => `Arquivo muito grande. Tamanho máximo: ${tamanho}`,
  ARQUIVO_TIPO_INVALIDO: (tipos: string) => `Tipo de arquivo inválido. Aceitos: ${tipos}`,
  MENOR_SEM_TERMO: 'Menores de 18 anos precisam do termo de menoridade assinado.',
  CAMPOS_OBRIGATORIOS: 'Preencha todos os campos obrigatórios.',
  ERRO_GENERICO: 'Ocorreu um erro. Tente novamente.',
} as const

// Tipos de documento
export const TIPOS_DOCUMENTO = [
  { value: 'rg', label: 'RG' },
  { value: 'cnh', label: 'CNH' },
  { value: 'cni', label: 'CNI (Carteira de Identidade Nacional)' },
  { value: 'passaporte', label: 'Passaporte' },
] as const

// Documentos que requerem frente e verso
export const DOCUMENTOS_FRENTE_VERSO = ['rg', 'cnh', 'cni'] as const

// Estados civis
export const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
] as const

// Tipos de comprovante de endereço
export const TIPOS_COMPROVANTE = [
  { value: 'conta_luz', label: 'Conta de Luz' },
  { value: 'conta_agua', label: 'Conta de Água' },
  { value: 'conta_telefone', label: 'Conta de Telefone' },
  { value: 'extrato_bancario', label: 'Extrato Bancário' },
  { value: 'contrato_aluguel', label: 'Contrato de Aluguel' },
] as const

// Regex patterns
export const PATTERNS = {
  CPF: /^\d{11}$/,
  TELEFONE: /^\d{10,11}$/,
  CEP: /^\d{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const
