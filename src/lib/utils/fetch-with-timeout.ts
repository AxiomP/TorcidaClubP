/**
 * Wrapper para fetch com timeout usando AbortController
 *
 * Baseado no padrão implementado em dashboard e configurações.
 * Previne race conditions ao cancelar o timeout ANTES de retornar a response.
 *
 * @param url - URL da requisição
 * @param options - Opções do fetch (exceto signal, que é gerenciado internamente)
 * @param timeoutMs - Timeout em milissegundos (padrão: 20000ms = 20s)
 * @returns Promise com a Response
 * @throws AbortError se timeout for atingido
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithTimeout('/api/data', { method: 'POST' }, 10000)
 *   const data = await response.json()
 * } catch (err: any) {
 *   if (err.name === 'AbortError') {
 *     console.error('Timeout atingido')
 *   }
 * }
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 20000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    // ✅ CRÍTICO: Cancelar timeout ANTES de retornar
    // Isso previne race conditions durante JSON parsing
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Helper para fetch + JSON parsing com timeout
 *
 * Simplifica o padrão fetch + json() com verificação de status.
 *
 * @param url - URL da requisição
 * @param options - Opções do fetch
 * @param timeoutMs - Timeout em milissegundos (padrão: 20000ms = 20s)
 * @returns Promise com dados JSON parseados
 * @throws Error se response.ok for false ou timeout for atingido
 *
 * @example
 * ```typescript
 * const data = await fetchJson<MyType>('/api/users', {}, 10000)
 * ```
 */
export async function fetchJson<T = unknown>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 20000
): Promise<T> {
  const response = await fetchWithTimeout(url, options, timeoutMs)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}
