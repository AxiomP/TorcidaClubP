#!/usr/bin/env tsx

/**
 * Script de Verificação - Diagnóstico da Torcida Mock
 *
 * Verifica se os dados da torcida mock estão corretos e acessíveis.
 * Uso: npm run seed:verify
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
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

async function verifyMockData() {
  console.log('🔍 Verificando dados da torcida mock no Supabase...\n')

  let hasIssues = false

  // ========================================
  // 1. VERIFICAR TORCIDA
  // ========================================
  console.log('📋 Verificando torcida...')

  const { data: torcida, error: torcidaError } = await supabaseAdmin
    .from('torcidas')
    .select('id, nome, slug, status')
    .eq('id', TORCIDA_ID)
    .single()

  if (torcidaError || !torcida) {
    console.log('❌ ERRO: Torcida não encontrada!')
    console.log('   Torcida mock não existe no banco.')
    console.log('   Execute: npm run seed:mock\n')
    return
  }

  console.log(`✅ Torcida encontrada: ${torcida.nome}`)
  console.log(`   ID: ${torcida.id}`)
  console.log(`   Slug: ${torcida.slug}`)
  console.log(`   Status: ${torcida.status}`)

  if (torcida.status !== 'ativo') {
    console.log(`   ⚠️  PROBLEMA: Status deveria ser "ativo", mas é "${torcida.status}"`)
    hasIssues = true
  }

  // ========================================
  // 2. VERIFICAR TIPOS DE MENSALIDADE
  // ========================================
  console.log('\n📋 Verificando tipos de mensalidade...')

  const { data: todosTipos, error: todosError } = await supabaseAdmin
    .from('tipos_mensalidade')
    .select('id, nome, valor, ativo, ordem, torcida_id')
    .eq('torcida_id', TORCIDA_ID)
    .order('ordem')

  if (todosError || !todosTipos || todosTipos.length === 0) {
    console.log('❌ ERRO: Nenhum tipo de mensalidade encontrado!')
    console.log('   A torcida não tem tipos de mensalidade cadastrados.')
    console.log('   Execute: npm run seed:mock\n')
    return
  }

  console.log(`✅ ${todosTipos.length} tipo(s) encontrado(s):`)

  todosTipos.forEach((tipo) => {
    const ativoIcon = tipo.ativo ? '✅' : '❌'
    console.log(`   ${ativoIcon} ${tipo.nome}`)
    console.log(`      Valor: R$ ${tipo.valor}`)
    console.log(`      Ativo: ${tipo.ativo}`)
    console.log(`      Ordem: ${tipo.ordem}`)

    if (!tipo.ativo) {
      console.log(`      ⚠️  PROBLEMA: Tipo deveria estar ativo!`)
      hasIssues = true
    }

    if (tipo.torcida_id !== TORCIDA_ID) {
      console.log(`      ⚠️  PROBLEMA: torcida_id incorreto (${tipo.torcida_id})`)
      hasIssues = true
    }
  })

  // ========================================
  // 3. SIMULAR QUERY DA API
  // ========================================
  console.log('\n📋 Simulando query da API /api/tipos-mensalidade...')

  const { data: tiposAtivos, error: ativosError } = await supabaseAdmin
    .from('tipos_mensalidade')
    .select('id, nome, valor')
    .eq('torcida_id', TORCIDA_ID)
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (ativosError) {
    console.log(`❌ ERRO na query: ${ativosError.message}`)
    hasIssues = true
  } else if (!tiposAtivos || tiposAtivos.length === 0) {
    console.log('❌ PROBLEMA: Query não retorna tipos ativos!')
    console.log('   A API não encontrará tipos para exibir no cadastro.')
    hasIssues = true
  } else {
    console.log(`✅ Query retorna ${tiposAtivos.length} tipo(s) ativo(s):`)
    tiposAtivos.forEach((tipo) => {
      console.log(`   - ${tipo.nome}: R$ ${tipo.valor}`)
    })
  }

  // ========================================
  // 4. VERIFICAR RLS (Row Level Security)
  // ========================================
  console.log('\n📋 Verificando RLS com anon key...')

  const supabaseAnon = createClient<Database>(SUPABASE_URL, ANON_KEY)

  const { data: torcidaAnon, error: torcidaAnonError } = await supabaseAnon
    .from('torcidas')
    .select('id, nome, status')
    .eq('id', TORCIDA_ID)
    .eq('status', 'ativo')
    .single()

  if (torcidaAnonError || !torcidaAnon) {
    console.log('❌ PROBLEMA: Torcida não acessível via anon key!')
    console.log(`   Erro: ${torcidaAnonError?.message}`)
    console.log('   Verifique políticas RLS na tabela "torcidas"')
    hasIssues = true
  } else {
    console.log('✅ Torcida acessível via anon key')
  }

  const { data: tiposAnon, error: tiposAnonError } = await supabaseAnon
    .from('tipos_mensalidade')
    .select('id, nome, valor')
    .eq('torcida_id', TORCIDA_ID)
    .eq('ativo', true)

  if (tiposAnonError || !tiposAnon || tiposAnon.length === 0) {
    console.log('❌ PROBLEMA: Tipos não acessíveis via anon key!')
    console.log(`   Erro: ${tiposAnonError?.message}`)
    console.log('   Verifique políticas RLS na tabela "tipos_mensalidade"')
    hasIssues = true
  } else {
    console.log(`✅ Tipos acessíveis via anon key (${tiposAnon.length} encontrados)`)
  }

  // ========================================
  // 5. RESULTADO FINAL
  // ========================================
  console.log('\n' + '='.repeat(60))

  if (hasIssues) {
    console.log('❌ DIAGNÓSTICO: Problemas encontrados!')
    console.log('\n💡 Soluções:')
    console.log('   1. Execute: npm run seed:fix-mock')
    console.log('   2. Ou corrija manualmente no Supabase Dashboard')
    console.log('   3. Verifique políticas RLS se necessário\n')
    process.exit(1)
  } else {
    console.log('✅ DIAGNÓSTICO: Todos os dados estão corretos!')
    console.log('\n🎉 A torcida mock está configurada corretamente.')
    console.log('   Deveria funcionar no cadastro.')
    console.log('\n💡 Se ainda não funciona:')
    console.log('   1. Verifique o console do navegador (F12)')
    console.log('   2. Veja se há erros na requisição para /api/tipos-mensalidade')
    console.log('   3. Confirme que selecionou a torcida "Torcida Mocka FC" primeiro\n')
  }
}

verifyMockData()
