/**
 * Schema Zod para validação de funções/cargos da torcida
 */

import { z } from 'zod'

export const funcaoSchema = z.object({
  titulo: z
    .string()
    .min(2, 'Título deve ter pelo menos 2 caracteres')
    .max(100, 'Título muito longo'),

  descricao: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),

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

export const funcaoCreateSchema = funcaoSchema

export const funcaoUpdateSchema = funcaoSchema.partial()

export type FuncaoData = z.infer<typeof funcaoSchema>
export type FuncaoCreateData = z.infer<typeof funcaoCreateSchema>
export type FuncaoUpdateData = z.infer<typeof funcaoUpdateSchema>
