/**
 * Schema Zod para validação das configurações da torcida
 */

import { z } from 'zod'
import { COLOR_PRESET_VALUES } from '@/lib/utils/color-presets'

// ============================================================================
// SCHEMA DE CONFIGURAÇÕES DA TORCIDA
// ============================================================================

export const torcidaConfigSchema = z.object({
  // Identificação
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),

  slug: z
    .string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(50, 'Slug muito longo')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug deve conter apenas letras minúsculas, números e hífens'
    ),

  frase_efeito: z
    .string()
    .max(200, 'Frase de efeito muito longa')
    .optional()
    .or(z.literal('')),

  // Endereço
  endereco_sede: z
    .string()
    .max(255, 'Endereço muito longo')
    .optional()
    .or(z.literal('')),

  // Diretoria
  presidente: z
    .string()
    .max(100, 'Nome muito longo')
    .optional()
    .or(z.literal('')),

  vice_presidente: z
    .string()
    .max(100, 'Nome muito longo')
    .optional()
    .or(z.literal('')),

  // Financeiro
  chave_pix: z
    .string()
    .max(100, 'Chave PIX muito longa')
    .optional()
    .or(z.literal('')),

  dia_vencimento_mensalidade: z
    .number()
    .int('Deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 28')
    .max(28, 'Dia deve ser entre 1 e 28'),

  // Regras de idade
  idade_min_pagamento: z
    .number()
    .int('Deve ser um número inteiro')
    .min(0, 'Idade mínima não pode ser negativa')
    .max(100, 'Idade mínima muito alta'),

  idade_min_compra_ingresso: z
    .number()
    .int('Deve ser um número inteiro')
    .min(0, 'Idade mínima não pode ser negativa')
    .max(100, 'Idade mínima muito alta'),

  // Comunicação
  whatsapp_grupo: z
    .string()
    .url('Link do WhatsApp inválido')
    .optional()
    .or(z.literal('')),

  // Visual - Cores predefinidas
  cor_fundo: z
    .enum(COLOR_PRESET_VALUES, {
      message: 'Selecione uma cor válida',
    }),

  // URL do brasão (gerenciado separadamente via upload)
  brasao_url: z
    .string()
    .url('URL do brasão inválida')
    .optional()
    .or(z.literal(''))
    .or(z.literal(null)),

  // Políticas e Termos
  politica_privacidade: z
    .string()
    .max(10000, 'Texto muito longo (máximo 10.000 caracteres)')
    .optional()
    .or(z.literal('')),

  termos_uso: z
    .string()
    .max(10000, 'Texto muito longo (máximo 10.000 caracteres)')
    .optional()
    .or(z.literal('')),

  termos_compra_ingresso: z
    .string()
    .max(10000, 'Texto muito longo (máximo 10.000 caracteres)')
    .optional()
    .or(z.literal('')),

  // Status da torcida (usado na ativação)
  status: z
    .enum(['pendente', 'ativo', 'suspenso', 'cancelado'])
    .optional(),

  // Quem Somos
  quem_somos: z
    .string()
    .max(3000, 'Texto muito longo (máximo 3.000 caracteres)')
    .optional()
    .or(z.literal('')),

  // Telefone de contato
  telefone: z
    .string()
    .max(20, 'Telefone muito longo')
    .optional()
    .or(z.literal('')),

  // Mensagem de bloqueio customizada
  mensagem_bloqueio: z
    .string()
    .max(500, 'Mensagem muito longa (máximo 500 caracteres)')
    .optional()
    .or(z.literal('')),
})

export type TorcidaConfigData = z.infer<typeof torcidaConfigSchema>

// ============================================================================
// SCHEMA PARA UPDATE PARCIAL
// ============================================================================

export const torcidaUpdateSchema = torcidaConfigSchema.partial()

export type TorcidaUpdateData = z.infer<typeof torcidaUpdateSchema>
