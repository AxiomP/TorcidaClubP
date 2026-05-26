/**
 * Currency formatting utilities
 */

/**
 * Format number to Brazilian currency (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Format number to currency without symbol
 */
export function formatCurrencyWithoutSymbol(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')

  return parseFloat(cleaned) || 0
}

/**
 * Format input as currency while typing
 */
export function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  const amount = parseFloat(numbers) / 100
  return formatCurrencyWithoutSymbol(amount)
}
