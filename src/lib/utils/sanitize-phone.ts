/**
 * Sanitização centralizada de telefone
 * Regra de Ouro: nunca propagar UUID/LID como telefone
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function sanitizePhone(value: string | null | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()

  // Rejeitar UUIDs/LIDs
  if (UUID_PATTERN.test(trimmed)) {
    console.warn('[sanitizePhone] UUID detectado como telefone:', trimmed.slice(0, 8) + '...')
    return null
  }

  // Rejeitar se contém letras (possível LID ou dado corrompido)
  if (/[a-zA-Z]/.test(trimmed)) {
    console.warn('[sanitizePhone] Valor contém letras:', trimmed.slice(0, 10) + '...')
    return null
  }

  // Extrair apenas dígitos
  const digits = trimmed.replace(/\D/g, '')

  // Remover código do país se presente
  const cleaned = digits.startsWith('55') && digits.length > 11
    ? digits.slice(2)
    : digits

  // Validar formato brasileiro (10-11 dígitos)
  if (cleaned.length < 10 || cleaned.length > 11) return null

  return cleaned
}
