'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground">{error.message || 'Erro inesperado'}</p>
      <button onClick={reset} className="text-sm text-primary hover:underline">
        Tentar novamente
      </button>
    </div>
  )
}
