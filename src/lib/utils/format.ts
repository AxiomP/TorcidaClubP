/**
 * Funções de formatação para exibição de dados
 * RN033, RN034, RN035, RN036: Formatação de CPF, Telefone, Moeda, Data
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formata CPF no padrão XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '')

  if (numeros.length !== 11) {
    return cpf
  }

  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Mascara CPF ocultando dígitos do meio (XXX.XXX.XXX-XX)
 */
export function maskCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '')

  if (numeros.length !== 11) {
    return cpf
  }

  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.XXX-XX')
}

/**
 * Formata telefone no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatTelefone(tel: string): string {
  const numeros = tel.replace(/\D/g, '')

  if (numeros.length === 11) {
    // Celular com 9 dígitos
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (numeros.length === 10) {
    // Telefone fixo ou celular antigo
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return tel
}

/**
 * Formata valor monetário em Real brasileiro
 */
export function formatMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

/**
 * Formata data no formato brasileiro
 */
export function formatData(
  data: Date | string,
  formato: string = 'dd/MM/yyyy'
): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data
  return format(dataObj, formato, { locale: ptBR })
}

/**
 * Formata CEP no padrão XXXXX-XXX
 */
export function formatCEP(cep: string): string {
  const numeros = cep.replace(/\D/g, '')

  if (numeros.length !== 8) {
    return cep
  }

  return numeros.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Remove formatação de string (mantém apenas números)
 */
export function removeFormatacao(texto: string): string {
  return texto.replace(/\D/g, '')
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalize(texto: string): string {
  return texto
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ')
}

// Aliases para compatibilidade
export { formatCPF as formatarCPF }
export { formatData as formatarData }
export { formatTelefone as formatarTelefone }
export { formatMoeda as formatarMoeda }
export { formatCEP as formatarCEP }
