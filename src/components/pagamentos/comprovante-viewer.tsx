'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Download, ZoomIn } from 'lucide-react'
import Image from 'next/image'

interface ComprovanteViewerProps {
  isOpen: boolean
  onClose: () => void
  comprovanteUrl: string
  socioNome: string
}

export function ComprovanteViewer({
  isOpen,
  onClose,
  comprovanteUrl,
  socioNome,
}: ComprovanteViewerProps) {
  const handleDownload = async () => {
    try {
      // Fazer fetch do arquivo
      const response = await fetch(comprovanteUrl)
      const blob = await response.blob()

      // Criar URL temporária
      const url = window.URL.createObjectURL(blob)

      // Extrair nome do arquivo da URL ou usar padrão
      const fileName = comprovanteUrl.split('/').pop() || 'comprovante.jpg'

      // Criar link de download
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      // Limpar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error)
      alert('Erro ao baixar arquivo. Tente novamente.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Comprovante de Pagamento">

      <div className="modal-body">
        <div className="mb-4">
          <p className="text-sm text-gray-600">Sócio:</p>
          <p className="font-semibold">{socioNome}</p>
        </div>

        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={comprovanteUrl}
            alt="Comprovante de pagamento"
            width={600}
            height={400}
            className="w-full h-auto"
            priority
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <ZoomIn className="h-4 w-4" />
          <span>Clique na imagem para ampliar (será implementado)</span>
        </div>
      </div>

      <div className="modal-footer">
        <Button variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </Button>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  )
}
