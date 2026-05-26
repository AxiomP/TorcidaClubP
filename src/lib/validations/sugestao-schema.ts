/**
 * Schema Zod para validação de sugestões/feedback da plataforma
 */

import { z } from 'zod'

export const TIPOS_SUGESTAO = ['melhoria', 'bug', 'duvida', 'outro'] as const

export const sugestaoSchema = z.object({
  tipo: z.enum(TIPOS_SUGESTAO, {
    message: 'Selecione um tipo válido',
  }),

  titulo: z
    .string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título muito longo'),

  descricao: z
    .string()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(2000, 'Descrição muito longa'),
})

export const sugestaoCreateSchema = sugestaoSchema

export type SugestaoData = z.infer<typeof sugestaoSchema>
export type SugestaoCreateData = z.infer<typeof sugestaoCreateSchema>
export type TipoSugestao = typeof TIPOS_SUGESTAO[number]

// Labels para exibição na UI
export const TIPOS_SUGESTAO_LABELS: Record<TipoSugestao, string> = {
  melhoria: 'Sugestão de Melhoria',
  bug: 'Reportar Problema',
  duvida: 'Dúvida',
  outro: 'Outro',
}
