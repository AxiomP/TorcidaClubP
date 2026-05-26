'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Gift, Check } from 'lucide-react'
import type { Database } from '@/types/database'

type Beneficio = Database['public']['Tables']['beneficios']['Row']

interface BeneficiosSectionProps {
  beneficios: Beneficio[]
  loading?: boolean
}

export function BeneficiosSection({ beneficios, loading }: BeneficiosSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" />
            Benefícios da Torcida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-5 w-5 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!beneficios || beneficios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" />
            Benefícios da Torcida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhum benefício cadastrado ainda.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-500" />
          Benefícios da Torcida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {beneficios
            .filter((b) => b.ativo)
            .sort((a, b) => a.ordem - b.ordem)
            .map((beneficio) => (
              <div
                key={beneficio.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{beneficio.titulo}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {beneficio.descricao}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
