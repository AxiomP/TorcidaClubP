'use client'

import { useAuth } from '@/hooks/use-auth'
import { TabMensalidades } from '@/components/configuracoes/tab-mensalidades'
import { Loader2 } from 'lucide-react'

export default function TiposMensalidadePage() {
  const { torcidaId, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!torcidaId) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tipos de Mensalidade</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os planos de mensalidade disponíveis para os sócios da sua torcida
        </p>
      </div>
      <TabMensalidades torcidaId={torcidaId} isActive={true} />
    </div>
  )
}
