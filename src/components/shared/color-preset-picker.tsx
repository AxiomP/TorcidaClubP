'use client'

import { cn } from '@/lib/utils'
import { TORCIDA_COLOR_PRESETS, getHexFromPreset, type ColorPresetValue } from '@/lib/utils/color-presets'
import { Check } from 'lucide-react'

interface ColorPresetPickerProps {
  value: string
  onChange: (value: ColorPresetValue) => void
  disabled?: boolean
  className?: string
}

/**
 * Componente para seleção de cor predefinida
 *
 * Exibe swatches de cores clicáveis para seleção visual
 */
export function ColorPresetPicker({
  value,
  onChange,
  disabled = false,
  className,
}: ColorPresetPickerProps) {
  const selectedHex = getHexFromPreset(value)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grid de cores */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {TORCIDA_COLOR_PRESETS.map((preset) => {
          const isSelected = value === preset.value
          const isLight = preset.value === 'branco_neve'

          return (
            <button
              key={preset.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset.value as ColorPresetValue)}
              className={cn(
                'group relative flex flex-col items-center gap-2 p-2 rounded-lg transition-all',
                'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isSelected && 'ring-2 ring-primary ring-offset-2',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title={preset.label}
            >
              {/* Swatch de cor */}
              <div
                className={cn(
                  'w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-transform',
                  'group-hover:scale-110',
                  isLight ? 'border-gray-300' : 'border-transparent',
                  isSelected && 'scale-110'
                )}
                style={{ backgroundColor: preset.hex }}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      'h-6 w-6',
                      isLight ? 'text-gray-800' : 'text-white'
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs text-center leading-tight',
                  isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {preset.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Preview da cor selecionada */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border">
        <div
          className="w-16 h-16 rounded-lg border shadow-sm"
          style={{ backgroundColor: selectedHex }}
        />
        <div>
          <p className="text-sm font-medium">
            {TORCIDA_COLOR_PRESETS.find(c => c.value === value)?.label || 'Selecione uma cor'}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {selectedHex}
          </p>
        </div>
      </div>
    </div>
  )
}
