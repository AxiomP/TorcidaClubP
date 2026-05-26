'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  UserCheck,
  CalendarPlus,
  Share2,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QuickActionsGridProps {
  torcidaId?: string | null
}

export function QuickActionsGrid({ torcidaId }: QuickActionsGridProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareLink = torcidaId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?torcida_id=${torcidaId}`
    : null

  const handleCopy = () => {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 3000)
  }

  const handleWhatsApp = () => {
    if (!shareLink) return
    const texto = encodeURIComponent(`Faça parte da nossa torcida! Cadastre-se pelo link: ${shareLink}`)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Ações Rápidas</h2>
        <p className="text-muted-foreground">
          Acesso rápido às principais funcionalidades
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/gestor/pagamentos?status=comprovante_enviado" prefetch={false}>
          <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-primary/50">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-green-100 flex-shrink-0">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate">Aprovar Pagamentos</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Validar comprovantes enviados</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/gestor/cadastros" prefetch={false}>
          <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-primary/50">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-purple-100 flex-shrink-0">
                <UserCheck className="h-7 w-7 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate">Aprovar Cadastros</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Revisar novos membros</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/gestor/eventos/novo" prefetch={false}>
          <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-primary/50">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-pink-100 flex-shrink-0">
                <CalendarPlus className="h-7 w-7 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate">Criar Eventos</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Cadastrar novo evento</p>
              </div>
            </div>
          </Card>
        </Link>

        <button onClick={() => setShareOpen(true)} className="text-left w-full">
          <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-primary/50">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-100 flex-shrink-0">
                <Share2 className="h-7 w-7 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate">Compartilhar Link</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">Recrutar novos sócios</p>
              </div>
            </div>
          </Card>
        </button>
      </div>

      {/* Diálogo de compartilhamento */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              Compartilhar Link de Cadastro
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe este link para que novos sócios se cadastrem diretamente na sua torcida.
            </p>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
              {shareLink ? (
                <code className="flex-1 text-xs break-all text-foreground">
                  {shareLink}
                </code>
              ) : (
                <p className="flex-1 text-sm text-muted-foreground">Carregando link...</p>
              )}
              <Button variant="outline" size="icon" onClick={handleCopy} className="flex-shrink-0">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar via WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
