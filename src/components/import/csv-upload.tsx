'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CSVUploadProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  className?: string
}

export function CSVUpload({ onFileSelect, disabled = false, className }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (selectedFile: File): boolean => {
    setError(null)

    // Verificar extensão
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Apenas arquivos CSV são aceitos')
      return false
    }

    // Verificar tamanho (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB')
      return false
    }

    return true
  }

  const handleFile = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      onFileSelect(selectedFile)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Área de Drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          'flex flex-col items-center justify-center gap-4 min-h-[200px]',
          dragActive && !disabled && 'border-primary bg-primary/5',
          !dragActive && !disabled && 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500/50'
        )}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {!file ? (
          <>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Arraste o arquivo CSV aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 10MB
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Instruções */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Formato esperado:</strong> CSV exportado da plataforma antiga</p>
        <p><strong>Colunas obrigatórias:</strong> SOCIO-NOME, SOCIO-EMAIL, SOCIO-CPF, SOCIO-WPP</p>
        <p><strong>Codificação:</strong> UTF-8 (recomendado)</p>
      </div>
    </div>
  )
}
