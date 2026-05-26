#!/usr/bin/env tsx

/**
 * Script de Correção - Corrige Dados da Torcida Mock
 *
 * Atualiza status e campos ativo para garantir que a torcida apareça no cadastro.
 * Uso: npm run seed:fix-mock
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

async function fixMockData() {
  console.log('🔧 Corrigindo dados da torcida mock...\n')

  try {
    // Corrigir status da torcida
    console.log('📝 Atualizando torcida para status "ativo"...')
    const { error: torcidaError } = await supabaseAdmin
      .from('torcidas')
      .update({ status: 'ativo' })
      .eq('id', TORCIDA_ID)

    if (torcidaError) {
      console.log(`❌ Erro: ${torcidaError.message}`)
    } else {
      console.log('✅ Torcida atualizada')
    }

    // Corrigir tipos de mensalidade
    console.log('\n📝 Atualizando tipos de mensalidade para ativo...')
    const { error: tiposError } = await supabaseAdmin
      .from('tipos_mensalidade')
      .update({ ativo: true })
      .eq('torcida_id', TORCIDA_ID)

    if (tiposError) {
      console.log(`❌ Erro: ${tiposError.message}`)
    } else {
      console.log('✅ Tipos de mensalidade atualizados')
    }

    console.log('\n✅ Correção concluída!')
    console.log('   Execute: npm run seed:verify para confirmar\n')

  } catch (error) {
    console.error('\n❌ Erro ao corrigir dados:', error)
    process.exit(1)
  }
}

fixMockData()
