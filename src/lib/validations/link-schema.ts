/**
 * Schema Zod para validação de links externos da torcida
 */

import { z } from 'zod'

export const linkSchema = z.object({
  titulo: z
    .string()
    .min(2, 'Título deve ter pelo menos 2 caracteres')
    .max(100, 'Título muito longo'),

  url: z
    .string()
    .url('URL inválida')
    .max(500, 'URL muito longa'),

  icone: z
    .string()
    .max(50, 'Nome do ícone muito longo')
    .optional()
    .or(z.literal('')),

  ordem: z
    .number()
    .int('Ordem deve ser um número inteiro')
    .min(0, 'Ordem não pode ser negativa'),

  ativo: z
    .boolean(),
})

export const linkCreateSchema = linkSchema

export const linkUpdateSchema = linkSchema.partial()

export type LinkData = z.infer<typeof linkSchema>
export type LinkCreateData = z.infer<typeof linkCreateSchema>
export type LinkUpdateData = z.infer<typeof linkUpdateSchema>
