'use client'

import { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ColorPresetPicker } from '@/components/shared/color-preset-picker'
import { TorcidaConfigData } from '@/lib/validations/torcida-schema'
import { ColorPresetValue } from '@/lib/utils/color-presets'
import { FieldErrors, UseFormSetValue } from 'react-hook-form'
import Image from 'next/image'
import { Image as ImageIcon, Palette, Upload, Save } from 'lucide-react'

interface TabVisualProps {
  brasaoPreview: string | null
  uploadingBrasao: boolean
  onBrasaoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  corFundo: ColorPresetValue
  setValue: UseFormSetValue<TorcidaConfigData>
  errors: FieldErrors<TorcidaConfigData>
  saving: boolean
  onSave: () => void
}

export function TabVisual({
  brasaoPreview,
  uploadingBrasao,
  onBrasaoUpload,
  corFundo,
  setValue,
  errors,
  saving,
  onSave,
}: TabVisualProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6">
      {/* Brasão */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Brasão</h2>
            <p className="text-sm text-muted-foreground">Imagem do brasão da torcida</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {brasaoPreview ? (
            <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
              <Image
                src={brasaoPreview}
                alt="Brasão da torcida"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={onBrasaoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingBrasao}
            >
              {uploadingBrasao ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {brasaoPreview ? 'Trocar Brasão' : 'Enviar Brasão'}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG, WebP ou SVG. Máximo 5MB.
            </p>
          </div>
        </div>
      </Card>

      {/* Cores */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Palette className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Tema de Cores</h2>
            <p className="text-sm text-muted-foreground">Personalização visual da torcida</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Selecione a cor principal que será usada na página da sua torcida
          </p>
          <ColorPresetPicker
            value={corFundo}
            onChange={(value) => setValue('cor_fundo', value)}
            disabled={saving}
          />
          {errors.cor_fundo && (
            <p className="text-sm text-red-400">{errors.cor_fundo.message}</p>
          )}
        </div>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Visual
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
