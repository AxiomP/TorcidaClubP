'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, MessageCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Database } from '@/types/database'

type Beneficio = Database['public']['Tables']['beneficios']['Row']

interface CompartilharSectionProps {
  codigoReferencia: string | null
  beneficios: Beneficio[]
  nomeTorcida?: string
}

export function CompartilharSection({
  codigoReferencia,
  beneficios,
  nomeTorcida = 'nossa torcida',
}: CompartilharSectionProps) {
  const [copiado, setCopiado] = useState(false)

  const linkConvite = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    return codigoReferencia
      ? `${baseUrl}/cadastro?ref=${codigoReferencia}`
      : `${baseUrl}/cadastro`
  }, [codigoReferencia])

  const mensagemWhatsApp = useMemo(() => {
    const beneficiosAtivos = beneficios.filter((b) => b.ativo)
    const beneficiosTexto =
      beneficiosAtivos.length > 0
        ? beneficiosAtivos
            .slice(0, 5)
            .map((b) => `- ${b.titulo}`)
            .join('\n')
        : '- Acesso exclusivo a eventos\n- Descontos em ingressos\n- Participação na comunidade'

    return `Faça parte de ${nomeTorcida}!

Benefícios:
${beneficiosTexto}

Cadastre-se agora: ${linkConvite}`
  }, [beneficios, nomeTorcida, linkConvite])

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkConvite)
      setCopiado(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('Erro ao copiar link')
    }
  }

  const handleCompartilharWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsApp)}`
    window.open(url, '_blank')
  }

  const handleCompartilharNativo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${nomeTorcida}`,
          text: mensagemWhatsApp,
          url: linkConvite,
        })
      } catch (err) {
        // Usuário cancelou ou erro
        if ((err as Error).name !== 'AbortError') {
          toast.error('Erro ao compartilhar')
        }
      }
    } else {
      handleCopiarLink()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-500" />
          Convide Amigos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Compartilhe o link de convite e ajude a torcida a crescer!
        </p>

        {/* Link de convite */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
          <code className="flex-1 text-sm truncate">{linkConvite}</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopiarLink}
            className="shrink-0"
          >
            {copiado ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Botões de compartilhamento */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleCopiarLink}
            variant="outline"
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copiado ? 'Copiado!' : 'Copiar Link'}
          </Button>

          <Button
            onClick={handleCompartilharWhatsApp}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>

          {'share' in navigator && (
            <Button
              onClick={handleCompartilharNativo}
              variant="secondary"
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          )}
        </div>

        {codigoReferencia && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Seu código de indicação: <strong>{codigoReferencia}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
