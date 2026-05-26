/**
 * Cliente Supabase alternativo para fluxo de recuperação de senha
 * Usa implicit flow ao invés de PKCE para evitar problemas cross-device
 * 
 * Nota: Implicit flow é menos seguro. Use apenas se PKCE falhar após verificar
 * as URLs de redirecionamento no Supabase Dashboard.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let recoveryClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Cria um cliente Supabase com implicit flow para compatibilidade cross-device
 * em links de recuperação de senha
 */
export function createRecoveryClient() {
  if (recoveryClient) return recoveryClient

  recoveryClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit', // Menos seguro, mas funciona cross-device
        autoRefreshToken: false, // Desabilitar refresh automático para implicit
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: 'torcida-club-recovery-token',
      },
    }
  )

  return recoveryClient
}
