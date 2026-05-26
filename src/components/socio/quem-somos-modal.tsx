'use client'

import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface QuemSomosModalProps {
  torcidaId: string | null
  trigger?: React.ReactNode
  onOpen?: () => void
}

export function QuemSomosModal({ torcidaId, trigger, onOpen }: QuemSomosModalProps) {
  const [quemSomos, setQuemSomos] = useState<string | null>(null)
  const [nomeTorcida, setNomeTorcida] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!torcidaId || !open) return
    setLoading(true)
    fetch(`/api/torcida/${torcidaId}/quem-somos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setNomeTorcida(d?.nome || '')
        setQuemSomos(d?.quem_somos || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [torcidaId, open])

  if (!torcidaId) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) onOpen?.() }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors">
            <Info className="h-4 w-4" />
            Quem Somos
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {nomeTorcida || 'Quem Somos'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : quemSomos ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {quemSomos}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma informação disponível no momento.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

