#!/usr/bin/env tsx

/**
 * Script de Limpeza - Remove Torcida Mock
 *
 * Remove a torcida mock e dados relacionados.
 * Uso: npm run seed:clean-mock
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabaseAdmin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const TORCIDA_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

async function cleanMockTorcida() {
  console.log('🧹 Removendo torcida mock...\n')

  try {
    // 1. Remover tipos de mensalidade (foreign key)
    console.log('🗑️  Removendo tipos de mensalidade...')
    const { error: mensalidadesError } = await supabaseAdmin
      .from('tipos_mensalidade')
      .delete()
      .eq('torcida_id', TORCIDA_ID)

    if (mensalidadesError) {
      throw new Error(`Erro ao remover mensalidades: ${mensalidadesError.message}`)
    }
    console.log('✅ Mensalidades removidas')

    // 2. Remover torcida
    console.log('🗑️  Removendo torcida...')
    const { error: torcidaError } = await supabaseAdmin
      .from('torcidas')
      .delete()
      .eq('id', TORCIDA_ID)

    if (torcidaError) {
      throw new Error(`Erro ao remover torcida: ${torcidaError.message}`)
    }
    console.log('✅ Torcida removida')

    console.log('\n✅ Limpeza concluída com sucesso!')
    console.log('   A torcida mock foi removida do banco de dados.\n')

  } catch (error) {
    console.error('\n❌ Erro ao limpar dados:', error)
    process.exit(1)
  }
}

cleanMockTorcida()
