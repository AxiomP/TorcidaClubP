/**
 * Sistema de Cores Predefinidas para Torcidas
 *
 * Define as cores disponíveis para personalização visual das torcidas.
 * Baseado nas especificações do PRD.
 */

export const TORCIDA_COLOR_PRESETS = [
  { value: 'azul_royal', label: 'Azul Royal Puro', hex: '#4169E1' },
  { value: 'vermelho_escarlate', label: 'Vermelho Escarlate', hex: '#FF2400' },
  { value: 'verde_esmeralda', label: 'Verde Esmeralda', hex: '#50C878' },
  { value: 'cinza_grafite', label: 'Cinza Grafite Urbano', hex: '#474747' },
  { value: 'laranja_queimado', label: 'Laranja Queimado', hex: '#CC5500' },
  { value: 'preto_carvao', label: 'Preto Carvão', hex: '#1C1C1C' },
  { value: 'branco_neve', label: 'Branco Neve', hex: '#FFFAFA' },
  { value: 'verde_bandeira', label: 'Verde Bandeira', hex: '#009739' },
  { value: 'vermelho_rubi', label: 'Vermelho Rubi', hex: '#E0115F' },
] as const

// Tipo para os valores de cor
export type ColorPresetValue = typeof TORCIDA_COLOR_PRESETS[number]['value']

// Lista de valores válidos para validação Zod (tuple format)
export const COLOR_PRESET_VALUES = [
  'azul_royal',
  'vermelho_escarlate',
  'verde_esmeralda',
  'cinza_grafite',
  'laranja_queimado',
  'preto_carvao',
  'branco_neve',
  'verde_bandeira',
  'vermelho_rubi',
] as const

/**
 * Obtém o código hex de uma cor pelo seu valor de preset
 */
export function getHexFromPreset(presetValue: string): string {
  const preset = TORCIDA_COLOR_PRESETS.find(c => c.value === presetValue)
  return preset?.hex ?? '#000000'
}

/**
 * Obtém o label (nome amigável) de uma cor pelo seu valor de preset
 */
export function getPresetLabel(presetValue: string): string {
  const preset = TORCIDA_COLOR_PRESETS.find(c => c.value === presetValue)
  return preset?.label ?? 'Cor desconhecida'
}

/**
 * Verifica se um valor é um preset válido
 */
export function isValidColorPreset(value: string): value is ColorPresetValue {
  return TORCIDA_COLOR_PRESETS.some(c => c.value === value)
}

/**
 * Obtém o preset completo pelo valor
 */
export function getPresetByValue(value: string) {
  return TORCIDA_COLOR_PRESETS.find(c => c.value === value)
}
