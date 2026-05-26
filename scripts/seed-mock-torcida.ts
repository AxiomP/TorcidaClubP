#!/usr/bin/env tsx

/**
 * Script de Seed - Torcida Mock para Testes
 *
 * Insere uma torcida fictícia completa no Supabase para testes.
 * Usa admin client para bypass de RLS.
 *
 * Uso: npm run seed:mock
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

// Carregar variáveis de ambiente do .env.local
config({ path: resolve(__dirname, '../.env.local') })

// Validar variáveis obrigatórias
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('   Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

// Criar cliente admin (bypassa RLS)
const supabaseAdmin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// UUIDs fixos para referência
const TORCIDA_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const MENSALIDADE_PLENO_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
const MENSALIDADE_TORCEDOR_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012'

async function seedMockTorcida() {
  console.log('🌱 Iniciando seed de torcida mock...\n')

  try {
    // ========================================
    // 1. VERIFICAR SE JÁ EXISTE
    // ========================================
    console.log('🔍 Verificando se torcida já existe...')

    const { data: existingTorcida } = await supabaseAdmin
      .from('torcidas')
      .select('id, nome, slug')
      .eq('id', TORCIDA_ID)
      .single()

    if (existingTorcida) {
      console.log('⚠️  Torcida já existe:', existingTorcida.nome)
      console.log('   Use o script de limpeza antes de re-executar.\n')
      return
    }

    // ========================================
    // 2. INSERIR TORCIDA
    // ========================================
    console.log('➕ Inserindo torcida mock...')

    const { data: torcida, error: torcidaError } = await supabaseAdmin
      .from('torcidas')
      .insert({
        id: TORCIDA_ID,
        nome: 'Torcida Mocka FC',
        slug: 'torcida-mocka-fc',
        endereco_sede: 'Rua das Palmeiras, 456 - Recife/PE, Brasil',
        presidente: 'Carlos Eduardo Silva',
        vice_presidente: 'Ana Paula Oliveira',
        brasao_url: null,
        cor_fundo: 'azul_royal',
        frase_efeito: 'Unidos pela paixão, juntos na vitória!',
        chave_pix: '12345678000199',
        dia_vencimento_mensalidade: 10,
        idade_min_pagamento: 16,
        idade_min_compra_ingresso: 12,
        whatsapp_grupo: 'https://chat.whatsapp.com/mocka-fc-grupo',
        politica_privacidade: 'Esta é uma torcida de testes. Política de privacidade mock.',
        termos_uso: 'Termos de uso mock para testes do sistema TorcidaClub.',
        status: 'ativo', // CRÍTICO para aparecer no cadastro
        plano: 'basico',
      })
      .select()
      .single()

    if (torcidaError) {
      throw new Error(`Erro ao inserir torcida: ${torcidaError.message}`)
    }

    console.log('✅ Torcida criada:', torcida?.nome)
    console.log('   ID:', torcida?.id)
    console.log('   Slug:', torcida?.slug)
    console.log('   Status:', torcida?.status)

    // ========================================
    // 3. INSERIR TIPOS DE MENSALIDADE
    // ========================================
    console.log('\n➕ Inserindo tipos de mensalidade...')

    const { data: mensalidades, error: mensalidadesError } = await supabaseAdmin
      .from('tipos_mensalidade')
      .insert([
        // Plano 1: Sócio Pleno
        {
          id: MENSALIDADE_PLENO_ID,
          torcida_id: TORCIDA_ID,
          nome: 'Sócio Pleno',
          valor: 50.0,
          permite_dependentes: true,
          qtd_max_dependentes: 5,
          permite_ingressos_adicionais: true,
          qtd_max_ingressos_adicionais: 2,
          beneficios: [
            'Acesso a todos os eventos da torcida',
            'Prioridade na compra de ingressos',
            'Desconto de 10% em produtos oficiais',
            'Participação em sorteios exclusivos',
          ],
          ativo: true,
          ordem: 1,
        },
        // Plano 2: Sócio Torcedor
        {
          id: MENSALIDADE_TORCEDOR_ID,
          torcida_id: TORCIDA_ID,
          nome: 'Sócio Torcedor',
          valor: 25.0,
          permite_dependentes: true,
          qtd_max_dependentes: 2,
          permite_ingressos_adicionais: false,
          qtd_max_ingressos_adicionais: 0,
          beneficios: [
            'Acesso a eventos online',
            'Desconto de 5% em produtos oficiais',
            'Participação em sorteios',
          ],
          ativo: true,
          ordem: 2,
        },
      ])
      .select()

    if (mensalidadesError) {
      throw new Error(`Erro ao inserir mensalidades: ${mensalidadesError.message}`)
    }

    console.log(`✅ ${mensalidades?.length} tipos de mensalidade criados:`)
    mensalidades?.forEach((m) => {
      console.log(`   - ${m.nome}: R$ ${m.valor}/mês`)
    })

    // ========================================
    // 4. VERIFICAÇÃO FINAL
    // ========================================
    console.log('\n✅ Seed concluído com sucesso!\n')
    console.log('📋 Resumo:')
    console.log('   Torcida: Torcida Mocka FC')
    console.log('   Slug: torcida-mocka-fc')
    console.log('   Status: ativo ✅')
    console.log('   Mensalidades: 2 planos ativos')
    console.log('\n🧪 Como testar:')
    console.log('   1. Acesse: http://localhost:3000/cadastro')
    console.log('   2. Busque por "Mocka"')
    console.log('   3. Selecione "Torcida Mocka FC"')
    console.log('\n🧹 Para limpar depois:')
    console.log('   npm run seed:clean-mock')

  } catch (error) {
    console.error('\n❌ Erro ao executar seed:', error)
    process.exit(1)
  }
}

// Executar seed
seedMockTorcida()
