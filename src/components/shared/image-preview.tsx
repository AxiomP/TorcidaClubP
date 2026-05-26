'use client'

/**
 * Componente para preview de imagens
 */

import { useState } from 'react'
import { X, ZoomIn, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImagePreviewProps {
  src: string
  alt: string
  onRemove?: () => void
  showRemove?: boolean
  className?: string
}

export function ImagePreview({
  src,
  alt,
  onRemove,
  showRemove = true,
  className = '',
}: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt || 'imagem.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar imagem:', error)
    }
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-lg"
        />

        {/* Overlay com ações */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-2"
          >
            <ZoomIn className="w-4 h-4" />
            Ampliar
          </Button>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar
          </Button>

          {showRemove && onRemove && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onRemove}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Remover
            </Button>
          )}
        </div>
      </div>

      {/* Modal fullscreen */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="w-8 h-8" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

/**
 * Componente para grid de imagens
 */
interface ImageGridProps {
  images: Array<{
    src: string
    alt: string
    label?: string
  }>
  columns?: number
  className?: string
}

export function ImageGrid({
  images,
  columns = 3,
  className = '',
}: ImageGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols]} ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="space-y-2">
          {image.label && (
            <label className="text-sm font-medium">{image.label}</label>
          )}
          <ImagePreview
            src={image.src}
            alt={image.alt}
            showRemove={false}
            className="aspect-square"
          />
        </div>
      ))}
    </div>
  )
}
