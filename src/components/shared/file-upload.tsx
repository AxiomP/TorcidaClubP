'use client'

/**
 * Componente de upload de arquivos com drag & drop
 * Baseado em RN028: Validação de Arquivos
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, FileImage, FileText, Loader2 } from 'lucide-react'
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout'
import { validarArquivo } from '@/lib/validations/file-validator'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  tipo: 'imagem' | 'pdf'
  bucket: string // Nome do bucket no Supabase Storage
  onUpload: (url: string) => void
  onRemove?: () => void
  onUploadingChange?: (isUploading: boolean) => void // Notifica mudanças no estado de upload
  valor?: string
  label?: string
  disabled?: boolean
  className?: string
}

export function FileUpload({
  tipo,
  bucket,
  onUpload,
  onRemove,
  onUploadingChange,
  valor,
  label,
  disabled = false,
  className = '',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(valor || null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setError(null)

      // Validar arquivo
      const validacao = validarArquivo(file, tipo)
      if (!validacao.valido) {
        setError(validacao.erro || 'Arquivo inválido')
        return
      }

      setUploading(true)
      onUploadingChange?.(true) // Notificar início do upload

      try {
        // Criar FormData
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', bucket)

        // Upload para API
        const response = await fetchWithTimeout(
          '/api/upload',
          {
            method: 'POST',
            body: formData,
          },
          60000 // 60s timeout para upload de arquivo
        )

        // Verificar se resposta é JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          // Resposta não é JSON (provavelmente HTML de erro)
          const text = await response.text()
          console.error('Resposta não-JSON da API:', text.substring(0, 200))
          throw new Error(
            'Erro de servidor ao fazer upload. Verifique se os buckets do Supabase Storage estão configurados corretamente. Consulte docs/CONFIGURAR-SUPABASE-STORAGE.md'
          )
        }

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Sessão expirada. Recarregue a página e tente novamente.')
          }
          throw new Error(data.error || data.message || 'Erro ao fazer upload')
        }

        if (!data.url) {
          throw new Error('URL do arquivo não foi retornada pela API')
        }

        const fileUrl = data.url

        // Preview para imagens
        if (tipo === 'imagem') {
          const reader = new FileReader()
          reader.onload = (e) => {
            setPreview(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        } else {
          setPreview(file.name)
        }

        onUpload(fileUrl)
      } catch (err: unknown) {
        console.error('Erro no upload:', err)

        // Mensagens de erro específicas
        let errorMessage = 'Erro ao fazer upload do arquivo'

        // Tratamento específico para timeout
        if (err instanceof DOMException && err.name === 'AbortError') {
          errorMessage = 'Upload demorou muito tempo. Tente novamente com uma conexão melhor.'
        } else if (err instanceof Error) {
          errorMessage = err.message
        } else if (typeof err === 'string') {
          errorMessage = err
        }

        // Adicionar contexto baseado no tipo de erro
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
        } else if (errorMessage.includes('404')) {
          errorMessage = 'API de upload não encontrada. Entre em contato com o suporte.'
        } else if (errorMessage.includes('500')) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.'
        }

        setError(errorMessage)
      } finally {
        setUploading(false)
        onUploadingChange?.(false) // Notificar fim do upload
      }
    },
    [tipo, bucket, onUpload, onUploadingChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: tipo === 'imagem'
      ? { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }
      : { 'application/pdf': ['.pdf'] },
    maxSize: tipo === 'imagem' ? 5 * 1024 * 1024 : 10 * 1024 * 1024,
    multiple: false,
    disabled: disabled || uploading,
  })

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onRemove?.()
  }

  // Se já tem preview, mostrar
  if (preview && !uploading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <label className="text-sm font-medium">{label}</label>
        )}
        <div className="relative border-2 border-dashed border-green-300 bg-green-50 dark:bg-green-950 rounded-lg p-4">
          <div className="flex items-center gap-4">
            {tipo === 'imagem' ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-red-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {typeof preview === 'string' && preview.includes('/')
                    ? 'Arquivo enviado'
                    : preview}
                </span>
              </div>
            )}
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                ✓ Arquivo enviado
              </span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                  Remover
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
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive
            ? 'border-torcida-laranja bg-torcida-laranja/10'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-700'
          }
          ${uploading || disabled
            ? 'opacity-50 cursor-not-allowed'
            : ''
          }
        `}
      >
        <input {...getInputProps()} disabled={disabled || uploading} />

        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-torcida-laranja animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enviando arquivo...
              </p>
            </>
          ) : (
            <>
              {tipo === 'imagem' ? (
                <FileImage className="w-12 h-12 text-gray-400" />
              ) : (
                <FileText className="w-12 h-12 text-gray-400" />
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDragActive
                    ? 'Solte o arquivo aqui'
                    : 'Arraste ou clique para selecionar'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {tipo === 'imagem'
                    ? 'PNG, JPG, JPEG ou WEBP até 5MB'
                    : 'PDF até 10MB'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-2">
          {error}
        </div>
      )}
    </div>
  )
}
