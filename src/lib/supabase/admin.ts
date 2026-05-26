import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase com Service Role
 *
 * IMPORTANTE: Este cliente bypassa Row Level Security (RLS) policies.
 * Use APENAS para operações administrativas privilegiadas como:
 * - Registro de novos usuários
 * - Operações de sistema
 * - Migrações de dados
 *
 * NUNCA exponha este cliente ao client-side ou use em operações regulares.
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
