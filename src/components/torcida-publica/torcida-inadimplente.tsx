'use client'

/**
 * TorcidaInadimplente - Card de alerta quando a torcida está inadimplente ou cancelada
 * Estilo "cartão vermelho" como na referência visual
 */

interface TorcidaInadimplenteProps {
  slug: string
  status?: string
}

export function TorcidaInadimplente({ slug, status }: TorcidaInadimplenteProps) {
  const isCancelado = status === 'cancelado'

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Card de Alerta Vermelho */}
      <div className="bg-red-600/90 rounded-lg p-4 text-center">
        {isCancelado ? (
          <p className="text-white font-medium">
            A torcida <span className="font-bold">@{slug}</span> nao esta mais
            disponivel na plataforma.
          </p>
        ) : (
          <p className="text-white font-medium">
            Parece que <span className="font-bold">@{slug}</span> levou um{' '}
            <span className="font-bold">Cartao Vermelho</span> e nao esta mais em campo!
          </p>
        )}
      </div>

      {/* Mensagem para o Gestor */}
      {!isCancelado && (
        <div className="text-center space-y-4">
          <p className="text-white font-medium">
            Ei, Gestor! Para resolver isso, clique no botao abaixo e efetue o pagamento!
          </p>

          <a
            href="/login"
            className="inline-flex items-center justify-center w-full h-14 px-6 text-lg font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            CLIQUE PARA CONTINUAR
          </a>
        </div>
      )}

      {isCancelado && (
        <div className="text-center">
          <p className="text-white/70 text-sm">
            Se voce e o gestor desta torcida, entre em contato com o suporte para reativar.
          </p>
        </div>
      )}
    </div>
  )
}
