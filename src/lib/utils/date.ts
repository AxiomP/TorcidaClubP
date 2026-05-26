import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Date formatting utilities
 */

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return 'Data inválida'
  }

  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR })
}

/**
 * Format date with time (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return 'Data inválida'
  }

  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/**
 * Format month reference (YYYY-MM-DD) to readable format (Mês/Ano)
 */
export function formatMonthReference(date: string): string {
  const dateObj = parseISO(date)

  if (!isValid(dateObj)) {
    return 'Mês inválido'
  }

  return format(dateObj, 'MMMM/yyyy', { locale: ptBR })
}

/**
 * Format month reference to short format (MM/YYYY)
 */
export function formatMonthReferenceShort(date: string): string {
  const dateObj = parseISO(date)

  if (!isValid(dateObj)) {
    return 'Mês inválido'
  }

  return format(dateObj, 'MM/yyyy', { locale: ptBR })
}

/**
 * Format relative time (ex: "há 2 dias", "há 3 horas")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return 'Data inválida'
  }

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: ptBR,
  })
}

/**
 * Get current month reference (YYYY-MM-DD)
 */
export function getCurrentMonthReference(): string {
  const now = new Date()
  return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
}

/**
 * Parse month filter (MM/YYYY or YYYY-MM) to API format (YYYY-MM)
 */
export function parseMonthFilter(month: string): string {
  // If already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(month)) {
    return month
  }

  // If in MM/YYYY format
  if (/^\d{2}\/\d{4}$/.test(month)) {
    const [mm, yyyy] = month.split('/')
    return `${yyyy}-${mm}`
  }

  return month
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const today = new Date()

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj < new Date()
}

/**
 * Get months list for filter dropdown
 */
export function getMonthsList(count: number = 12): Array<{ value: string; label: string }> {
  const months: Array<{ value: string; label: string }> = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM/yyyy', { locale: ptBR }),
    })
  }

  return months
}
