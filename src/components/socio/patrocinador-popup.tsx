'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Patrocinador {
  id: string
  texto_curto: string
  imagem_url: string | null
  link: string | null
}

interface PatrocinadorPopupProps {
  torcidaId: string | null
}

export function PatrocinadorPopup({ torcidaId }: PatrocinadorPopupProps) {
  const [patrocinador, setPatrocinador] = useState<Patrocinador | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!torcidaId) return

    // Mostrar apenas 1x por sessão
    const sessionKey = `patrocinador_visto_${torcidaId}`
    if (sessionStorage.getItem(sessionKey)) return

    fetch(`/api/patrocinadores?torcida_id=${torcidaId}`)
      .then(r => r.json())
      .then((data: Patrocinador[]) => {
        if (data && data.length > 0) {
          // Selecionar patrocinador aleatório
          const random = data[Math.floor(Math.random() * data.length)]
          setPatrocinador(random)
          setVisible(true)
          sessionStorage.setItem(sessionKey, '1')
        }
      })
      .catch(() => {})
  }, [torcidaId])

  if (!visible || !patrocinador) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Imagem */}
        {patrocinador.imagem_url && (
          <div className="relative w-full h-40">
            <Image
              src={patrocinador.imagem_url}
              alt="Patrocinador"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="p-6">
          <p className="text-sm leading-relaxed mb-4">{patrocinador.texto_curto}</p>

          <div className="flex gap-3">
            {patrocinador.link && (
              <a
                href={patrocinador.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Saiba Mais
              </a>
            )}
            <Button
              variant="outline"
              onClick={() => setVisible(false)}
              className={patrocinador.link ? '' : 'flex-1'}
            >
              <X className="h-4 w-4 mr-1" />
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
