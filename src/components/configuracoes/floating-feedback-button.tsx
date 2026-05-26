'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SugestaoModal } from './sugestao-modal'
import dynamic from 'next/dynamic'

const MessageSquarePlus = dynamic(() => import('lucide-react').then(mod => ({ default: mod.MessageSquarePlus })), { ssr: false })

interface FloatingFeedbackButtonProps {
  torcidaId: string
}

export function FloatingFeedbackButton({ torcidaId }: FloatingFeedbackButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {/* Botão flutuante */}
      <Button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        size="icon"
        title="Enviar sugestão"
      >
        <MessageSquarePlus className="h-6 w-6" />
      </Button>

      {/* Modal de sugestão */}
      <SugestaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        torcidaId={torcidaId}
      />
    </>
  )
}
