'use client'

/**
 * TorcidaActions - Botões de ação da página pública
 * Exibe: "Fazer parte da torcida" e "Fazer login"
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus, LogIn } from 'lucide-react'

interface TorcidaActionsProps {
  torcidaId: string
}

export function TorcidaActions({ torcidaId }: TorcidaActionsProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      {/* Botão Fazer Parte */}
      <Link href={`/cadastro?torcida_id=${torcidaId}`} className="w-full">
        <Button
          className="w-full h-14 text-lg font-semibold bg-[#FAB515] hover:bg-[#FAB515]/90 text-[#252525] transition-all hover:scale-105"
          size="lg"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          FAZER PARTE DA TORCIDA
        </Button>
      </Link>

      {/* Botão Login */}
      <Link href="/login" className="w-full">
        <Button
          variant="outline"
          className="w-full h-14 text-lg font-semibold border-2 border-[#FAB515] text-[#FAB515] hover:bg-[#FAB515]/10 transition-all hover:scale-105"
          size="lg"
        >
          <LogIn className="w-5 h-5 mr-2" />
          FAZER LOGIN
        </Button>
      </Link>
    </div>
  )
}
