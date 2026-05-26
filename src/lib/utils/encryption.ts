import CryptoJS from 'crypto-js'

/**
 * Utilitário de criptografia para dados sensíveis
 * Usa AES (criptografia simétrica) para permitir descriptografar quando necessário
 *
 * IMPORTANTE: A chave ENCRYPTION_KEY deve ser configurada nas variáveis de ambiente
 * e NUNCA deve ser commitada no repositório
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  console.warn('[Encryption] ENCRYPTION_KEY não configurada. Usando fallback para desenvolvimento.')
}

const KEY = ENCRYPTION_KEY || 'dev-fallback-key-change-in-production-32chars'

/**
 * Criptografa um texto usando AES
 * @param text - Texto a ser criptografado
 * @returns Texto criptografado em formato base64
 */
export function encrypt(text: string): string {
  if (!text) return ''
  return CryptoJS.AES.encrypt(text, KEY).toString()
}

/**
 * Descriptografa um texto criptografado com AES
 * @param ciphertext - Texto criptografado
 * @returns Texto original descriptografado
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('[Encryption] Erro ao descriptografar:', error)
    return ''
  }
}
