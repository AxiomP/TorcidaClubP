'use client'

/**
 * Componente canvas para assinatura digital
 * RN001-RN004: Cadastro de sócios requer assinatura
 */

import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Eraser, Save, AlertCircle } from 'lucide-react'

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  valor?: string
  disabled?: boolean
  label?: string
  className?: string
}

export function SignatureCanvasPad({
  onSave,
  valor,
  disabled = false,
  label = 'Assinatura Digital',
  className = '',
}: SignatureCanvasProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [saved, setSaved] = useState(!!valor)
  const [previewUrl, setPreviewUrl] = useState<string | null>(valor || null)

  useEffect(() => {
    // Se já tem valor, mostrar no canvas
    if (valor && sigCanvas.current) {
      try {
        sigCanvas.current.fromDataURL(valor)
        setIsEmpty(false)
        setSaved(true)
      } catch (error) {
        console.error('Erro ao carregar assinatura:', error)
      }
    }
  }, [valor])

  const clear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
    setSaved(false)
    setPreviewUrl(null)
  }

  const save = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Por favor, desenhe sua assinatura')
      return
    }

    const dataUrl = sigCanvas.current?.toDataURL('image/png')
    if (dataUrl) {
      setPreviewUrl(dataUrl)
      setSaved(true)

      try {
        // Converter data URL para blob
        const response = await fetch(dataUrl)
        const blob = await response.blob()

        // Criar FormData
        const formData = new FormData()
        formData.append('file', blob, 'assinatura.png')
        formData.append('bucket', 'assinaturas')

        // Upload para API
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Erro ao fazer upload')
        }

        const data = await uploadResponse.json()
        onSave(data.url)
      } catch (error) {
        console.error('Erro ao salvar assinatura:', error)
        alert('Erro ao salvar assinatura. Tente novamente.')
      }
    }
  }

  const edit = () => {
    setSaved(false)
    setPreviewUrl(null)
  }

  if (saved && previewUrl) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium">{label}</label>
        <div className="border-2 border-green-300 bg-green-50 dark:bg-green-950 rounded-lg p-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Assinatura"
              className="h-20 bg-white border rounded"
            />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                ✓ Assinatura salva
              </span>
              {!disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={edit}
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{label}</label>

      <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
        <div className={`relative ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              className: 'w-full h-48 cursor-crosshair touch-none',
              style: { touchAction: 'none' },
            }}
            onEnd={() => setIsEmpty(false)}
          />

          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Desenhe sua assinatura aqui</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-3 border-t bg-gray-50 dark:bg-gray-900">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clear}
            disabled={disabled || isEmpty}
            className="flex items-center gap-2"
          >
            <Eraser className="w-4 h-4" />
            Limpar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={disabled || isEmpty}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Assinatura
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-500">
        Use o mouse ou toque na tela para desenhar sua assinatura
      </p>
    </div>
  )
}
