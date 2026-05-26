'use client'

/**
 * TorcidaFooter - Rodapé institucional da página pública
 */

export function TorcidaFooter() {
  return (
    <footer className="text-center space-y-2 py-8 border-t border-gray-800">
      {/* URL do Site */}
      <p className="text-sm font-semibold text-white tracking-wide">
        TORCIDACLUBOFICIAL.COM.BR
      </p>

      {/* Slogan */}
      <p className="text-xs text-gray-400">
        Solucao para Torcidas Organizadas
      </p>

      {/* Bandeira do Brasil */}
      <div className="flex justify-center pt-2">
        <span className="text-2xl" role="img" aria-label="Bandeira do Brasil">
          🇧🇷
        </span>
      </div>
    </footer>
  )
}
