/**
 * Schema Zod para criação de nova torcida
 *
 * Baseado no schema de configuração, mas com campos obrigatórios específicos
 * para o processo de criação.
 */

import { z } from 'zod'
import { COLOR_PRESET_VALUES } from '@/lib/utils/color-presets'

// ============================================================================
// SCHEMA DE CRIAÇÃO DA TORCIDA
// ============================================================================

export const torcidaCreateSchema = z.object({
  // Identificação - Obrigatórios
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

  // Identificação - Opcionais
  frase_efeito: z
    .string()
    .max(200, 'Frase de efeito muito longa')
    .optional()
    .or(z.literal('')),

  endereco_sede: z
    .string()
    .max(255, 'Endereço muito longo')
    .optional()
    .or(z.literal('')),

  // Diretoria - Opcionais
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

  // Financeiro - Opcionais com defaults
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

  // Comunicação - Opcional
  whatsapp_grupo: z
    .string()
    .url('Link do WhatsApp inválido')
    .optional()
    .or(z.literal('')),

  // Visual - Cor predefinida
  cor_fundo: z
    .enum(COLOR_PRESET_VALUES, {
      message: 'Selecione uma cor válida',
    }),
})

export type TorcidaCreateData = z.infer<typeof torcidaCreateSchema>
