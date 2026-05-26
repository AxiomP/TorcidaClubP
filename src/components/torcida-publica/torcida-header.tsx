'use client'

/**
 * TorcidaHeader - Cabeçalho da página pública da torcida
 * Exibe: brasão, nome com selo de verificação, frase de efeito
 */

import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'
import { getHexFromPreset } from '@/lib/utils/color-presets'

interface TorcidaHeaderProps {
  nome: string
  brasaoUrl: string | null
  fraseEfeito: string | null
  corFundo: string
  isAtiva: boolean
}

export function TorcidaHeader({
  nome,
  brasaoUrl,
  fraseEfeito,
  corFundo,
  isAtiva,
}: TorcidaHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-4">
      {/* Brasão/Logo */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40">
        {brasaoUrl ? (
          <Image
            src={brasaoUrl}
            alt={`Brasão ${nome}`}
            fill
            className="object-contain rounded-full"
            priority
            unoptimized
          />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-4xl font-bold text-white"
            style={{ backgroundColor: getHexFromPreset(corFundo) || '#333' }}
          >
            {nome.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Nome da Torcida + Selo de Verificação */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {nome}
        </h1>
        {isAtiva && (
          <BadgeCheck className="w-6 h-6 text-blue-500" aria-label="Torcida verificada" />
        )}
      </div>

      {/* Frase de Efeito */}
      {fraseEfeito && (
        <p className="text-lg text-gray-300 max-w-md">
          {fraseEfeito}
        </p>
      )}
    </div>
  )
}
