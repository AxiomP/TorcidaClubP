/**
 * Schema Zod para validação de benefícios da torcida
 */

import { z } from 'zod'

export const beneficioSchema = z.object({
  titulo: z
    .string()
    .min(2, 'Título deve ter pelo menos 2 caracteres')
    .max(255, 'Título muito longo'),

  descricao: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'Descrição muito longa'),

  icone: z
    .string()
    .max(100, 'Nome do ícone muito longo')
    .optional()
    .or(z.literal('')),

  ordem: z
    .number()
    .int('Ordem deve ser um número inteiro')
    .min(0, 'Ordem não pode ser negativa'),

  ativo: z
    .boolean(),
})

export const beneficioCreateSchema = beneficioSchema

export const beneficioUpdateSchema = beneficioSchema.partial()

export type BeneficioData = z.infer<typeof beneficioSchema>
export type BeneficioCreateData = z.infer<typeof beneficioCreateSchema>
export type BeneficioUpdateData = z.infer<typeof beneficioUpdateSchema>
